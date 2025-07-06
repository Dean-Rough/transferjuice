import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://transferjuice.com"),
  title: {
    default: "TransferJuice - Latest Football Transfer News & Briefings",
    template: "%s | TransferJuice",
  },
  description: "Hourly football transfer briefings with the latest news, rumours and confirmed deals. Get comprehensive transfer updates for Premier League, La Liga, Serie A and more.",
  keywords: [
    "football transfers",
    "transfer news",
    "transfer rumours",
    "Premier League transfers",
    "La Liga transfers",
    "Serie A transfers",
    "transfer briefings",
    "football news",
    "transfer updates",
    "transfer window"
  ],
  authors: [{ name: "TransferJuice" }],
  creator: "TransferJuice",
  publisher: "TransferJuice",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#FF6B35" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "TransferJuice",
    title: "TransferJuice - Latest Football Transfer News & Briefings",
    description: "Hourly football transfer briefings with the latest news, rumours and confirmed deals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TransferJuice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TransferJuice - Latest Football Transfer News",
    description: "Hourly football transfer briefings with the latest news, rumours and confirmed deals.",
    images: ["/twitter-image.png"],
    creator: "@transferjuice",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/api/feed/rss", title: "TransferJuice RSS Feed" }],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
