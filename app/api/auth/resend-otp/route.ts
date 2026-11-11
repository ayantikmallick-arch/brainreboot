import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateSecureOtp,
  refreshPendingOtp,
  getPendingVerification,
} from "@/lib/otpStore";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

const ResendOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = ResendOtpSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const existing = await getPendingVerification(normalizedEmail);

    if (!existing || existing.used) {
      return NextResponse.json(
        { error: "No active verification session found. Please start sign up again." },
        { status: 404 }
      );
    }

    const now = Date.now();
    if (now < existing.resendAfter) {
      const remainingSeconds = Math.ceil((existing.resendAfter - now) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Generate fresh secure 6-digit OTP
    const newOtp = generateSecureOtp();
    const refreshResult = await refreshPendingOtp(normalizedEmail, newOtp);

    if (!refreshResult.success) {
      return NextResponse.json(
        { error: refreshResult.error || "Unable to resend verification code." },
        { status: 400 }
      );
    }

    // Send email via Resend
    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      name: existing.name,
      otp: newOtp,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to deliver verification email." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
      maskedEmail: maskEmail(normalizedEmail),
      resendAfter: refreshResult.resendAfter,
      expiresAt: refreshResult.expiresAt,
    });
  } catch (err: any) {
    console.error("[resend-otp error]:", err?.message || err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resending the code." },
      { status: 500 }
    );
  }
}
