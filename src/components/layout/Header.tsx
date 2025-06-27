"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Main Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto w-full px-8 md:px-16 lg:px-20">
          <nav
            className="flex items-center justify-between py-4"
            aria-label="Global navigation"
          >
            {/* Logo Lockup */}
            <div className="flex lg:flex-1">
              <Link href="/" className="-m-1.5 p-1.5 group">
                <span className="sr-only">Transfer Juice</span>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 group-hover:scale-105 transition-transform duration-200">
                    <Image
                      src="/transfer-icon.svg"
                      alt="Transfer Juice Icon"
                      width={40}
                      height={40}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="h-8 group-hover:opacity-80 transition-opacity duration-200">
                    <Image
                      src="/transfer-logo-cream.svg"
                      alt="Transfer Juice"
                      width={160}
                      height={32}
                      className="h-full w-auto"
                    />
                  </div>
                </div>
              </Link>
            </div>

            {/* Newsletter CTA - Desktop only */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <Link href="#newsletter">
                <Button size="sm">Subscribe</Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
