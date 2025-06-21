import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/Header';
import { BreakingNewsTicker } from '@/components/ui/BreakingNewsTicker';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transfer Juice - Live Global Football Transfer Feed',
  description:
    "Live global football transfer feed with Terry's ascerbic commentary - transforming ITK chaos into addictive entertainment",
  keywords: [
    'football transfers',
    'transfer news',
    'ITK',
    'Fabrizio Romano',
    'live feed',
    'global football',
    'transfer rumours',
    'Premier League',
    'La Liga',
    'Serie A',
    'Bundesliga',
  ],
  authors: [{ name: 'Transfer Juice' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/transfer-icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/transfer-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/transfer-icon.svg',
        color: '#f23d17',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Transfer Juice',
    description: 'Premier League ITK Transfer Digest',
    type: 'website',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Transfer Juice Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transfer Juice',
    description: 'Premier League ITK Transfer Digest',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0808',
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
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <BreakingNewsTicker className="sticky top-0 z-50" />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
