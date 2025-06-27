import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { BreakingNewsTicker } from "@/components/ui/BreakingNewsTicker";
import { SEOGenerator } from "@/lib/seo/seoGenerator";
import { generateMetadata as generateSEOMetadata } from "@/components/seo/SEOHead";
import "./globals.css";

// Initialize why-did-you-render in development
if (process.env.NODE_ENV === "development") {
  import("@/lib/wdyr");
}

// Generate optimized SEO metadata
const homeSEO = SEOGenerator.generateHomeSEO();
export const metadata: Metadata = {
  ...generateSEOMetadata(homeSEO),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/transfer-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/transfer-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/transfer-icon.svg",
        color: "#f23d17",
      },
    ],
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://transferjuice.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0808",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google AdSense - Replace with your actual AdSense code */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script> */}
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <BreakingNewsTicker className="sticky top-0 z-50" />
        <Header />
        <main className="flex-1">{children}</main>

        {/* Load Twitter widgets script */}
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="lazyOnload"
        />

        {/* Load TikTok embed script */}
        <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />

        {/* Performance Optimization */}
        <Script
          id="performance-optimizer"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize performance monitoring
              if (typeof window !== 'undefined') {
                // Simple performance monitoring
                if ('PerformanceObserver' in window) {
                  // Monitor LCP
                  const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                      const lcp = entries[entries.length - 1];
                      if (typeof gtag !== 'undefined') {
                        gtag('event', 'LCP', {
                          event_category: 'Web Vitals',
                          value: Math.round(lcp.startTime),
                          non_interaction: true
                        });
                      }
                    }
                  });
                  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                }
                
                // Register service worker
                if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                }
              }
            `,
          }}
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
