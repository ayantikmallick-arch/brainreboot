"use client";

import Image from "next/image";
import Link from "next/link";
import ParticleBackground from "@/Components/ParticleBackground";

export default function CookiePolicyPage() {
  const handleResetConsent = () => {
    try {
      localStorage.removeItem("brainflow_cookie_consent_v1");
      window.location.reload();
    } catch {}
  };

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
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#c026d3] font-mono">
                Storage &amp; Tracking Transparency
              </span>
              <span className="text-[#4a5484]">&middot;</span>
              <span className="text-[11px] sm:text-xs text-[#8b93b8]">ePrivacy Directive &amp; GDPR</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-black font-display tracking-tight text-white mt-1">
              Cookie Policy
            </h1>
            <p className="text-xs sm:text-sm text-[#8b93b8] mt-2 sm:mt-3">
              Last Updated: November 2026 &middot; Guidelines for BrainFlow AI (<strong className="text-white">brainflowai.in</strong>)
            </p>
          </div>

          {/* Cookie Text Sections */}
          <div className="space-y-7 sm:space-y-8 text-xs sm:text-sm text-[#eef2ff]/90 leading-relaxed font-body">
            {/* Section 1 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#c026d3]">1.</span> What Are Cookies and Local Storage?
              </h2>
              <p className="text-[#8b93b8]">
                Cookies are compact data files placed on your computer or mobile device by websites you visit. Web storage (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code> and <code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded font-mono text-[11px]">sessionStorage</code>) enables web applications to store information directly in your browser without transmitting it to remote ad servers on every request.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#c026d3]">2.</span> Storage Categories Used by BrainFlow
              </h2>
              <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-[#232b48]">
                <div>
                  <h3 className="font-semibold text-white">A. Strictly Necessary &amp; Security (Always Enabled)</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    Essential for secure authentication, CSRF defense, and maintaining your signed-in state via Google Firebase Auth. Without these, you cannot log into your account or manage synced chat conversations.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">B. Functional Storage (Device-Bound)</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    We use your browser&apos;s local storage to preserve your chat history (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded font-mono text-[11px]">chatHistory</code>), active project categories (<code className="text-[#22c1ff] bg-[#0d1226] px-1 py-0.5 rounded font-mono text-[11px]">brainflowProjects</code>), and your cookie preferences. This data remains on your physical machine and is not shared with ad brokers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">C. Analytics &amp; Advertising Trackers (Strictly None)</h3>
                  <p className="text-[#8b93b8] mt-0.5">
                    BrainFlow does <strong className="text-white">not</strong> utilize third-party behavioral analytics, pixel tracking, fingerprinting libraries, or cross-site advertising networks.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#c026d3]">3.</span> Detailed Storage Matrix
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-[#232b48] rounded-xl overflow-hidden text-xs">
                  <thead className="bg-[#0c1020] text-[#22c1ff]">
                    <tr>
                      <th className="p-2.5 border-b border-[#232b48]">Storage Key</th>
                      <th className="p-2.5 border-b border-[#232b48]">Type</th>
                      <th className="p-2.5 border-b border-[#232b48]">Purpose</th>
                      <th className="p-2.5 border-b border-[#232b48]">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232b48] text-[#8b93b8]">
                    <tr>
                      <td className="p-2.5 font-mono text-[#eef2ff]">firebase:authUser</td>
                      <td className="p-2.5">IndexedDB / Local</td>
                      <td className="p-2.5">Preserves user authentication session securely</td>
                      <td className="p-2.5">Until sign out</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[#eef2ff]">chatHistory</td>
                      <td className="p-2.5">localStorage</td>
                      <td className="p-2.5">Stores conversation history locally on device</td>
                      <td className="p-2.5">Persistent / User-cleared</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[#eef2ff]">brainflowProjects</td>
                      <td className="p-2.5">localStorage</td>
                      <td className="p-2.5">Stores customized project folders</td>
                      <td className="p-2.5">Persistent / User-cleared</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[#eef2ff]">brainflow_cookie_consent_v1</td>
                      <td className="p-2.5">localStorage</td>
                      <td className="p-2.5">Records your cookie consent selection</td>
                      <td className="p-2.5">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#c026d3]">4.</span> How to Manage or Reset Your Preferences
              </h2>
              <p className="text-[#8b93b8]">
                You can reset your consent selection at any time using the button below or manage cookies directly inside your browser settings:
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetConsent}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#c026d3]/40 bg-[#c026d3]/10 text-white hover:bg-[#c026d3]/20 transition"
                >
                  Reset Cookie Consent Preferences
                </button>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-2.5 sm:space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="text-[#c026d3]">5.</span> Contact Us
              </h2>
              <p className="text-[#8b93b8]">
                If you have questions regarding our cookie and local storage policies, please contact:
              </p>
              <div className="p-4 rounded-xl bg-[#0d1226] border border-[#232b48] text-xs text-[#8b93b8] space-y-1">
                <div><strong className="text-white">Operator:</strong> Ayantik Mallick</div>
                <div><strong className="text-white">Email:</strong> ayantikmallick@gmail.com</div>
                <div><strong className="text-white">Domain:</strong> <a href="https://www.brainflowai.in" target="_blank" rel="noopener noreferrer" className="text-[#22c1ff] underline underline-offset-2">https://www.brainflowai.in</a></div>
              </div>
            </section>
          </div>

          {/* Quick Legal Navigation Links */}
          <div className="mt-10 pt-6 border-t border-[#232b48] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8b93b8]">
            <Link href="/" className="hover:text-white transition">&larr; Return to Home</Link>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
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
            <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/cookie-policy" className="text-[#c026d3] font-medium transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
