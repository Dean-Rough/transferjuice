import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { BriefingDetail } from "@/components/BriefingDetail";
import { generateSEOMetadata } from "@/lib/seoOptimizer";

const prisma = new PrismaClient();

interface BriefingPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BriefingPageProps): Promise<Metadata> {
  const briefing = await prisma.briefing.findUnique({
    where: { id: params.id },
    include: {
      stories: {
        include: {
          story: {
            include: {
              tweet: {
                include: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!briefing) {
    return {
      title: "Briefing Not Found - TransferJuice",
    };
  }

  const seoData = generateSEOMetadata(briefing);

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.ogTags.title,
      description: seoData.ogTags.description,
      type: "article",
      publishedTime: briefing.publishedAt?.toISOString() || briefing.createdAt.toISOString(),
      authors: ["TransferJuice"],
      images: seoData.ogTags.image ? [seoData.ogTags.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoData.ogTags.title,
      description: seoData.ogTags.description,
      images: seoData.ogTags.image ? [seoData.ogTags.image] : undefined,
    },
    other: {
      "script:ld+json": JSON.stringify(seoData.structuredData),
    },
  };
}

export default async function BriefingPage({ params }: BriefingPageProps) {
  const briefing = await prisma.briefing.findUnique({
    where: { id: params.id },
    include: {
      stories: {
        include: {
          story: {
            include: {
              tweet: {
                include: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  await prisma.$disconnect();

  if (!briefing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 max-w-4xl py-12">
        <BriefingDetail briefing={briefing} />
      </div>
    </div>
  );
}