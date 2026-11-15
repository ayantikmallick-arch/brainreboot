import { Resend } from "resend";

export interface SendOtpEmailParams {
  email: string;
  otp: string;
  name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    const trimmedName = name?.trim();
    const greetingText = trimmedName ? `Hi ${trimmedName},` : "Hi there,";
    const greetingHtml = escapeHtml(greetingText);
    const safeOtp = escapeHtml(otp);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrainFlow Verification Code</title>
</head>
<body bgcolor="#ffffff" style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #333333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff;">
    <tr>
      <td align="left" style="padding: 28px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="left" style="max-width: 600px; width: 100%; background-color: #ffffff;">
          <tr>
            <td align="left" style="padding: 0 0 20px 0;">
              <img src="https://brainflowai.in/logo.png" alt="BrainFlow Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; max-width: 64px; max-height: 64px; object-fit: contain; border: 0; outline: none; text-decoration: none;" />
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; line-height: 1.6; color: #333333;">
                ${greetingHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
                Use the following one-time password (OTP) to verify your email address and complete your BrainFlow account registration.
              </p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 6px; line-height: 1.4; color: #111827;">
                ${safeOtp}
              </p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
                This OTP is valid for 5 minutes and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #666666;">
                If you did not request this verification, please ignore this email. Your account will not be activated without successful verification.
              </p>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding: 0;">
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
                Regards,<br />
                The BrainFlow Team
              </p>
              <p style="margin: 8px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #666666;">
                <a href="https://brainflowai.in" style="color: #666666; text-decoration: none;">https://brainflowai.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `${greetingText}

Use the following one-time password (OTP) to verify your email address and complete your BrainFlow account registration.

${otp}

This OTP is valid for 5 minutes and can only be used once.

If you did not request this verification, please ignore this email. Your account will not be activated without successful verification.

Regards,
The BrainFlow Team
https://brainflowai.in`;

    const { data, error } = await resend.emails.send({
      from: "BrainFlow <verify@brainflowai.in>",
      to: [email],
      subject: `Your BrainFlow Verification Code: ${otp}`,
      html: htmlContent,
      text: textContent,
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
