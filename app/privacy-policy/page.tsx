"use client";

import Image from "next/image";
import Link from "next/link";
import ParticleBackground from "@/Components/ParticleBackground";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen relative bg-[#0a0e1a] text-[#eef2ff] flex flex-col justify-between overflow-x-hidden selection:bg-[#8b5cf6]/30 selection:text-[#22c1ff]">
      {/* Background Particles */}
      <ParticleBackground />

      {/* Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between border-b border-[#232b48]/60 bg-[#0c1020]/40 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] overflow-hidden p-1 transition group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="BrainFlow Logo"
              width={32}
              height={32}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1 font-bold text-lg tracking-tight font-display">
            <span className="text-[#22c1ff]">Brain</span>
            <span className="text-[#c026d3]">Flow</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <Link
            href="/chat"
            className="px-3.5 sm:px-4 py-2 font-bold text-white rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition"
          >
            Open Chat &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 animate-rise">
        <div className="bg-[#10162a]/85 border border-[#232b48] rounded-2xl sm:rounded-3xl p-5 sm:p-12 shadow-2xl backdrop-blur-xl">
          {/* Title Area */}
          <div className="border-b border-[#232b48] pb-6 sm:pb-8 mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#22c1ff] font-mono">
                Legal &amp; Compliance
              </span>
              <span className="text-[#4a5484]">&middot;</span>
              <span className="text-[11px] sm:text-xs text-[#8b93b8]">GDPR &amp; CCPA Ready</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-black font-display tracking-tight text-white mt-1">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-[#8b93b8] mt-2 sm:mt-3">
              Last Updated: November 2026 &middot; Applicable to BrainFlow AI (<strong className="text-white">brainflowai.in</strong>)
            </p>
          </div>

          {/* Policy Text Sections */}
          <div className="space-y-7 sm:space-y-8 text-xs sm:text-sm text-[#eef2ff]/90 leading-relaxed font-body">
            {/* Section 1 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">1.</span> Overview &amp; Data Controller
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow AI is an intelligent assistant platform created and operated by <strong className="text-white">Ayantik Mallick</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). We are dedicated to providing privacy-first AI workflows. We do not sell your personal data, monetize your chat queries for advertising, or deploy third-party cross-site behavioral tracking pixels.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">2.</span> Data We Collect &amp; Processing Scope
              </h2>
              <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-[#232b48]">
                <div>
                  <h3 className="font-semibold text-white">A. Unauthenticated / Guest Sessions</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    When using BrainFlow without signing in, your conversation history, project classifications, and prompts remain exclusively within your device&apos;s local browser storage (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>). No cloud user account is created.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">B. Authenticated User Accounts</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    When signing in via Google OAuth or Email credentials, authentication is handled securely via Google Firebase Authentication. We process your public display name, email address, and profile photo avatar URL to manage your session tokens and sync your history.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">C. Message Payloads &amp; Real-Time Streaming</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    Prompts and uploaded text/code files are transmitted over TLS encrypted connections to our secure backend and processed via our private API orchestrator (Rotato) to stream AI completions. We do not use your proprietary prompts to train public frontier AI models.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">D. Technical &amp; Operational Logs</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    To prevent denial-of-service attacks, automated abuse, and brute-force flooding, our API routes inspect incoming IP addresses to apply strict in-memory rate limiting (maximum 40 requests/minute per client). These logs are non-persistent and automatically cycle out of memory.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">3.</span> Privacy &amp; Self-Hosted Assets Guarantee
              </h2>
              <p className="text-[#8b93b8]">
                In compliance with modern European (GDPR) and California (CCPA) privacy standards:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#8b93b8]">
                <li><strong className="text-white">Self-Hosted Typography:</strong> All fonts and UI assets are bundled and served directly from our deployment domain. No external client requests are made to third-party font or icon CDNs that could leak your IP address.</li>
                <li><strong className="text-white">No Third-Party Ad Trackers:</strong> We do not load Google Analytics advertising cookies, Meta Pixel, TikTok Pixel, or retargeting scripts.</li>
                <li><strong className="text-white">Zero Third-Party Data Selling:</strong> We never sell, rent, or trade user records, emails, or conversation content to data brokers.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">4.</span> Your Rights &amp; Data Deletion
              </h2>
              <p className="text-[#8b93b8]">
                You maintain complete ownership and control over your data:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#8b93b8]">
                <li><strong className="text-white">Local History Cleansing:</strong> You can purge all local chats instantly from the Settings modal in the Chat Interface or by clearing your browser cache.</li>
                <li><strong className="text-white">Account Deletion:</strong> You can request full erasure of your account record and associated Firebase profile at any time by contacting us.</li>
                <li><strong className="text-white">GDPR / CCPA Rights:</strong> You have the right to access, rectify, export, or restrict processing of your personal information.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">5.</span> Security Architecture
              </h2>
              <p className="text-[#8b93b8]">
                We implement defense-in-depth protections including HTTP security headers (Content Security Policy, Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin), server-side environment variable isolation, and Zod input schema sanitization.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">6.</span> Contact &amp; Privacy Officer
              </h2>
              <p className="text-[#8b93b8]">
                For any questions, data subject requests, or privacy compliance inquiries, please contact:
              </p>
              <div className="p-4 rounded-xl bg-[#0d1226] border border-[#232b48] text-xs text-[#8b93b8] space-y-1">
                <div><strong className="text-white">Founder &amp; Developer:</strong> Ayantik Mallick</div>
                <div><strong className="text-white">Platform:</strong> BrainFlow AI</div>
                <div><strong className="text-white">Email:</strong> ayantikmallick@gmail.com</div>
                <div><strong className="text-white">Website:</strong> <a href="https://www.brainflowai.in" target="_blank" rel="noopener noreferrer" className="text-[#22c1ff] underline underline-offset-2">https://www.brainflowai.in</a></div>
              </div>
            </section>
          </div>

          {/* Quick Legal Navigation Links */}
          <div className="mt-10 pt-6 border-t border-[#232b48] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8b93b8]">
            <Link href="/" className="hover:text-white transition">&larr; Return to Home</Link>
            <div className="flex items-center gap-4">
              <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#232b48] bg-[#0c1020]/90 backdrop-blur-md py-5 sm:py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4a5484]">
          <div className="flex items-center gap-2">
            <span className="text-[#8b93b8] font-medium">BrainFlow AI</span>
            <span>&middot;</span>
            <span>&copy; 2026 Ayantik Mallick</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-[#8b93b8]">
            <Link href="/privacy-policy" className="text-[#22c1ff] font-medium transition">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
