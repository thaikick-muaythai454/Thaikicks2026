// Supabase Edge Function to handle Stripe Refunds
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
        const { bookingId, reason = 'requested_by_customer' } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Fetch Booking Details
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            throw new Error(`Booking not found: ${bookingId}`);
        }

        const piId = booking.stripe_payment_intent_id;
        if (!piId) {
            throw new Error(`No Payment Intent ID found for booking ${bookingId}. Refund must be handled manually in Stripe dashboard.`);
        }

        // 2. Execute Refund via Stripe
        const refund = await stripe.refunds.create({
            payment_intent: piId,
            reason: reason as any,
        });

        // 3. Update ALL Bookings associated with this Payment Intent
        const { error: updateError } = await supabase
            .from("bookings")
            .update({
                status: "cancelled",
                payment_status: "refunded",
                admin_notes: `Full Refund processed on ${new Date().toISOString()}. Refund ID: ${refund.id}`
            })
            .eq("stripe_payment_intent_id", piId);

        if (updateError) {
            console.error("Failed to update booking status after refund:", updateError);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            refundId: refund.id,
            status: refund.status 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Refund error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
