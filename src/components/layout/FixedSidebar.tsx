"use client";

import { NewsletterSignup } from "@/components/features/NewsletterSignup";
import { Archive, Rss, AtSign } from "lucide-react";

export function FixedSidebar() {
  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Newsletter Signup */}
      <div className="p-8 border-b border-zinc-800">
        <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider font-mono">
          Daily Summary
        </h3>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Yesterday&apos;s transfer madness delivered to your inbox
        </p>

        <NewsletterSignup variant="compact" className="space-y-3" />
      </div>

      {/* Quick Links */}
      <div className="p-8 border-b border-zinc-800">
        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider font-mono">
          Quick Links
        </h3>

        <div className="space-y-4">
          <a
            href="/archive"
            className="flex items-center gap-3 text-sm text-zinc-400 hover:text-orange-400 transition-colors group"
          >
            <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Briefing Archive</span>
          </a>
          <a
            href="/api/feed"
            className="flex items-center gap-3 text-sm text-zinc-400 hover:text-orange-400 transition-colors group"
          >
            <Rss className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>RSS Feed</span>
          </a>
          <a
            href="https://twitter.com/transferjuice"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-zinc-400 hover:text-orange-400 transition-colors group"
          >
            <AtSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Follow @TransferJuice</span>
          </a>
        </div>
      </div>

      {/* Contact */}
      <div className="flex-1 p-8">
        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider font-mono">
          Contact
        </h3>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-white mb-2">
              Press & Partnerships
            </p>
            <a
              href="mailto:hello@transferjuice.com"
              className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
            >
              hello@transferjuice.com
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-2">
              Technical Support
            </p>
            <a
              href="mailto:support@transferjuice.com"
              className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
            >
              support@transferjuice.com
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-zinc-800 bg-zinc-950/50">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-500">© 2024 Transfer Juice</span>
            <span className="text-orange-400 font-semibold">v1.0</span>
          </div>
          <div className="flex gap-6">
            <a
              href="/privacy"
              className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              Terms
            </a>
            <a
              href="/about"
              className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
