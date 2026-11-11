import { Resend } from "resend";

export interface SendOtpEmailParams {
  email: string;
  otp: string;
  name?: string;
}

export async function sendOtpEmail({
  email,
  otp,
  name,
}: SendOtpEmailParams): Promise<{ success: boolean; id?: string; error?: string; simulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  // If no API key is configured (e.g. during local development), gracefully simulate dispatch
  if (!apiKey) {
    console.log(
      `\x1b[33m[BrainFlow Auth - Dev Simulation]\x1b[0m RESEND_API_KEY is not set in this environment.\n` +
      `Simulated OTP dispatch for \x1b[36m${email}\x1b[0m -> Verification Code: \x1b[32m${otp}\x1b[0m\n` +
      `(In production on Vercel, this is automatically sent via Resend API from verify@brainflowai.in)`
    );
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BrainFlow Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #eef2ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0e1a; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #10162a; border: 1px solid #232b48; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 35px 35px 20px 35px; text-align: center; border-bottom: 1px solid #1a223f;">
              <div style="display: inline-block; padding: 3px; background: linear-gradient(135deg, #22c1ff, #8b5cf6, #c026d3); border-radius: 14px; margin-bottom: 12px;">
                <div style="background-color: #ffffff; width: 44px; height: 44px; border-radius: 11px; text-align: center; line-height: 44px;">
                  <span style="font-size: 22px; font-weight: 900; background: linear-gradient(135deg, #22c1ff, #8b5cf6); -webkit-background-clip: text; color: #8b5cf6;">⚡</span>
                </div>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                <span style="color: #22c1ff;">Brain</span><span style="color: #c026d3;">Flow</span>
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #8b93b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                Email Verification
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 35px;">
              <p style="margin: 0 0 15px 0; font-size: 15px; color: #eef2ff; font-weight: 600;">
                ${greeting}
              </p>
              <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.6; color: #8b93b8;">
                Thank you for creating an account on <strong style="color: #ffffff;">BrainFlow AI</strong>. Please use the verification code below to verify your email address and activate your account:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0 25px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, rgba(34, 193, 255, 0.1), rgba(139, 92, 246, 0.15), rgba(192, 38, 211, 0.1)); border: 2px solid #8b5cf6; border-radius: 16px; padding: 22px 20px; text-align: center; max-width: 320px;">
                      <span style="display: block; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 15px rgba(139, 92, 246, 0.6); padding-left: 10px;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #0c1020; border-left: 3px solid #22c1ff; border-radius: 6px; padding: 12px 14px; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8b93b8;">
                  ⏱️ <strong style="color: #22c1ff;">Security Notice:</strong> This one-time code expires in <strong>5 minutes</strong> and can only be used once. Never share this code with anyone.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #4a5484;">
                If you did not initiate this signup request on BrainFlow, you can safely disregard and delete this email. No account will be activated without this verification code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 35px 30px 35px; border-top: 1px solid #1a223f; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #4a5484;">
                BrainFlow AI · Engineered by Ayantik Mallick
              </p>
              <p style="margin: 0; font-size: 11px; color: #4a5484;">
                <a href="https://brainflowai.in" style="color: #22c1ff; text-decoration: none;">brainflowai.in</a> · 
                <a href="https://brainflowai.in/privacy-policy" style="color: #8b93b8; text-decoration: none;">Privacy</a> · 
                <a href="https://brainflowai.in/terms-of-service" style="color: #8b93b8; text-decoration: none;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: "BrainFlow <verify@brainflowai.in>",
      to: [email],
      subject: `Your BrainFlow Verification Code: ${otp}`,
      html: htmlContent,
    });

    if (error) {
      console.error("[Resend Error]:", error.message || error);
      return { success: false, error: error.message || "Failed to deliver verification email." };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Resend Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to send email." };
  }
}
