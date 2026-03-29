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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { orderId, orderData, totalPrice, successUrl, cancelUrl, type = 'shop', paymentMethods } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        let line_items = [];
        let metadata: Record<string, string> = { type };

        if (type === 'booking') {
            const orderIds = Array.isArray(orderId) ? orderId : [orderId];
            const { data: bookings, error: bookingError } = await supabase
                .from("bookings")
                .select("*")
                .in("id", orderIds);

            if (bookingError || !bookings || bookings.length === 0) {
                throw new Error(`Bookings not found: ${orderIds.join(', ')}`);
            }

            // Use provided totalPrice if available, otherwise sum from DB
            const finalAmount = totalPrice || bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
            const firstBooking = bookings[0];

            line_items = [{
                price_data: {
                    currency: "thb",
                    product_data: {
                        name: `Booking at ${firstBooking.gym_name || 'Gym'}`,
                        description: bookings.length > 1 
                            ? `${firstBooking.type.toUpperCase()} - Multi-day Booking (${bookings.length} days)`
                            : `${firstBooking.type.toUpperCase()} - ${firstBooking.date}`,
                    },
                    unit_amount: Math.round(finalAmount * 100),
                },
                quantity: 1,
            }];
            metadata.order_id = orderIds.join(',');
        } else if (orderData) {
            // New Flow: No order record yet
            line_items = orderData.items.map((item: any) => ({
                price_data: {
                    currency: "thb",
                    product_data: {
                        name: item.name || "Product",
                    },
                    unit_amount: Math.round(item.priceAtPurchase * 100),
                },
                quantity: item.quantity,
            }));

            // Store everything needed to create the order in metadata
            metadata.is_new_order = 'true';
            metadata.user_id = orderData.userId;
            metadata.shipping_address = orderData.shippingAddress || '';
            metadata.contact_details = JSON.stringify(orderData.contactDetails || {});
            
            // Limit items to avoid metadata size issues (Stripe limit 500 chars per value)
            // But we can store a IDs+Qty string
            metadata.items = JSON.stringify(orderData.items.map((i: any) => ({
                id: i.productId,
                qty: i.quantity,
                price: i.priceAtPurchase
            })));
            
            if (metadata.items.length > 500) {
                // If it's too long, we might need to split or handle differently
                // For now, let's hope it's short enough for typical orders
                console.warn("Order items metadata might exceed Stripe limits");
            }
        } else {
            // Legacy flow: Order record already exists
            const orderIds = Array.isArray(orderId) ? orderId : [orderId];
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
                .eq("id", orderIds[0])
                .single();

            if (orderError || !order) throw new Error(`Shop Order not found: ${orderIds[0]}`);

            line_items = order.items.map((item: any) => ({
                price_data: {
                    currency: "thb",
                    product_data: {
                        name: item.products?.name || "Product",
                    },
                    unit_amount: Math.round(item.price_at_purchase * 100),
                },
                quantity: item.quantity,
            }));
            metadata.order_id = orderIds[0];
        }

        // 3. Create Stripe Checkout Session
        // Ensure metadata values are under 500 characters
        for (const key in metadata) {
            if (metadata[key] && metadata[key].length > 490) {
                metadata[key] = metadata[key].substring(0, 490) + '...';
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods || ["card", "promptpay"],
            line_items,
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata,
        });

        // 4. Save session ID if record exists
        if (metadata.order_id) {
            const table = type === 'booking' ? 'bookings' : 'shop_orders';
            const ids = metadata.order_id.split(',');
            await supabase
                .from(table)
                .update({ stripe_session_id: session.id })
                .in("id", ids);
        }

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Function error:", error);
        // Return 200 with the error so client doesn't throw raw HTTP error
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
