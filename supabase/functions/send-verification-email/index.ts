
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  action: 'password_change' | 'master_password_change';
  verificationCode: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, verificationCode, userName }: VerificationEmailRequest = await req.json();

    const actionText = action === 'password_change' ? 'Account Password Change' : 'Master Password Change';
    const warningText = action === 'password_change' 
      ? 'This will change your account password used to sign in to the platform.'
      : 'This will change your master password used to encrypt and decrypt your vault data.';

    const emailResponse = await resend.emails.send({
      from: "SecureVault <security@secuRevault.com>",
      to: [email],
      subject: `Verify ${actionText} Request`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; border-radius: 12px; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">🔐 SecureVault</h1>
              <h2 style="color: white; margin: 10px 0 0 0; font-size: 20px;">Password Change Verification</h2>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #fca5a5; margin: 0 0 10px 0; font-size: 16px;">⚠️ Security Alert</h3>
              <p style="color: #fecaca; margin: 0; font-size: 14px;">
                A request to change your ${action.replace('_', ' ')} has been initiated from your account.
                ${warningText}
              </p>
            </div>
            
            ${userName ? `<p style="color: #d1d5db; margin-bottom: 20px;">Hello ${userName},</p>` : ''}
            
            <p style="color: #d1d5db; margin-bottom: 25px; line-height: 1.6;">
              To complete the ${actionText.toLowerCase()}, please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #111827; border: 2px solid #10b981; border-radius: 8px; padding: 20px 30px;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</div>
                <div style="color: #10b981; font-size: 32px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                  ${verificationCode}
                </div>
              </div>
            </div>
            
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #93c5fd; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <div style="border-top: 1px solid #374151; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
                <strong>Didn't request this change?</strong> If you did not initiate this password change, please secure your account immediately by:
              </p>
              <ul style="color: #9ca3af; font-size: 13px; margin: 0; padding-left: 20px;">
                <li>Changing your account password</li>
                <li>Reviewing recent account activity</li>
                <li>Contacting our support team if needed</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated security email from SecureVault.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Verification email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
