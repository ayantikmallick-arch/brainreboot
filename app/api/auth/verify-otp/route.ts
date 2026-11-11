import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  getPendingVerification,
  hashOtp,
  incrementFailedAttempt,
  markVerificationUsed,
} from "@/lib/otpStore";
import { createVerifiedFirebaseUser } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const VerifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits."),
  verificationToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = VerifyOtpSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const token =
      parsed.data.verificationToken ||
      req.cookies.get("__bf_pending_verif")?.value ||
      null;

    // Fetch pending registration from token, memory, disk, or Firestore
    const record = await getPendingVerification(normalizedEmail, token);

    if (!record) {
      return NextResponse.json(
        { error: "No pending verification session found for this email. Please sign up again." },
        { status: 404 }
      );
    }

    if (record.used) {
      return NextResponse.json(
        { error: "This verification code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      return NextResponse.json(
        { error: "This verification code has expired (5-minute limit). Please request a new code." },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Maximum attempts reached. This code has been invalidated for security. Please request a new code." },
        { status: 429 }
      );
    }

    // Timing-safe comparison of OTP hashes
    const computedHash = hashOtp(otp, record.salt);
    const expectedBuffer = Buffer.from(record.otpHashed, "hex");
    const computedBuffer = Buffer.from(computedHash, "hex");

    const isMatch =
      expectedBuffer.length === computedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, computedBuffer);

    if (!isMatch) {
      const { remainingAttempts, isLocked, updatedToken } = await incrementFailedAttempt(record);

      const errResponse = NextResponse.json(
        {
          error: isLocked
            ? "Maximum attempts reached. This code is now invalidated. Please request a new one."
            : `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
          remainingAttempts,
          isLocked,
          verificationToken: updatedToken,
        },
        { status: isLocked ? 429 : 400 }
      );

      // Update cookie with new attempt count
      errResponse.cookies.set("__bf_pending_verif", updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 5 * 60,
      });

      return errResponse;
    }

    // OTP IS VALID: Mark single-use used immediately to prevent replay
    await markVerificationUsed(record);

    // Create the verified Firebase account
    const createResult = await createVerifiedFirebaseUser({
      email: normalizedEmail,
      password: record.password,
      name: record.name,
    });

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error || "Failed to create Firebase user account." },
        { status: 400 }
      );
    }

    const successResponse = NextResponse.json({
      success: true,
      message: "Account verified and created successfully.",
      uid: createResult.uid,
      customToken: createResult.customToken,
      idToken: createResult.idToken,
      autoLoginKey: record.password,
      email: normalizedEmail,
    });

    // Clear the pending verification cookie
    successResponse.cookies.set("__bf_pending_verif", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: 0,
    });

    return successResponse;
  } catch (err: any) {
    console.error("[verify-otp error]:", err?.message || err);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
