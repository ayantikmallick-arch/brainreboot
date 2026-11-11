"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import ParticleBackground from "@/Components/ParticleBackground";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/chat");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push("/chat");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0a0e1a]">
      {/* Interactive Constellation Motion Background */}
      <ParticleBackground />

      {/* Floating Glassmorphic Auth Card */}
      <div className="relative z-10 w-full max-w-[410px] bg-[#10162a]/85 border border-[#232b48] rounded-[22px] p-7 sm:p-9 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-rise">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.5)] overflow-hidden mb-3 animate-breathe p-1">
            <Image
              src="/logo.png"
              alt="BrainFlow"
              width={52}
              height={52}
              priority
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center gap-1.5 font-bold text-2xl tracking-tight">
            <span className="text-[#22c1ff]">Brain</span>
            <span className="text-[#c026d3]">Flow</span>
          </div>

          <p className="text-xs text-[#8b93b8] mt-1 tracking-wide">
            Your AI Assistant
          </p>
        </div>

        {/* Tab Row */}
        <div className="flex bg-[#0a0e1a] border border-[#232b48] rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              !isSignUp
                ? "bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white shadow-md"
                : "text-[#8b93b8] hover:text-white"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              isSignUp
                ? "bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white shadow-md"
                : "text-[#8b93b8] hover:text-white"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8b93b8] mb-1.5 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#232b48] bg-[#0d1226] text-[#eef2ff] placeholder-[#4a5484] text-sm outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)] transition"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8b93b8] mb-1.5 font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#232b48] bg-[#0d1226] text-[#eef2ff] placeholder-[#4a5484] text-sm outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)] transition"
            />
          </div>

          {error && (
            <div className="text-xs text-[#ff5d7a] text-center font-medium bg-[#ff5d7a]/10 border border-[#ff5d7a]/20 rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] hover:brightness-110 active:scale-[0.99] transition shadow-[0_4px_20px_rgba(139,92,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Processing..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-[1px] bg-[#232b48]" />
          <span className="text-xs text-[#8b93b8]">or continue with</span>
          <div className="flex-1 h-[1px] bg-[#232b48]" />
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-[#232b48] bg-[#0d1226] hover:bg-[#111834] hover:border-[#3a4470] text-[#eef2ff] font-semibold text-sm transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Footer switch */}
        <p className="text-center text-xs text-[#8b93b8] mt-6">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-[#22c1ff] hover:underline font-semibold"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className="text-[#22c1ff] hover:underline font-semibold"
              >
                Create one
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
