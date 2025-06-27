/**
 * Dynamic Briefing Page
 * Supports both magazine-style and rich media layouts
 */

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CardBasedLayout } from "@/components/briefings/CardBasedLayout";
import {
  getBriefingBySlug,
  incrementBriefingViews,
} from "@/lib/database/briefings";
import type { BriefingWithRelations } from "@/types/briefing";
import dynamic from "next/dynamic";

// Temporarily disabled for deployment
const RichMediaBriefingPage = null;

interface BriefingPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    style?: "rich" | "classic";
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: BriefingPageProps): Promise<Metadata> {
  const briefing = await getBriefingBySlug(params.slug);

  if (!briefing) {
    return {
      title: "Briefing Not Found - Transfer Juice",
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
      type: "article",
      publishedTime: briefing.publishedAt?.toISOString(),
      authors: ["The Terry"],
      siteName: "Transfer Juice",
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
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/briefing/${briefing.slug}`],
    },
  };
}

export default async function BriefingPage({
  params,
  searchParams,
}: BriefingPageProps) {
  const briefing = await getBriefingBySlug(params.slug);

  if (!briefing || !briefing.isPublished) {
    notFound();
  }

  // Track view asynchronously
  incrementBriefingViews(briefing.id).catch(console.error);

  // For now, always use classic layout but enhanced content rendering
  // The BriefingContent component handles rich media properly
  const useRichMedia = false; // Temporarily disabled

  if (useRichMedia) {
    // return <RichMediaBriefingPage params={params} />;
    return notFound(); // Temporarily disabled
  }

  // Classic magazine layout
  return (
    <div className="min-h-screen bg-black">
      <CardBasedLayout briefing={briefing as BriefingWithRelations} />
    </div>
  );
}
