/**
 * Dynamic Briefing Page
 * Magazine-style briefing display with slug routing
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CardBasedLayout } from '@/components/briefings/CardBasedLayout';
import { getBriefingBySlug, incrementBriefingViews } from '@/lib/database/briefings';
import type { BriefingWithRelations } from '@/types/briefing';

interface BriefingPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BriefingPageProps): Promise<Metadata> {
  const briefing = await getBriefingBySlug(params.slug);
  
  if (!briefing) {
    return {
      title: 'Briefing Not Found - Transfer Juice',
    };
  }

  const title = (briefing.title as any).main;
  const subtitle = (briefing.title as any).subtitle;
  const description = subtitle || `${title} - Transfer Juice hourly briefing`;

  return {
    title: `${title} | Transfer Juice`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: briefing.publishedAt?.toISOString(),
      authors: ['The Terry'],
      siteName: 'Transfer Juice',
      images: [
        {
          url: `/api/og/briefing/${briefing.slug}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/briefing/${briefing.slug}`],
    },
  };
}

export default async function BriefingPage({ params }: BriefingPageProps) {
  const briefing = await getBriefingBySlug(params.slug);

  if (!briefing || !briefing.isPublished) {
    notFound();
  }

  // Track view asynchronously
  incrementBriefingViews(briefing.id).catch(console.error);

  return (
    <div className="min-h-screen bg-black">
      <CardBasedLayout 
        briefing={briefing as BriefingWithRelations}
        onShare={handleShare}
      />
    </div>
  );
}

// Client-side share handler
async function handleShare(platform: string) {
  // This will be called from client components
  // Implementation would track share analytics
  console.log(`Shared on ${platform}`);
}