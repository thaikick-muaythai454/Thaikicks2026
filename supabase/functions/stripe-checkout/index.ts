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
        const { orderId, successUrl, cancelUrl } = await req.json();

        // 1. Get the order from database to verify amount
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

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

        if (orderError || !order) {
            throw new Error(`Order not found: ${orderId}`);
        }

        // 2. Create line items for Stripe
        const line_items = order.items.map((item: any) => ({
            price_data: {
                currency: "thb",
                product_data: {
                    name: item.products?.name || "Product",
                },
                unit_amount: Math.round(item.price_at_purchase * 100), // in satang
            },
            quantity: item.quantity,
        }));

        // 3. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "promptpay"],
            line_items,
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                order_id: orderId,
            },
        });

        // 4. Save session ID to order
        await supabase
            .from("shop_orders")
            .update({ stripe_session_id: session.id })
            .eq("id", orderId);

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
