import { PrismaClient } from "@prisma/client";
import { PageContent } from "./page-content";

const prisma = new PrismaClient();

async function getRecentStories() {
  const stories = await prisma.story.findMany({
    where: {
      headline: { not: null },
      articleContent: { not: null },
    },
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    // Get all stories, no limit
  });

  return stories;
}

export default async function Home() {
  const stories = await getRecentStories();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageContent stories={stories} />
    </div>
  );
}