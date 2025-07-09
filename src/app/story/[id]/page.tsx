import { PrismaClient } from "@prisma/client";
import { StoryArticle } from "@/components/StoryArticle";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { Header } from "@/components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

interface PageProps {
  params: {
    id: string;
  };
}

async function getStory(id: string) {
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
      relatedTweets: {
        include: {
          tweet: {
            include: {
              source: true,
            },
          },
        },
        orderBy: {
          addedAt: "asc",
        },
      },
    },
  });

  if (!story || !story.headline || !story.articleContent) {
    notFound();
  }

  return story;
}

export default async function StoryPage({ params }: PageProps) {
  const story = await getStory(params.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Main Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16">
        <StoryArticle story={story} />

        {/* Back to stories */}
        <div className="max-w-6xl mx-auto mt-12">
          <Link
            href="/stories"
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            ← Back to all stories
          </Link>
        </div>
      </main>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const story = await getStory(params.id);

  return {
    title: story.headline,
    description: story.articleContent?.substring(0, 160) + "...",
    openGraph: {
      title: story.headline,
      description: story.articleContent?.substring(0, 160) + "...",
      images: story.headerImage ? [story.headerImage] : [],
    },
  };
}
