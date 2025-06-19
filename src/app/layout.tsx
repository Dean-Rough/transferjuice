import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
  openGraph: {
    title: 'Transfer Juice',
    description: 'Premier League ITK Transfer Digest',
    type: 'website',
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
      <body className='font-sans antialiased min-h-screen bg-dark-bg text-dark-text-primary flex flex-col'>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
