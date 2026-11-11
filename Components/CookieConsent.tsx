"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type CookiePreference = "all" | "essential" | "declined";

const COOKIE_CONSENT_KEY = "brainflow_cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        // Delay slightly for smooth fade-in after initial paint
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case localStorage is blocked in strict private browsing
    }
  }, []);

  const handleChoice = (preference: CookiePreference) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, preference);
      // Dispatch custom event so other components / scripts can react
      window.dispatchEvent(new CustomEvent("brainflow_consent_update", { detail: preference }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      role="region"
      className="fixed bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-auto sm:max-w-md z-50 animate-rise"
    >
      <div className="bg-[#10162a]/95 border border-[#232b48] hover:border-[#8b5cf6]/60 rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl text-left transition">
        {/* Top title & badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c1ff] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Privacy &amp; Cookie Preferences
            </span>
          </div>
          <span className="text-[10px] text-[#22c1ff] font-semibold bg-[#22c1ff]/10 border border-[#22c1ff]/20 px-2 py-0.5 rounded-full">
            GDPR &amp; CCPA
          </span>
        </div>

        {/* Description text */}
        <p className="text-xs text-[#8b93b8] leading-relaxed mb-3">
          BrainFlow uses essential storage (such as authentication session and local chat history) to function. We do not sell your personal data or track you across third-party websites. See our{" "}
          <Link href="/cookie-policy" className="text-[#22c1ff] underline underline-offset-2 hover:text-[#c026d3] transition">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-[#22c1ff] underline underline-offset-2 hover:text-[#c026d3] transition">
            Privacy Policy
          </Link>.
        </p>

        {/* Collapsible details */}
        {detailsOpen && (
          <div className="mb-3.5 p-3 rounded-xl bg-[#0a0e1a]/80 border border-[#232b48] text-[11px] text-[#8b93b8] space-y-2">
            <div>
              <strong className="text-white block font-medium">1. Strictly Necessary Storage (Always On)</strong>
              <span>Required for secure Firebase sign-in, token validation, and rate-limiting.</span>
            </div>
            <div>
              <strong className="text-white block font-medium">2. Local Functionality (Device-Only)</strong>
              <span>Saves your chat history and folder selections in your device&apos;s localStorage without uploading to advertiser networks.</span>
            </div>
            <div>
              <strong className="text-white block font-medium">3. Third-Party Trackers</strong>
              <span>Zero marketing trackers, behavioral pixels, or external ad cookies are loaded.</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-[#232b48]/60">
          <button
            type="button"
            onClick={() => handleChoice("all")}
            className="flex-1 py-2 px-3 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#22c1ff] via-[#8b5cf6] to-[#c026d3] shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 transition"
          >
            Accept All
          </button>

          <button
            type="button"
            onClick={() => handleChoice("essential")}
            className="flex-1 py-2 px-3 text-xs font-semibold text-[#8b93b8] hover:text-white rounded-xl border border-[#232b48] bg-[#161d35]/60 hover:bg-[#161d35] transition"
          >
            Essential Only
          </button>

          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="py-2 px-2 text-[11px] text-[#4a5484] hover:text-[#8b93b8] transition text-center underline underline-offset-2"
          >
            {detailsOpen ? "Hide Details" : "Customize"}
          </button>
        </div>
      </div>
    </aside>
  );
}
