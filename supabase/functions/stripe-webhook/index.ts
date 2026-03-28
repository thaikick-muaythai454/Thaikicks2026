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
            const type = session.metadata?.type || 'shop'; // Default to shop for backward compatibility

            if (orderId || session.metadata?.is_new_order === 'true') {
                if (type === 'booking') {
                    // orderId could be a comma-separated string of IDs
                    const bookingIds = orderId.split(',');

                    // Update BOOKING status to confirmed and save payment intent
                    const { data: updatedBookings, error: updateError } = await supabase
                        .from("bookings")
                        .update({
                            status: "confirmed",
                            payment_status: "paid",
                            stripe_session_id: session.id,
                            stripe_payment_intent_id: session.payment_intent // Crucial for refunds
                        })
                        .in("id", bookingIds)
                        .select();

                    if (!updateError && updatedBookings && updatedBookings.length > 0) {
                        const updatedBooking = updatedBookings[0]; // Use first for email info
                        console.log(`Bookings ${orderId} successfully confirmed.`);

                        // Process Affiliate Commissions for Bookings
                        try {
                            // Sum commission from all bookings that have an affiliate code
                            const bookingsWithAffiliate = updatedBookings.filter(
                                (b: any) => b.commission_paid_to && b.commission_amount > 0
                            );

                            if (bookingsWithAffiliate.length > 0) {
                                const affiliateCode = bookingsWithAffiliate[0].commission_paid_to;
                                const totalCommission = bookingsWithAffiliate.reduce(
                                    (sum: number, b: any) => sum + (b.commission_amount || 0), 0
                                );

                                // Find the affiliate user by code
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
                                    console.log(`Credited ${totalCommission} THB to affiliate ${affiliateCode} from booking`);
                                }
                            }
                        } catch (affErr) {
                            console.error('Error processing booking affiliate commission:', affErr);
                        }

                        // SEND CONFIRMATION EMAIL
                        const resendApiKey = Deno.env.get("RESEND_API_KEY");
                        if (resendApiKey) {
                            try {
                                const emailHtml = generateBookingEmailHTML({
                                    gymName: updatedBooking.gym_name,
                                    bookingDate: updatedBooking.date,
                                    bookingType: updatedBooking.type,
                                    bookingId: updatedBooking.id,
                                    customerName: updatedBooking.user_name,
                                    amount: updatedBooking.total_price,
                                    currency: 'THB'
                                });

                                // We need user email. Assuming we have user_id, let's fetch email from auth via admin or use fallback. 
                                // Actually, session.customer_details.email contains the Stripe checkout email!
                                const customerEmail = session.customer_details?.email;

                                if (customerEmail) {
                                    const emailResponse = await fetch('https://api.resend.com/emails', {
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
                                    if (!emailResponse.ok) {
                                        console.error('Failed to send email:', await emailResponse.text());
                                    } else {
                                        console.log('Confirmation email sent to', customerEmail);
                                    }
                                }
                            } catch (e) {
                                console.error('Error sending confirmation email:', e);
                            }
                        } else {
                            console.log("RESEND_API_KEY not set. Skipping email sending.");
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

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error(`Webhook error: ${error.message}`);
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }
});
