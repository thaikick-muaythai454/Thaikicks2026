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
            const type = session.metadata?.type || 'shop'; // Default to shop for backward compatibility

            if (orderId) {
                if (type === 'booking') {
                    // Update BOOKING status to confirmed
                    const { data: updatedBooking, error: updateError } = await supabase
                        .from("bookings")
                        .update({
                            status: "confirmed",
                            payment_status: "paid", // If you have this column in bookings
                            stripe_session_id: session.id
                        })
                        .eq("id", orderId)
                        .select()
                        .single();

                    if (!updateError && updatedBooking) {
                        console.log(`Booking ${orderId} successfully confirmed.`);

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
                    const { data: updatedOrder, error: updateError } = await supabase
                        .from("shop_orders")
                        .update({
                            status: "paid",
                            payment_status: "paid",
                            payment_verified_at: new Date().toISOString(),
                            stripe_payment_intent_id: session.payment_intent,
                            admin_notes: `Stripe Session ID: ${session.id}`
                        })
                        .eq("id", orderId)
                        .select()
                        .single();

                    if (!updateError && updatedOrder) {
                        console.log(`Shop Order ${orderId} successfully paid.`);

                        // SEND CONFIRMATION EMAIL
                        const resendApiKey = Deno.env.get("RESEND_API_KEY");
                        const customerEmail = session.customer_details?.email;

                        // Need items and shipping from the updated order
                        const contactDetails = updatedOrder.contact_details ? (typeof updatedOrder.contact_details === 'string' ? JSON.parse(updatedOrder.contact_details) : updatedOrder.contact_details) : {};
                        const customerName = contactDetails.name || 'Fighter';
                        const items = updatedOrder.items || [];
                        const shippingAddress = updatedOrder.shipping_address || 'TBD / In-store Pickup';

                        if (resendApiKey && customerEmail) {
                            try {
                                const emailHtml = generateShopEmailHTML({
                                    orderId: updatedOrder.id,
                                    customerName: customerName,
                                    amount: updatedOrder.total_amount,
                                    currency: 'THB',
                                    items: items,
                                    shippingAddress: shippingAddress
                                });

                                const emailResponse = await fetch('https://api.resend.com/emails', {
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
                                if (!emailResponse.ok) {
                                    console.error('Failed to send shop email:', await emailResponse.text());
                                } else {
                                    console.log('Shop confirmation email sent to', customerEmail);
                                }
                            } catch (e) {
                                console.error('Error sending shop confirmation email:', e);
                            }
                        } else {
                            console.log("RESEND_API_KEY or customer email not available. Skipping email sending.");
                        }
                    } else {
                        console.error(`Failed to update Shop Order ${orderId}:`, updateError);
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
