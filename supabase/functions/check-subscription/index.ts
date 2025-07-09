
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking for existing trial");
      
      // Check if user already has a trial/subscription record
      const { data: existingRecord } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .single();
      
      if (existingRecord) {
        // User exists but no Stripe customer - check trial status
        if (existingRecord.is_trial && existingRecord.trial_end) {
          const trialEnd = new Date(existingRecord.trial_end);
          const now = new Date();
          
          if (trialEnd > now) {
            // Trial is still active
            return new Response(JSON.stringify({
              subscribed: false,
              subscription_tier: 'trial',
              subscription_end: null,
              is_trial: true,
              trial_end: existingRecord.trial_end
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          } else {
            // Trial expired, update to free
            await supabaseClient.from("subscribers").upsert({
              email: user.email,
              user_id: user.id,
              stripe_customer_id: null,
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null,
              is_trial: false,
              trial_end: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: existingRecord?.subscription_tier || 'free',
        subscription_end: null,
        is_trial: existingRecord?.is_trial || false,
        trial_end: existingRecord?.trial_end || null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
    }

    // Check for existing trial status to preserve it for non-subscribed users
    const { data: existingRecord } = await supabaseClient
      .from("subscribers")
      .select("is_trial, trial_end")
      .eq("email", user.email)
      .single();

    let finalSubscriptionTier = hasActiveSub ? 'pro' : 'free';
    let isTrialActive = false;
    let trialEndDate = null;

    if (!hasActiveSub && existingRecord?.is_trial && existingRecord.trial_end) {
      const trialEnd = new Date(existingRecord.trial_end);
      const now = new Date();
      
      if (trialEnd > now) {
        // Trial is still active
        finalSubscriptionTier = 'trial';
        isTrialActive = true;
        trialEndDate = existingRecord.trial_end;
      } else {
        // Trial expired
        finalSubscriptionTier = 'free';
        isTrialActive = false;
        trialEndDate = null;
      }
    }

    const upsertData = {
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: finalSubscriptionTier,
      subscription_end: subscriptionEnd,
      is_trial: isTrialActive,
      trial_end: trialEndDate,
      updated_at: new Date().toISOString(),
    };

    await supabaseClient.from("subscribers").upsert(upsertData, { onConflict: 'email' });

    logStep("Updated database", { subscribed: hasActiveSub, subscriptionTier: finalSubscriptionTier });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: finalSubscriptionTier,
      subscription_end: subscriptionEnd,
      is_trial: isTrialActive,
      trial_end: trialEndDate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
