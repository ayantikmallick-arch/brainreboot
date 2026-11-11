"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ParticleBackground from "@/Components/ParticleBackground";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`;
}

function OtpVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email query, check temporary session storage or redirect to signup
      const savedEmail = sessionStorage.getItem("pending_signup_email");
      if (savedEmail) {
        setEmail(savedEmail);
      } else {
        router.replace("/signup");
      }
    }
  }, [searchParams, router]);

  // Focus the first empty input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleanDigit = value.replace(/\D/g, "");
    setError(null);
    setSuccessMsg(null);

    const newOtp = [...otp];

    if (!cleanDigit) {
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    // Take the last character if multiple digits entered
    newOtp[index] = cleanDigit.slice(-1);
    setOtp(newOtp);

    // Automatically focus next input box
    if (index < 5 && cleanDigit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move focus backward if current box is already empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    setError(null);
    const digits = pasteData.split("");
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < digits.length; i++) {
      newOtp[i] = digits[i];
    }
    setOtp(newOtp);

    // Focus on the next empty box or the last box
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setError("Email address is missing. Please return to sign up.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const storedToken = typeof window !== "undefined" ? sessionStorage.getItem("pending_signup_token") : null;
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, verificationToken: storedToken || undefined }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setError("Unable to process verification response. Please try again.");
        return;
      }

      if (!res.ok) {
        if (data?.verificationToken) {
          try {
            sessionStorage.setItem("pending_signup_token", data.verificationToken);
          } catch {}
        }
        setError(data?.error || "Verification failed. Please verify your code and try again.");
        return;
      }

      setSuccessMsg("Account verified! Signing you in...");

      // Authenticate the user with Firebase Client SDK
      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else if (data.autoLoginKey) {
        await signInWithEmailAndPassword(auth, email, data.autoLoginKey);
      }

      // Clear pending signup storage
      try {
        sessionStorage.removeItem("pending_signup_email");
        sessionStorage.removeItem("pending_signup_token");
      } catch {}

      // Short delay for visual confirmation before redirecting to chat
      setTimeout(() => {
        router.push("/chat");
      }, 700);
    } catch (err: any) {
      console.error("[OTP Verify Error]:", err?.message || err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending || !email) return;

    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const storedToken = typeof window !== "undefined" ? sessionStorage.getItem("pending_signup_token") : null;
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationToken: storedToken || undefined }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setError("Unable to resend code. Please try again shortly.");
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Failed to resend code.");
        if (data?.remainingSeconds) {
          setCountdown(data.remainingSeconds);
        }
        return;
      }

      if (data?.verificationToken) {
        try {
          sessionStorage.setItem("pending_signup_token", data.verificationToken);
        } catch {}
      }

      setSuccessMsg("A new 6-digit verification code has been sent to your email.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError("Failed to resend code. Please check your internet connection.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full flex justify-center items-center flex-1 my-auto">
      {/* Floating Glassmorphic Verification Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-[#10162a]/85 border border-[#232b48] rounded-2xl sm:rounded-[24px] p-6 sm:p-9 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-rise text-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Link href="/" className="group flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.5)] overflow-hidden mb-2.5 animate-breathe p-1 group-hover:scale-105 transition">
              <Image
                src="/logo.png"
                alt="BrainFlow"
                width={52}
                height={52}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1 font-bold text-xl sm:text-2xl tracking-tight font-display">
              <span className="text-[#22c1ff]">Brain</span>
              <span className="text-[#c026d3]">Flow</span>
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#8b5cf6]/40 bg-[#161d35]/70 text-[11px] font-medium text-[#22c1ff] mt-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c1ff] animate-pulse"></span>
            <span>Security Verification</span>
          </div>
        </div>

        {/* Title & Email Info */}
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight mb-2">
          Verify Your Email
        </h2>
        <p className="text-xs sm:text-sm text-[#8b93b8] leading-relaxed max-w-sm mx-auto mb-6">
          We sent a 6-digit verification code to:
          <br />
          <strong className="text-[#22c1ff] font-mono text-xs sm:text-sm tracking-wide mt-1 inline-block">
            {email ? maskEmail(email) : "your email address"}
          </strong>
        </p>

        {/* 6 Individual OTP Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={loading}
                className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold text-white bg-[#0d1226] border-2 border-[#232b48] rounded-xl sm:rounded-2xl outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all duration-200 disabled:opacity-50"
              />
            ))}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="text-xs text-[#ff5d7a] font-medium bg-[#ff5d7a]/10 border border-[#ff5d7a]/30 rounded-xl py-2.5 px-3.5 animate-rise">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/30 rounded-xl py-2.5 px-3.5 animate-rise">
              {successMsg}
            </div>
          )}

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_4px_25px_rgba(139,92,246,0.45)] hover:brightness-110 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Verifying &amp; Creating Account...</span>
              </>
            ) : (
              <span>Verify &amp; Launch BrainFlow &rarr;</span>
            )}
          </button>
        </form>

        {/* Resend Code Strip */}
        <div className="mt-6 pt-5 border-t border-[#232b48] flex flex-col items-center gap-2">
          <p className="text-xs text-[#8b93b8]">
            Didn&apos;t receive the code? Check your spam folder or
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending || loading}
            className="text-xs font-semibold text-[#22c1ff] hover:text-[#c026d3] disabled:text-[#4a5484] disabled:cursor-not-allowed transition"
          >
            {resending ? (
              "Resending code..."
            ) : countdown > 0 ? (
              <span>Resend code in <strong className="font-mono text-white">{countdown}s</strong></span>
            ) : (
              "Resend verification code"
            )}
          </button>

          {/* Wrong Email Return Link */}
          <div className="mt-2 text-[11px] text-[#4a5484]">
            Wrong email address?{" "}
            <Link href="/signup" className="text-[#8b93b8] hover:text-white underline underline-offset-2 transition">
              Back to Sign Up
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function OtpVerificationPage() {
  return (
    <main className="min-h-screen min-h-[100dvh] relative flex flex-col justify-between items-center p-3.5 sm:p-6 overflow-hidden bg-[#0a0e1a]">
      {/* Background Particles */}
      <ParticleBackground />

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-xs text-[#8b93b8]">
          Loading verification...
        </div>
      }>
        <OtpVerificationContent />
      </Suspense>

      {/* Persistent Legal Footer */}
      <footer className="relative z-10 w-full max-w-lg mx-auto py-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] text-[#4a5484]">
          <Link href="/privacy-policy" className="hover:text-[#8b93b8] transition">Privacy Policy</Link>
          <span>&middot;</span>
          <Link href="/terms-of-service" className="hover:text-[#8b93b8] transition">Terms of Service</Link>
          <span>&middot;</span>
          <Link href="/cookie-policy" className="hover:text-[#8b93b8] transition">Cookie Policy</Link>
        </div>
      </footer>
    </main>
  );
}
