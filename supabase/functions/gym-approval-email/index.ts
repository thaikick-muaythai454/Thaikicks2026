import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { gymId, newStatus } = await req.json();

        if (!gymId || !newStatus) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch Gym and Owner details
        const { data: gym, error: gymError } = await supabase
            .from("gyms")
            .select(`
                name,
                owner_id,
                owner:users!gyms_owner_id_fkey(email, name)
            `)
            .eq("id", gymId)
            .single();

        if (gymError || !gym || !gym.owner) {
            console.error("Gym or Owner not found", gymError);
            return new Response(JSON.stringify({ error: "Gym or Owner not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const ownerEmail = gym.owner.email;
        const ownerName = gym.owner.name;

        // Define Email Properties
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        let subject = "";
        let htmlContent = "";

        if (newStatus === 'approved') {
            subject = 'Your Gym/Camp is Approved - ThaiKicks';
            htmlContent = `
                <div style="font-family: monospace; padding: 20px;">
                    <h2>Congratulations, ${ownerName}!</h2>
                    <p>Your facility <strong>${gym.name}</strong> has been <strong>approved</strong> and is now visible on ThaiKicks.</p>
                    <p>You can now log in to the Owner Dashboard to manage your schedule, trainers, and bookings.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p>The ThaiKicks Administration Team</p>
                </div>
            `;
        } else if (newStatus === 'rejected') {
            subject = 'Your Gym/Camp Application Update - ThaiKicks';
            htmlContent = `
                <div style="font-family: monospace; padding: 20px;">
                    <h2>Hello ${ownerName},</h2>
                    <p>We have reviewed your request for <strong>${gym.name}</strong>.</p>
                    <p>Unfortunately, it has been <strong>rejected</strong> at this time. Please ensure that all information provided meets our criteria and try editing your profile again.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p>The ThaiKicks Administration Team</p>
                </div>
            `;
        } else {
            return new Response(JSON.stringify({ message: "No email sent for this status." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Send Email via Resend
        if (resendApiKey && ownerEmail) {
            const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ThaiKicks Admin <admin@thaikicks.com>', // Assuming domain is configured
                    to: [ownerEmail],
                    subject: subject,
                    html: htmlContent
                })
            });

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error('Failed to send email:', errorText);
            } else {
                console.log('Status update email sent to', ownerEmail);
            }
        } else {
            console.log("RESEND_API_KEY or owner email not available. Skipping email sending.");
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error(`Webhook error: ${error.message}`);
        return new Response(`Error: ${error.message}`, {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
