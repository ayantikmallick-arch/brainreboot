"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ParticleBackground from "@/Components/ParticleBackground";

export default function LandingPage() {
  const [quickPrompt, setQuickPrompt] = useState("");
  const router = useRouter();

  const handleLaunchWithPrompt = (promptText: string) => {
    if (!promptText.trim()) return;
    try {
      localStorage.setItem("firstMessage", promptText.trim());
    } catch {}
    router.push(`/chat/${Date.now()}`);
  };

  return (
    <main className="min-h-screen relative bg-[#0a0e1a] text-[#eef2ff] flex flex-col justify-between overflow-x-hidden selection:bg-[#8b5cf6]/30 selection:text-[#22c1ff]">
      {/* Dynamic Constellation Particle Field */}
      <ParticleBackground />

      {/* Floating Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] overflow-hidden p-1 transition group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="BrainFlow Logo"
              width={36}
              height={36}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1 font-bold text-xl tracking-tight font-display">
            <span className="text-[#22c1ff]">Brain</span>
            <span className="text-[#c026d3]">Flow</span>
          </div>
        </Link>

        {/* Center links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#8b93b8]">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#intelligence" className="hover:text-white transition">Intelligence</a>
          <a href="#prompts" className="hover:text-white transition">Explore</a>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-[#8b93b8] hover:text-white border border-[#232b48] hover:border-[#8b5cf6] rounded-xl transition bg-[#10162a]/70 backdrop-blur-sm"
          >
            Sign in
          </Link>

          <Link
            href="/chat"
            className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition"
          >
            Launch Chat &rarr;
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-8 pb-16 text-center max-w-5xl mx-auto w-full">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8b5cf6]/40 bg-[#161d35]/60 text-xs font-medium text-[#22c1ff] mb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-md animate-rise">
          <span className="w-2 h-2 rounded-full bg-[#22c1ff] animate-pulse"></span>
          <span>Next-Generation AI Assistant</span>
          <span className="text-[#8b93b8]">&middot;</span>
          <span className="text-[#eef2ff]">Active &amp; Ready</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight text-white max-w-4xl leading-[1.12]">
          Think Faster. Create Deeper. <br className="hidden sm:inline" />
          <span className="brand-gradient-text">
            Powered by BrainFlow
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-lg text-[#8b93b8] max-w-2xl leading-relaxed">
          The intelligent assistant engineered for learning, coding, research, writing, and high-productivity workflows with instant streaming responses.
        </p>

        {/* Hero Interactive Prompt Input */}
        <div className="w-full max-w-2xl mt-9">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLaunchWithPrompt(quickPrompt);
            }}
            className="flex items-center bg-[#10162a]/90 border border-[#232b48] hover:border-[#8b5cf6]/80 focus-within:border-[#8b5cf6] focus-within:shadow-[0_0_30px_rgba(139,92,246,0.25)] rounded-2xl p-2 sm:p-2.5 transition backdrop-blur-xl shadow-2xl"
          >
            <div className="pl-3 pr-2 text-[#8b93b8]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#22c1ff]">
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
              </svg>
            </div>

            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="What would you like to explore or build today?"
              className="flex-1 bg-transparent border-none outline-none text-[#eef2ff] placeholder-[#8b93b8] text-sm sm:text-base px-2"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] hover:brightness-110 active:scale-95 transition shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Ask BrainFlow</span>
              <span>&rarr;</span>
            </button>
          </form>

          {/* Quick chip triggers */}
          <div id="prompts" className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-[11px] text-[#4a5484] uppercase tracking-wider font-semibold mr-1">
              Popular:
            </span>
            {[
              "Explain quantum computing simply",
              "Draft an email for a job interview",
              "Brainstorm SaaS product ideas",
              "Debug Python async deadlock",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLaunchWithPrompt(chip)}
                className="text-xs px-3 py-1 rounded-full border border-[#232b48] bg-[#161d35]/60 hover:bg-[#161d35] hover:border-[#8b5cf6] text-[#8b93b8] hover:text-[#eef2ff] transition backdrop-blur-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Live Interface Mockup Card */}
        <div className="w-full max-w-4xl mt-14 relative animate-rise">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#22c1ff]/30 via-[#8b5cf6]/30 to-[#c026d3]/30 blur-2xl opacity-40"></div>

          <div className="relative bg-[#10162a]/90 border border-[#232b48] rounded-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden text-left">
            {/* Window Topbar */}
            <div className="px-4 py-3 border-b border-[#232b48] bg-[#0c1020]/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5d7a]/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                <span className="text-xs font-mono text-[#8b93b8] ml-2">brainflow-assistant v2.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#22c1ff] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c1ff] animate-ping"></span>
                Streaming Connected
              </div>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-5 sm:p-7 space-y-5 text-sm">
              {/* User Prompt */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] text-white px-5 py-3 rounded-2xl rounded-br-sm shadow-md font-medium text-sm">
                  Can you optimize our high-throughput API latency and explain the caching strategy?
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)] overflow-hidden p-0.5 flex-shrink-0 mt-0.5">
                  <Image src="/logo.png" alt="BrainFlow" width={30} height={30} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 bg-[#161d35]/90 border border-[#232b48] text-[#eef2ff] p-5 rounded-2xl rounded-bl-sm text-sm leading-relaxed space-y-3 shadow-lg">
                  <p className="font-semibold text-[#22c1ff]">
                    Here is a 3-layer architecture to slash API latency under 15ms:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[#eef2ff]/90 text-xs sm:text-sm">
                    <li><strong className="text-white">Edge Caching:</strong> Terminate SSL and cache idempotent GET requests at distributed edge points.</li>
                    <li><strong className="text-white">In-Memory Redis Layer:</strong> Cache token authentications and database read results with strict TTLs.</li>
                    <li><strong className="text-white">Asynchronous Write Queuing:</strong> Move secondary state updates to background job processors.</li>
                  </ul>
                  <div className="p-3 bg-[#080b16] border border-[#232b48] rounded-xl font-mono text-xs text-[#22c1ff]">
                    redis.setex(`cache:user:1042`, 3600, JSON.stringify(userData));
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-20 w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white tracking-tight">
            Engineered For Pure Speed &amp; Precision
          </h2>
          <p className="text-sm sm:text-base text-[#8b93b8] mt-2">
            Built from the ground up to give you an uncompromising AI workspace.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#10162a]/75 border border-[#232b48] rounded-3xl p-7 shadow-xl backdrop-blur-md hover:border-[#8b5cf6]/60 transition">
            <div className="w-12 h-12 rounded-2xl bg-[#22c1ff]/10 border border-[#22c1ff]/20 flex items-center justify-center text-[#22c1ff] mb-5 shadow-[0_0_15px_rgba(34,193,255,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Streaming</h3>
            <p className="text-xs sm:text-sm text-[#8b93b8] leading-relaxed">
              Tokens stream progressively in real time. Zero lag, zero awkward waiting states.
            </p>
          </div>

          <div id="intelligence" className="bg-[#10162a]/75 border border-[#232b48] rounded-3xl p-7 shadow-xl backdrop-blur-md hover:border-[#8b5cf6]/60 transition">
            <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6] mb-5 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .75.727h4.502a.75.75 0 0 0 .75-.727c.019-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
                <path fillRule="evenodd" d="M9.01 19.983c.068.75.69 1.267 1.49 1.267h3c.8 0 1.422-.517 1.49-1.267a.75.75 0 0 0-.745-.816h-3.49a.75.75 0 0 0-.745.816Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automatic Memory</h3>
            <p className="text-xs sm:text-sm text-[#8b93b8] leading-relaxed">
              Every conversation is titled automatically by prompt context and preserved with relative history markers.
            </p>
          </div>

          <div className="bg-[#10162a]/75 border border-[#232b48] rounded-3xl p-7 shadow-xl backdrop-blur-md hover:border-[#8b5cf6]/60 transition">
            <div className="w-12 h-12 rounded-2xl bg-[#c026d3]/10 border border-[#c026d3]/20 flex items-center justify-center text-[#c026d3] mb-5 shadow-[0_0_15px_rgba(192,38,211,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Client Exposure</h3>
            <p className="text-xs sm:text-sm text-[#8b93b8] leading-relaxed">
              No API keys or server endpoints exist in browser bundles. Everything runs via secure server orchestration.
            </p>
          </div>
        </div>

        {/* Big Bottom CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-[#10162a] via-[#161d35] to-[#10162a] border border-[#232b48] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#8b5cf6]/10 blur-[80px] pointer-events-none"></div>

          <h3 className="text-2xl sm:text-3xl font-bold font-display text-white mb-3">
            Ready to experience BrainFlow?
          </h3>
          <p className="text-xs sm:text-sm text-[#8b93b8] max-w-lg mx-auto mb-6">
            Jump right into the chat room or sign in to sync your conversation history across sessions.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/chat"
              className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:brightness-110 active:scale-95 transition"
            >
              Start Chatting Now &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-[#232b48] bg-[#0c1020]/90 backdrop-blur-md py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4a5484]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white p-0.5 overflow-hidden flex items-center justify-center">
              <Image src="/logo.png" alt="BrainFlow" width={18} height={18} className="object-contain" />
            </div>
            <span className="text-[#8b93b8] font-medium">BrainFlow AI</span>
            <span>&middot;</span>
            <span>&copy; 2026 Ayantik Mallick</span>
          </div>

          <div className="flex items-center gap-5 text-[#8b93b8]">
            <Link href="/chat" className="hover:text-white transition">Chat</Link>
            <Link href="/signin" className="hover:text-white transition">Sign in</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

