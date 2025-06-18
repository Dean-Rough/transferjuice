import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transfer Juice',
  description: 'Premier League ITK Transfer Digest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 