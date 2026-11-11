"use client";

import Image from "next/image";
import Link from "next/link";
import ParticleBackground from "@/Components/ParticleBackground";

export default function TermsOfServicePage() {
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
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#8b5cf6] font-mono">
                Terms &amp; User Agreement
              </span>
              <span className="text-[#4a5484]">&middot;</span>
              <span className="text-[11px] sm:text-xs text-[#8b93b8]">Effective Immediately</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-black font-display tracking-tight text-white mt-1">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-[#8b93b8] mt-2 sm:mt-3">
              Last Updated: November 2026 &middot; Agreement for using BrainFlow AI (<strong className="text-white">brainflowai.in</strong>)
            </p>
          </div>

          {/* Terms Text Sections */}
          <div className="space-y-7 sm:space-y-8 text-xs sm:text-sm text-[#eef2ff]/90 leading-relaxed font-body">
            {/* Section 1 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">1.</span> Acceptance of Terms
              </h2>
              <p className="text-[#8b93b8]">
                By accessing, browsing, registering an account, or interacting with BrainFlow AI (&ldquo;BrainFlow&rdquo;, &ldquo;the Service&rdquo;), you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">2.</span> Service Description &amp; Nature of AI
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow AI is an intelligent assistant created by <strong className="text-white">Ayantik Mallick</strong>, engineered to assist users with software development, learning, technical writing, and workflow automation.
              </p>
              <div className="p-3.5 rounded-xl bg-[#080b16] border border-[#232b48] text-xs text-[#8b93b8] space-y-1.5">
                <strong className="text-[#22c1ff] block font-semibold">Important AI Advisory:</strong>
                <p>
                  Artificial Intelligence models generate outputs based on probabilistic patterns. BrainFlow strives for accuracy and precision, but outputs may occasionally contain inaccuracies, hallucinations, or obsolete software syntax. You are solely responsible for reviewing and verifying any code, guidance, or critical decisions derived from BrainFlow outputs prior to implementation. BrainFlow outputs do not constitute professional legal, financial, or medical advice.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">3.</span> User Accounts &amp; Authentication
              </h2>
              <p className="text-[#8b93b8]">
                You may access BrainFlow either as an unauthenticated guest or by signing in with Google or email credentials via Firebase Authentication.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#8b93b8]">
                <li>You are responsible for safeguarding your login credentials and maintaining the confidentiality of your session.</li>
                <li>You agree to notify us immediately of any unauthorized access to your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate our security guidelines or engage in abusive activity.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">4.</span> Acceptable Use Policy
              </h2>
              <p className="text-[#8b93b8]">
                You agree not to use BrainFlow for any prohibited activities, including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#8b93b8]">
                <li>Generating malicious software, exploits, automated phishing vectors, or denial-of-service tools.</li>
                <li>Attempting to probe, scan, or breach the security of the application, servers, or rate-limiting infrastructure.</li>
                <li>Reverse engineering, decompiling, or attempting to extract proprietary prompt architectures or server orchestrators.</li>
                <li>Sending abusive volumes of automated queries that overwhelm the server infrastructure.</li>
                <li>Uploading content that infringes upon the intellectual property or privacy rights of third parties.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">5.</span> Intellectual Property &amp; Content Ownership
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-[#8b93b8]">
                <li><strong className="text-white">Platform Ownership:</strong> All rights, title, and interest in and to the BrainFlow AI interface, branding, logos, design components, software code, and systems belong exclusively to <strong className="text-white">Ayantik Mallick</strong>.</li>
                <li><strong className="text-white">User Input &amp; Output:</strong> As between you and BrainFlow, you retain all ownership rights to the prompts you submit and the outputs generated in response to your requests, subject to your compliance with these Terms.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">6.</span> Payment &amp; Subscription Compliance
              </h2>
              <p className="text-[#8b93b8]">
                BrainFlow currently provides free access tiers. If premium subscription tiers or credits are offered in the future, all transactions will strictly be processed through certified, PCI-DSS Level 1 compliant third-party payment gateways (such as Stripe Checkout). BrainFlow never directly collects, handles, or stores sensitive credit card numbers or banking data.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">7.</span> Limitation of Liability &amp; Disclaimers
              </h2>
              <p className="text-[#8b93b8]">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. AYANTIK MALLICK AND BRAINFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, REVENUE, OR OPERATIONAL INTERRUPTIONS, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#8b5cf6]">8.</span> Termination &amp; Contact
              </h2>
              <p className="text-[#8b93b8]">
                We reserve the right to modify or terminate access to the Service at our discretion without prior notice for violations of these Terms. For any inquiries regarding these Terms, please contact:
              </p>
              <div className="p-4 rounded-xl bg-[#0d1226] border border-[#232b48] text-xs text-[#8b93b8] space-y-1">
                <div><strong className="text-white">Operator:</strong> Ayantik Mallick</div>
                <div><strong className="text-white">Contact Email:</strong> ayantikmallick@gmail.com</div>
                <div><strong className="text-white">Official Domain:</strong> <a href="https://www.brainflowai.in" target="_blank" rel="noopener noreferrer" className="text-[#22c1ff] underline underline-offset-2">https://www.brainflowai.in</a></div>
              </div>
            </section>
          </div>

          {/* Quick Legal Navigation Links */}
          <div className="mt-10 pt-6 border-t border-[#232b48] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8b93b8]">
            <Link href="/" className="hover:text-white transition">&larr; Return to Home</Link>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
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
            <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-[#8b5cf6] font-medium transition">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
