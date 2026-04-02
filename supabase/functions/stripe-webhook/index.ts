// Supabase Edge Function to handle Stripe Webhooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";
import { generateBookingEmailHTML, generateShopEmailHTML } from "../shared/email-template.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version, stripe-signature",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

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
            const type = session.metadata?.type || 'shop';

            if (orderId || session.metadata?.is_new_order === 'true' || session.metadata?.is_new_booking === 'true') {
                if (type === 'booking') {
                    let updatedBookings = [];

                    if (session.metadata?.is_new_booking === 'true') {
                        // ── NEW FLOW: Create bookings from metadata ──────────────────
                        const m = session.metadata;
                        const startDate = new Date(m.start_date);
                        const endDate = new Date(m.end_date);
                        const bType = m.booking_type;
                        const totalPrice = parseFloat(m.total_price || '0');
                        
                        // Calculate count for price distribution
                        let count = 0;
                        const tempDate = new Date(startDate);
                        while (tempDate <= endDate) {
                            count++;
                            if (bType === 'standard') tempDate.setDate(tempDate.getDate() + 1);
                            else tempDate.setDate(tempDate.getDate() + 7);
                            if (bType === 'course') break;
                        }
                        if (count === 0) count = 1;

                        const pricePerSession = Math.round(totalPrice / count);
                        const affiliatePct = parseFloat(m.affiliate_pct || '0');
                        const commissionPerSession = Math.round(pricePerSession * (affiliatePct / 100));

                        const bookingRows = [];
                        const currentDate = new Date(startDate);
                        while (currentDate <= endDate) {
                            bookingRows.push({
                                user_id: m.user_id,
                                user_name: m.user_name,
                                gym_id: m.gym_id,
                                gym_name: m.gym_name,
                                date: currentDate.toISOString().split('T')[0],
                                type: bType,
                                trainer_id: m.trainer_id || null,
                                trainer_name: m.trainer_name || null,
                                start_time: m.start_time || null,
                                end_time: m.end_time || null,
                                course_id: m.course_id || null,
                                course_title: m.course_title || null,
                                total_price: pricePerSession,
                                status: "confirmed",
                                payment_status: "paid",
                                stripe_session_id: session.id,
                                stripe_payment_intent_id: session.payment_intent,
                                commission_paid_to: m.affiliate_code || null,
                                commission_amount: m.affiliate_code ? commissionPerSession : 0
                            });

                            if (bType === 'standard') currentDate.setDate(currentDate.getDate() + 1);
                            else currentDate.setDate(currentDate.getDate() + 7);
                            if (bType === 'course') break;
                        }

                        const { data: created, error: createError } = await supabase
                            .from("bookings")
                            .insert(bookingRows)
                            .select();

                        if (createError) {
                            console.error("Failed to create bookings from metadata:", createError);
                            return new Response(`Error: ${createError.message}`, { status: 500 });
                        }
                        updatedBookings = created || [];
                    } else {
                        // ── LEGACY FLOW: Update existing IDs ──────────────────────────
                        const bookingIds = orderId.split(',');
                        const { data: updated, error: updateError } = await supabase
                            .from("bookings")
                            .update({
                                status: "confirmed",
                                payment_status: "paid",
                                stripe_session_id: session.id,
                                stripe_payment_intent_id: session.payment_intent
                            })
                            .in("id", bookingIds)
                            .select();
                        
                        if (updateError) {
                            console.error(`Failed to update bookings ${orderId}:`, updateError);
                            return new Response(`Error: ${updateError.message}`, { status: 500 });
                        }
                        updatedBookings = updated || [];
                    }

                    if (updatedBookings.length > 0) {
                        const updatedBooking = updatedBookings[0];
                        console.log(`Bookings for user ${updatedBooking.user_id} successfully processed.`);

                        // Process Affiliate Commissions
                        try {
                            const bookingsWithAffiliate = updatedBookings.filter(
                                (b: any) => b.commission_paid_to && b.commission_amount > 0
                            );

                            if (bookingsWithAffiliate.length > 0) {
                                const affiliateCode = bookingsWithAffiliate[0].commission_paid_to;
                                const totalCommission = bookingsWithAffiliate.reduce(
                                    (sum: number, b: any) => sum + (b.commission_amount || 0), 0
                                );

                                const { data: affiliateUser } = await supabase
                                    .from('users')
                                    .select('id, affiliate_earnings, affiliate_status')
                                    .ilike('affiliate_code', affiliateCode)
                                    .single();

                                if (affiliateUser && affiliateUser.affiliate_status === 'active') {
                                    await supabase
                                        .from('users')
                                        .update({
                                            affiliate_earnings: (affiliateUser.affiliate_earnings || 0) + totalCommission
                                        })
                                        .eq('id', affiliateUser.id);
                                    console.log(`Credited ${totalCommission} THB to affiliate ${affiliateCode}`);
                                }
                            }
                        } catch (affErr) {
                            console.error('Affiliate error:', affErr);
                        }

                        // SEND CONFIRMATION EMAIL
                        const resendApiKey = Deno.env.get("RESEND_API_KEY");
                        const customerEmail = session.customer_details?.email;

                        if (resendApiKey && customerEmail) {
                            try {
                                const emailHtml = generateBookingEmailHTML({
                                    gymName: updatedBooking.gym_name,
                                    bookingDate: updatedBooking.date,
                                    bookingType: updatedBooking.type,
                                    bookingId: updatedBooking.id,
                                    customerName: updatedBooking.user_name,
                                    amount: session.amount_total / 100, // Total session amount
                                    currency: 'THB'
                                });

                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${resendApiKey}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        from: 'ThaiKicks <booking@thaikicks.com>',
                                        to: [customerEmail],
                                        subject: 'Booking Confirmed - ThaiKicks',
                                        html: emailHtml
                                    })
                                });
                            } catch (e) {
                                console.error('Email error:', e);
                            }
                        }
                    }

                } else {
                    // Update SHOP ORDER status to paid
                    let workingOrderId = orderId;
                    let existingOrder = null;

                    // Handle New Order Creation from Metadata
                    if (session.metadata?.is_new_order === 'true') {
                        const userId = session.metadata.user_id;
                        const shippingAddress = session.metadata.shipping_address;
                        const contactDetails = session.metadata.contact_details;
                        const items = JSON.parse(session.metadata.items || '[]');

                        // Calculate total amount from items
                        const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0);

                        // 1. Create shop_orders record
                        const { data: newOrder, error: createError } = await supabase
                            .from("shop_orders")
                            .insert({
                                user_id: userId,
                                total_amount: totalAmount,
                                shipping_address: shippingAddress,
                                contact_details: contactDetails,
                                status: "paid",
                                payment_status: "paid",
                                payment_method: "promptpay",
                                payment_verified_at: new Date().toISOString(),
                                stripe_payment_intent_id: session.payment_intent,
                                stripe_session_id: session.id,
                                admin_notes: `Created via Webhook. Session ID: ${session.id}`
                            })
                            .select()
                            .single();

                        if (createError) {
                            console.error("Failed to create shop order from metadata:", createError);
                            return new Response(`Error creating order: ${createError.message}`, { status: 500 });
                        }

                        workingOrderId = newOrder.id;
                        existingOrder = newOrder;

                        // 2. Create shop_order_items records
                        const orderItems = items.map((i: any) => ({
                            order_id: workingOrderId,
                            product_id: i.id,
                            quantity: i.qty,
                            price_at_purchase: i.price
                        }));

                        const { error: itemsError } = await supabase
                            .from("shop_order_items")
                            .insert(orderItems);

                        if (itemsError) {
                            console.error("Failed to create order items:", itemsError);
                            // We created the order but failed items, this is a critical state
                        }
                    } else {
                        // Legacy Flow: Just update existing order
                        const { data: updatedOrder, error: updateError } = await supabase
                            .from("shop_orders")
                            .update({
                                status: "paid",
                                payment_status: "paid",
                                payment_verified_at: new Date().toISOString(),
                                stripe_payment_intent_id: session.payment_intent,
                                admin_notes: `Stripe Session ID: ${session.id}`
                            })
                            .eq("id", workingOrderId)
                            .select()
                            .single();
                        
                        if (updateError) {
                            console.error(`Failed to update Shop Order ${workingOrderId}:`, updateError);
                            return new Response(`Error updating order: ${updateError.message}`, { status: 500 });
                        }
                        existingOrder = updatedOrder;
                    }

                    if (existingOrder) {
                        console.log(`Shop Order ${workingOrderId} successfully processed.`);

                        // SEND CONFIRMATION EMAIL
                        const resendApiKey = Deno.env.get("RESEND_API_KEY");
                        const customerEmail = session.customer_details?.email;

                        const contactData = existingOrder.contact_details ? (typeof existingOrder.contact_details === 'string' ? JSON.parse(existingOrder.contact_details) : existingOrder.contact_details) : {};
                        const customerName = contactData.name || 'Fighter';
                        const shippingAddress = existingOrder.shipping_address || 'TBD';

                        // Fetch items if they weren't in the initial select (for legacy flow)
                        let emailItems = [];
                        if (session.metadata?.is_new_order === 'true') {
                            emailItems = JSON.parse(session.metadata.items).map((i: any) => ({
                                price_at_purchase: i.price,
                                quantity: i.qty
                                // name is missing here, we might need a join or pass names in metadata
                            }));
                        } else {
                            // Fetch items from DB to get product names
                            const { data: dbItems } = await supabase
                                .from('shop_order_items')
                                .select('*, products(name)')
                                .eq('order_id', workingOrderId);
                            emailItems = dbItems || [];
                        }

                        if (resendApiKey && customerEmail) {
                            try {
                                const emailHtml = generateShopEmailHTML({
                                    orderId: existingOrder.id,
                                    customerName: customerName,
                                    amount: existingOrder.total_amount,
                                    currency: 'THB',
                                    items: emailItems,
                                    shippingAddress: shippingAddress
                                });

                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${resendApiKey}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        from: 'ThaiKicks <shop@thaikicks.com>',
                                        to: [customerEmail],
                                        subject: 'Order Confirmed - ThaiKicks',
                                        html: emailHtml
                                    })
                                });
                            } catch (e) {
                                console.error('Error sending shop confirmation email:', e);
                            }
                        }
                    }
                }
            }
        }

        console.log(`Event processed: ${event.type}`);
        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error(`Webhook Error: ${error.message}`);
        // Only return 400 if it was a signature verification failure
        // Otherwise return 200 to acknowledge receipt and prevent Stripe retry loops
        const isVerificationError = error.message.includes("signature");
        return new Response(`Webhook Error: ${error.message}`, { 
            status: isVerificationError ? 400 : 200 
        });
    }
});
