// Supabase Edge Function to handle Stripe Webhooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    try {
        const body = await req.text();
        let event;

        if (endpointSecret) {
            event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
        } else {
            event = JSON.parse(body);
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const orderId = session.metadata?.order_id;

            if (orderId) {
                // Update order status to paid
                await supabase
                    .from("shop_orders")
                    .update({
                        status: "paid",
                        payment_status: "paid",
                        payment_verified_at: new Date().toISOString(),
                        stripe_payment_intent_id: session.payment_intent,
                        admin_notes: `Stripe Session ID: ${session.id}`
                    })
                    .eq("id", orderId);

                console.log(`Order ${orderId} successfully paid.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error(`Webhook error: ${error.message}`);
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }
});
