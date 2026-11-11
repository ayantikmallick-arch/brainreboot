import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  getPendingVerification,
  hashOtp,
  incrementFailedAttempt,
  markVerificationUsed,
  decryptPassword,
} from "@/lib/otpStore";
import { createVerifiedFirebaseUser } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const VerifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits."),
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

    // Fetch pending registration
    const record = await getPendingVerification(normalizedEmail);

    if (!record) {
      return NextResponse.json(
        { error: "No pending verification found for this email. Please sign up again." },
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
        { error: "Too many incorrect attempts. This code has been invalidated for security. Please request a new code." },
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
      const { remainingAttempts, isLocked } = await incrementFailedAttempt(normalizedEmail);

      if (isLocked) {
        return NextResponse.json(
          { error: "Maximum attempts reached. This code is now invalidated. Please request a new one." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.` },
        { status: 400 }
      );
    }

    // OTP IS VALID: Mark single-use used immediately to prevent replay
    await markVerificationUsed(normalizedEmail);

    // Decrypt the password securely on the server
    let decryptedPassword = "";
    try {
      decryptedPassword = decryptPassword(record.encryptedPassword, record.iv, record.tag);
    } catch (decryptErr) {
      return NextResponse.json(
        { error: "Session decryption failed. Please sign up again." },
        { status: 500 }
      );
    }

    // Create the verified Firebase account
    const createResult = await createVerifiedFirebaseUser({
      email: normalizedEmail,
      password: decryptedPassword,
      name: record.name,
    });

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error || "Failed to create Firebase user account." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account verified and created successfully.",
      uid: createResult.uid,
      customToken: createResult.customToken,
      idToken: createResult.idToken,
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error("[verify-otp error]:", err?.message || err);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
