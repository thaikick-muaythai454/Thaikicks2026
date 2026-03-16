import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { userId } = await req.json();

        // 1. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // 2. Validate requester is an Admin
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) throw new Error("Unauthorized");

        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            throw new Error("Only admins can delete users");
        }

        // 3. Delete the user from Auth (this usually triggers cascade deletes in public.users if set up, 
        // or we handle public.users delete manually if not)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ message: "User deleted successfully" }), {
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
