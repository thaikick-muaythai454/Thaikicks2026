// Supabase Edge Function to create a Stripe Checkout Session
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { orderId, successUrl, cancelUrl, type = 'shop', paymentMethods } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        let line_items = [];

        if (type === 'booking') {
            // Processing a Booking
            const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .select("*")
                .eq("id", orderId)
                .single();

            if (bookingError || !booking) throw new Error(`Booking not found: ${orderId}`);

            line_items = [{
                price_data: {
                    currency: "thb",
                    product_data: {
                        name: `Booking at ${booking.gym_name || 'Gym'}`,
                        description: `${booking.type.toUpperCase()} - ${booking.date}`,
                    },
                    unit_amount: Math.round(booking.total_price * 100), // in satang
                },
                quantity: 1,
            }];

        } else {
            // Processing a Shop Order
            const { data: order, error: orderError } = await supabase
                .from("shop_orders")
                .select(`
                    *,
                    items:shop_order_items(
                        quantity,
                        price_at_purchase,
                        products(name)
                    )
                `)
                .eq("id", orderId)
                .single();

            if (orderError || !order) throw new Error(`Shop Order not found: ${orderId}`);

            line_items = order.items.map((item: any) => ({
                price_data: {
                    currency: "thb",
                    product_data: {
                        name: item.products?.name || "Product",
                    },
                    unit_amount: Math.round(item.price_at_purchase * 100), // in satang
                },
                quantity: item.quantity,
            }));
        }

        // 3. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods || ["card", "promptpay"],
            line_items,
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                order_id: orderId,
                type: type // Important for webhook
            },
        });

        // 4. Save session ID
        if (type === 'booking') {
            // Wait until webhook to finalize, but could save session id if we had a column
            await supabase
                .from("bookings")
                .update({ stripe_session_id: session.id })
                .eq("id", orderId);
        } else {
            await supabase
                .from("shop_orders")
                .update({ stripe_session_id: session.id })
                .eq("id", orderId);
        }

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
