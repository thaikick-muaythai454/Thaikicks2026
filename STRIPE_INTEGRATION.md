# Stripe Payment Integration Guide

## 1. Get Your Stripe API Keys
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).
2. Get your **Publishable Key** (`pk_test_...`) and **Secret Key** (`sk_test_...`).

## 2. Environment Variables
Add these to your `.env.local`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 3. Deployment
### Supabase Edge Function
1. Set the secret key in Supabase:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```
2. Deploy the function:
```bash
supabase functions deploy stripe-checkout
```

## 4. Webhooks (For Payment Confirmation)
1. Setup a webhook in Stripe Dashboard to point to:
   `https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
2. Subscribe to `checkout.session.completed`.

## 5. Test Cards
- **Visa (Success)**: 4242 4242 4242 4242
- **Any CVC**: 123
- **Any Future Date**: 12/34

## 6. How it works
1. **Frontend**: When the user clicks "Checkout", we call the `stripe-checkout` Edge Function.
2. **Backend (Edge Function)**: Creates a Stripe Checkout Session and returns the URL.
3. **Frontend**: Redirects the user to Stripe's hosted checkout page.
4. **Stripe**: User completes payment and is redirected back to `/checkout-success`.
5. **Webhook**: Stripe sends a `checkout.session.completed` event to confirmed the payment in our database.
