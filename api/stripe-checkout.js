/**
 * Stripe Checkout API Handler
 * Creates checkout sessions for Blaze Intelligence subscriptions
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { priceId, customerEmail, returnUrl } = await request.json();

      // Validate required fields
      if (!priceId || !customerEmail) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Stripe pricing IDs (configured in Stripe Dashboard)
      const PRICE_IDS = {
        starter: 'price_starter_monthly',      // $99/month
        professional: 'price_pro_monthly',     // $299/month
        enterprise: 'price_enterprise_monthly' // Custom pricing
      };

      // Create Stripe checkout session
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'line_items[0][price]': PRICE_IDS[priceId] || priceId,
          'line_items[0][quantity]': '1',
          'mode': 'subscription',
          'customer_email': customerEmail,
          'success_url': returnUrl || 'https://blaze-intelligence.com/success',
          'cancel_url': 'https://blaze-intelligence.com/pricing',
          'metadata[plan]': priceId,
          'metadata[source]': 'blaze-intelligence',
          'allow_promotion_codes': 'true',
          'billing_address_collection': 'required',
          'phone_number_collection[enabled]': 'true',
        }).toString()
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.text();
        console.error('Stripe error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to create checkout session' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const session = await stripeResponse.json();

      // Store checkout intent in KV for tracking
      if (env.CHECKOUT_KV) {
        await env.CHECKOUT_KV.put(
          `checkout_${session.id}`,
          JSON.stringify({
            sessionId: session.id,
            customerEmail,
            plan: priceId,
            createdAt: new Date().toISOString(),
            status: 'pending'
          }),
          { expirationTtl: 86400 } // Expire after 24 hours
        );
      }

      return new Response(JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};