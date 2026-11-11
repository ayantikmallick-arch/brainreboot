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
      <header className="relative z-20 w-full max-w-5xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between border-b border-[#232b48]/60 bg-[#0c1020]/40 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] overflow-hidden p-1 transition group-hover:scale-105">
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

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/chat"
            className="px-4 py-2 font-bold text-white rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition"
          >
            Open Chat &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 animate-rise">
        <div className="bg-[#10162a]/85 border border-[#232b48] rounded-3xl p-6 sm:p-12 shadow-2xl backdrop-blur-xl">
          {/* Title Area */}
          <div className="border-b border-[#232b48] pb-8 mb-8">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#22c1ff] font-mono">
              Legal &amp; Data Protection
            </span>
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white mt-2">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-[#8b93b8] mt-3">
              Effective Date: November 1, 2026 &middot; Official Policy for BrainFlow AI (brainflowai.in)
            </p>
          </div>

          {/* Policy Text Sections */}
          <div className="space-y-8 text-sm sm:text-base text-[#eef2ff]/90 leading-relaxed font-body">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">1.</span> Overview &amp; Operator
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow AI (<strong className="text-white">brainflowai.in</strong>) is an advanced AI assistant created and operated by <strong className="text-white">Ayantik Mallick</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). This Privacy Policy explains our practices regarding the collection, handling, storage, and protection of information when you access or interact with BrainFlow.
              </p>
              <p className="text-[#8b93b8]">
                We respect your personal privacy. We do not sell your personal data, nor do we monetize your queries for advertising.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">2.</span> Information We Collect
              </h2>
              <div className="space-y-3 pl-4 border-l-2 border-[#232b48]">
                <div>
                  <h3 className="font-semibold text-white">A. Guest Mode (Unauthenticated)</h3>
                  <p className="text-xs sm:text-sm text-[#8b93b8] mt-1">
                    When you use BrainFlow without logging in, your conversation history is stored exclusively in your device&apos;s local browser storage (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded">localStorage</code>). No user profile is created on our servers, and closing your browser or clearing storage will erase your session.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">B. Authenticated Accounts</h3>
                  <p className="text-xs sm:text-sm text-[#8b93b8] mt-1">
                    When you sign in using Google or Email through Google Firebase Authentication, we receive basic profile details including your name, email address, and profile photo URL. This information is solely used to authenticate your session and sync your conversation folders.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">C. Chat Queries &amp; Attached Files</h3>
                  <p className="text-xs sm:text-sm text-[#8b93b8] mt-1">
                    Messages and text files you submit are processed in real-time to generate intelligent responses. Files attached using the composer are temporarily parsed in-memory for your active conversation and are not saved into public databases.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">3.</span> Zero Public AI Model Training
              </h2>
              <p className="text-[#8b93b8]">
                We value intellectual property and confidentiality. <strong className="text-white">Your personal prompts, proprietary source code, and confidential documents submitted to BrainFlow are NOT used to train public foundational AI models.</strong> Requests are transmitted through private inference endpoints that adhere to strict zero-training data processing agreements.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">4.</span> Security Architecture &amp; Safeguards
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow implements defense-in-depth security best practices to protect your interactions:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-[#8b93b8]">
                <li><strong className="text-white">Strict Server-Side Isolation:</strong> No provider credentials, private proxy URLs, or secret tokens are ever exposed in client-side code or browser bundles.</li>
                <li><strong className="text-white">Transport Encryption (TLS 1.3):</strong> All network communications between your device, our servers, and authentication endpoints are encrypted in transit via modern HTTPS/TLS.</li>
                <li><strong className="text-white">Rate-Limiting &amp; DDoS Shielding:</strong> Automated sliding-window rate limiters prevent API flooding and brute-force abuse.</li>
                <li><strong className="text-white">Payload Sanitation &amp; XSS Defense:</strong> Strict bounds prevent oversized memory payloads, and dynamic Markdown rendering is sandboxed against malicious script injection or unverified protocols.</li>
                <li><strong className="text-white">HTTP Security Headers:</strong> Every response enforces strict <code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded">HSTS</code>, <code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded">X-Frame-Options: DENY</code> (clickjacking prevention), and <code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded">X-Content-Type-Options: nosniff</code>.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">5.</span> User Rights &amp; Data Deletion
              </h2>
              <p className="text-[#8b93b8]">
                You have complete control over your conversation records:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-[#8b93b8]">
                <li><strong className="text-white">Instant Chat Deletion:</strong> You can delete any individual chat directly from the sidebar by clicking the trash icon.</li>
                <li><strong className="text-white">Clear All History:</strong> You can instantly purge all stored conversations in one click from the Settings dialog (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded">Clear all chats</code>).</li>
                <li><strong className="text-white">Account Removal:</strong> You may request full deletion of your registered Firebase account and associated cloud data at any time by contacting us directly.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">6.</span> Third-Party Subprocessors
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow relies only on trusted cloud infrastructure partners:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-[#8b93b8]">
                <li><strong className="text-white">Google Cloud / Firebase:</strong> Provides user identity management and authentication services.</li>
                <li><strong className="text-white">Private Foundation Inference:</strong> High-performance server-side language model orchestration.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#22c1ff]">7.</span> Contact &amp; Operator Information
              </h2>
              <p className="text-[#8b93b8]">
                If you have questions, feedback, or data privacy requests regarding BrainFlow, you can reach the creator and administrator directly:
              </p>
              <div className="bg-[#0d1226] border border-[#232b48] rounded-2xl p-5 text-xs sm:text-sm space-y-2">
                <div>
                  <span className="text-[#8b93b8]">Developer &amp; Operator:</span>{" "}
                  <strong className="text-white">Ayantik Mallick</strong>
                </div>
                <div>
                  <span className="text-[#8b93b8]">Official Email:</span>{" "}
                  <a href="mailto:ayantakmallick@gmail.com" className="text-[#22c1ff] hover:underline font-semibold">
                    ayantakmallick@gmail.com
                  </a>
                </div>
                <div>
                  <span className="text-[#8b93b8]">Website:</span>{" "}
                  <a href="https://www.brainflowai.in" target="_blank" rel="noopener noreferrer" className="text-[#22c1ff] hover:underline font-semibold">
                    https://www.brainflowai.in
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Back Button */}
          <div className="mt-12 pt-6 border-t border-[#232b48] flex justify-between items-center flex-wrap gap-4">
            <Link
              href="/"
              className="text-xs text-[#8b93b8] hover:text-white transition flex items-center gap-1.5"
            >
              &larr; Return to Homepage
            </Link>

            <Link
              href="/chat"
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-md hover:brightness-110 active:scale-95 transition"
            >
              Start Chatting Free &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#232b48] bg-[#0c1020]/90 py-5 px-6 text-center text-xs text-[#4a5484]">
        &copy; 2026 BrainFlow AI &middot; Created by Ayantik Mallick &middot; All Rights Reserved.
      </footer>
    </main>
  );
}
