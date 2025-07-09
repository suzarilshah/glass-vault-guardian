import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-REMINDER] ${step}${detailsStr}`);
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
    logStep("Starting trial reminder check");

    // Get users with trials expiring in the next 3 days
    const { data: expiringTrials, error } = await supabaseClient
      .rpc('get_expiring_trials', { days_before: 3 });

    if (error) {
      throw new Error(`Failed to fetch expiring trials: ${error.message}`);
    }

    logStep("Found expiring trials", { count: expiringTrials?.length || 0 });

    if (!expiringTrials || expiringTrials.length === 0) {
      return new Response(JSON.stringify({ message: "No expiring trials found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const emailResults = [];

    for (const trial of expiringTrials) {
      try {
        const trialEndDate = new Date(trial.trial_end).toLocaleDateString();
        const isLastDay = trial.days_remaining <= 1;
        
        const emailSubject = isLastDay 
          ? "⏰ Your Shielder Pro trial expires today!"
          : `⏰ Your Shielder Pro trial expires in ${trial.days_remaining} days`;

        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Shielder</h1>
              <p style="color: #666; font-size: 16px;">Enterprise-Grade Password Security</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 24px;">Your trial is ending soon!</h2>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">
                ${isLastDay 
                  ? "Your free trial expires today!" 
                  : `You have ${trial.days_remaining} days left in your free trial.`
                }
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1a1a1a; margin-top: 0;">Don't lose access to these Pro features:</h3>
              <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
                <li>🔐 Unlimited password storage and organization</li>
                <li>🤖 AI-powered password generation and analysis</li>
                <li>🔑 Secure API key and certificate management</li>
                <li>📊 Advanced security insights and breach monitoring</li>
                <li>🚀 Priority customer support</li>
              </ul>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${Deno.env.get("SITE_URL") || "https://shielder.my"}/profile" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Upgrade to Pro Now
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>Questions? Reply to this email or visit our support center.</p>
              <p style="margin-top: 15px;">Shielder - Protecting your digital identity</p>
            </div>
          </div>
        `;

        const emailResponse = await resend.emails.send({
          from: "Shielder <noreply@shielder.my>",
          to: [trial.email],
          subject: emailSubject,
          html: emailBody,
        });

        emailResults.push({
          email: trial.email,
          success: true,
          days_remaining: trial.days_remaining
        });

        logStep("Email sent successfully", { 
          email: trial.email, 
          days_remaining: trial.days_remaining,
          messageId: emailResponse.data?.id 
        });

      } catch (emailError) {
        logStep("Failed to send email", { 
          email: trial.email, 
          error: emailError.message 
        });
        
        emailResults.push({
          email: trial.email,
          success: false,
          error: emailError.message,
          days_remaining: trial.days_remaining
        });
      }
    }

    return new Response(JSON.stringify({
      message: "Trial reminder process completed",
      results: emailResults,
      total_processed: expiringTrials.length
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