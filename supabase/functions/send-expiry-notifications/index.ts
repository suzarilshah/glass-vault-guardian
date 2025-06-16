
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client with service role key for database access
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting expiry notification check...");

    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();

    // Get all entries that expire within 7 days and haven't been notified recently
    const { data: expiringPasswords, error: passwordError } = await supabase
      .from('password_entries')
      .select('id, title, username, expires_at, user_id, profiles!inner(email, first_name)')
      .not('expires_at', 'is', null)
      .lte('expires_at', sevenDaysFromNowISO)
      .eq('is_expired', false);

    const { data: expiringApiKeys, error: apiError } = await supabase
      .from('api_entries')
      .select('id, title, api_name, expires_at, user_id, profiles!inner(email, first_name)')
      .not('expires_at', 'is', null)
      .lte('expires_at', sevenDaysFromNowISO)
      .eq('is_expired', false);

    const { data: expiringCertificates, error: certError } = await supabase
      .from('certificate_entries')
      .select('id, title, certificate_type, expires_at, user_id, profiles!inner(email, first_name)')
      .not('expires_at', 'is', null)
      .lte('expires_at', sevenDaysFromNowISO)
      .eq('is_expired', false);

    if (passwordError || apiError || certError) {
      console.error('Database error:', { passwordError, apiError, certError });
      throw new Error('Failed to fetch expiring entries');
    }

    // Group entries by user
    const userNotifications = new Map();

    // Process passwords
    expiringPasswords?.forEach(entry => {
      const userId = entry.user_id;
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, {
          email: entry.profiles.email,
          firstName: entry.profiles.first_name,
          passwords: [],
          apiKeys: [],
          certificates: []
        });
      }
      userNotifications.get(userId).passwords.push(entry);
    });

    // Process API keys
    expiringApiKeys?.forEach(entry => {
      const userId = entry.user_id;
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, {
          email: entry.profiles.email,
          firstName: entry.profiles.first_name,
          passwords: [],
          apiKeys: [],
          certificates: []
        });
      }
      userNotifications.get(userId).apiKeys.push(entry);
    });

    // Process certificates
    expiringCertificates?.forEach(entry => {
      const userId = entry.user_id;
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, {
          email: entry.profiles.email,
          firstName: entry.profiles.first_name,
          passwords: [],
          apiKeys: [],
          certificates: []
        });
      }
      userNotifications.get(userId).certificates.push(entry);
    });

    console.log(`Found ${userNotifications.size} users with expiring items`);

    // Send notifications to each user
    const emailPromises = Array.from(userNotifications.entries()).map(async ([userId, data]) => {
      const { email, firstName, passwords, apiKeys, certificates } = data;
      
      if (!email || (passwords.length === 0 && apiKeys.length === 0 && certificates.length === 0)) {
        return;
      }

      const totalItems = passwords.length + apiKeys.length + certificates.length;
      
      // Generate email content
      let itemsList = '';
      
      if (passwords.length > 0) {
        itemsList += `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #10b981; margin: 0 0 10px 0; font-size: 16px;">🔑 Passwords (${passwords.length})</h3>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
              ${passwords.map(p => `
                <li style="margin-bottom: 5px;">
                  <strong>${p.title}</strong>${p.username ? ` (${p.username})` : ''} - Expires: ${new Date(p.expires_at).toLocaleDateString()}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      if (apiKeys.length > 0) {
        itemsList += `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 16px;">🔗 API Keys (${apiKeys.length})</h3>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
              ${apiKeys.map(a => `
                <li style="margin-bottom: 5px;">
                  <strong>${a.title}</strong>${a.api_name ? ` (${a.api_name})` : ''} - Expires: ${new Date(a.expires_at).toLocaleDateString()}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      if (certificates.length > 0) {
        itemsList += `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #8b5cf6; margin: 0 0 10px 0; font-size: 16px;">📜 Certificates (${certificates.length})</h3>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
              ${certificates.map(c => `
                <li style="margin-bottom: 5px;">
                  <strong>${c.title}</strong> (${c.certificate_type}) - Expires: ${new Date(c.expires_at).toLocaleDateString()}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      try {
        await resend.emails.send({
          from: "SecureVault <notifications@securevault.com>",
          to: [email],
          subject: `⚠️ ${totalItems} item${totalItems > 1 ? 's' : ''} expiring within 7 days`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; border-radius: 12px; color: white;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #10b981; margin: 0; font-size: 28px;">🔐 SecureVault</h1>
                  <h2 style="color: white; margin: 10px 0 0 0; font-size: 20px;">Expiry Notification</h2>
                </div>
                
                <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #fbbf24; margin: 0 0 10px 0; font-size: 16px;">⏰ Action Required</h3>
                  <p style="color: #fcd34d; margin: 0; font-size: 14px;">
                    You have ${totalItems} item${totalItems > 1 ? 's' : ''} in your vault that will expire within the next 7 days.
                  </p>
                </div>
                
                ${firstName ? `<p style="color: #d1d5db; margin-bottom: 20px;">Hello ${firstName},</p>` : ''}
                
                <p style="color: #d1d5db; margin-bottom: 25px; line-height: 1.6;">
                  The following items in your SecureVault are approaching their expiration date. Please review and update them as needed:
                </p>
                
                ${itemsList}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL') || 'https://app.securevault.com'}" 
                     style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                    Access Your Vault
                  </a>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                  <p style="color: #93c5fd; margin: 0; font-size: 14px;">
                    <strong>Security Tip:</strong> Regularly updating passwords, rotating API keys, and renewing certificates helps maintain optimal security for your accounts and services.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    This is an automated notification from SecureVault.<br>
                    You can manage notification preferences in your account settings.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        console.log(`Notification sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${userNotifications.size} users`,
      details: {
        totalPasswords: expiringPasswords?.length || 0,
        totalApiKeys: expiringApiKeys?.length || 0,
        totalCertificates: expiringCertificates?.length || 0
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-expiry-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
