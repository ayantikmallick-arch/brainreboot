import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateSecureOtp,
  savePendingVerification,
  getPendingVerification,
} from "@/lib/otpStore";
import { sendOtpEmail } from "@/lib/email";
import { checkEmailAlreadyRegistered } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const SendOtpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Please provide a valid email address.").max(150),
  password: z.string().min(6, "Password must be at least 6 characters.").max(100),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy.",
  }),
});

// In-memory rate limiting map: ip/email -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 6;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);

  if (valid.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  valid.push(now);
  rateLimitMap.set(key, valid);
  return true;
}

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
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(`ip:${ip}`)) {
      return NextResponse.json(
        { error: "Too many verification attempts from this IP. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = SendOtpSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    if (!checkRateLimit(`email:${normalizedEmail}`)) {
      return NextResponse.json(
        { error: "Too many attempts for this email address. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // Check if account already exists
    const alreadyRegistered = await checkEmailAlreadyRegistered(normalizedEmail);
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: "This email address is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // Check 60-second cooldown on existing pending record
    const existing = await getPendingVerification(normalizedEmail);
    if (existing && Date.now() < existing.resendAfter && !existing.used) {
      const remainingSeconds = Math.ceil((existing.resendAfter - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
          remainingSeconds,
          maskedEmail: maskEmail(normalizedEmail),
        },
        { status: 429 }
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();

    // Store pending verification record with salted hash and encrypted password
    const saveResult = await savePendingVerification({
      email: normalizedEmail,
      name,
      password,
      otp,
    });

    if (!saveResult.success) {
      return NextResponse.json(
        { error: "Failed to initialize verification session. Please try again." },
        { status: 500 }
      );
    }

    // Send email via Resend
    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      name,
      otp,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to deliver verification email. Please check your email address." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
      maskedEmail: maskEmail(normalizedEmail),
      verificationId: saveResult.verificationId,
      verificationToken: saveResult.verificationToken,
      expiresAt: saveResult.expiresAt,
      resendAfter: saveResult.resendAfter,
    });

    // Set secure HttpOnly cookie with the encrypted verification token
    response.cookies.set("__bf_pending_verif", saveResult.verificationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: 5 * 60, // 5 minutes
    });

    return response;
  } catch (err: any) {
    console.error("[send-otp error]:", err?.message || err);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending verification code." },
      { status: 500 }
    );
  }
}
