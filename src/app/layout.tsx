import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transfer Juice',
  description:
    "Premier League ITK Transfer Digest - All the rumours, for people who swear they're not obsessed with transfers",
  keywords: [
    'Premier League',
    'transfers',
    'football',
    'ITK',
    'news',
    'rumors',
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
    <html
      lang='en'
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <head>
        {/* DNS prefetch for external resources */}
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link rel='dns-prefetch' href='//www.google-analytics.com' />

        {/* Preload critical resources */}
        <link
          rel='preload'
          href='/fonts/geist-sans.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        <link
          rel='preload'
          href='/fonts/geist-mono.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />

        {/* Critical CSS optimization */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Critical CSS for initial paint */
          body { 
            background: #0A0808;
            color: #F9F2DF;
            font-family: var(--font-geist-sans), system-ui, sans-serif;
            font-display: swap;
          }
          .bg-dark-bg { background-color: #0A0808; }
          .text-dark-text-primary { color: #F9F2DF; }
        `,
          }}
        />
      </head>
      <body className='font-sans antialiased min-h-screen bg-dark-bg text-dark-text-primary flex flex-col'>
        <Header />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
