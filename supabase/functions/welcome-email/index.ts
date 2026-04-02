import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWelcomeEmailHTML } from "../shared/email-template.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json();
        
        // This function will be triggered by a Database Webhook
        // The record sent by the webhook will be in payload.record
        const record = payload.record;
        
        if (!record || !record.email) {
            return new Response(JSON.stringify({ error: "No user record found" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const userName = record.name || record.email.split('@')[0];

        if (!resendApiKey) {
            console.error("RESEND_API_KEY not set");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ThaiKicks <welcome@thaikicks.com>',
                to: [record.email],
                subject: 'Welcome to ThaiKicks!',
                html: generateWelcomeEmailHTML({ customerName: userName })
            })
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send welcome email:', errorText);
            return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
