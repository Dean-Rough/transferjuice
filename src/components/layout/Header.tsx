"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/Button";

interface NavigationItem {
  name: string;
  href: string;
  description?: string;
}

const navigation: NavigationItem[] = [
  {
    name: "Home",
    href: "/",
    description: "Live transfer feed",
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Main Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </Button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:gap-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="engagement-mono font-semibold leading-6 text-foreground hover:text-orange-500 transition-colors duration-200 tracking-wide"
                  title={item.description}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Newsletter CTA */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <Link href="#newsletter">
                <Button size="sm">Subscribe</Button>
              </Link>
            </div>
          </nav>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="space-y-2 py-6 border-t border-border">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-base engagement-mono font-semibold leading-7 text-foreground hover:bg-muted hover:text-orange-500 transition-all duration-200 tracking-wide"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div>
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                <div className="pt-4">
                  <Link
                    href="#newsletter"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full">Subscribe to Newsletter</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
