import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { StoryEditForm } from "@/components/StoryEditForm";

const prisma = new PrismaClient();

async function getStory(id: string) {
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
    },
  });

  if (!story) {
    notFound();
  }

  return story;
}

export default async function EditStoryPage({
  params,
}: {
  params: { id: string };
}) {
  const story = await getStory(params.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Edit Story</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StoryEditForm story={story} />
      </main>
    </div>
  );
}