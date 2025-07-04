import { PrismaClient } from "@prisma/client";
import { BriefingList } from "@/components/BriefingList";

const prisma = new PrismaClient();

export default async function Home() {
  // Fetch briefings using our new simple schema
  const briefings = await prisma.briefing.findMany({
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
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  await prisma.$disconnect();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-orange-500 mb-3 font-bouchers tracking-wider">
            TransferJuice
          </h1>
          <p className="text-muted-foreground text-lg">
            Transfer news with Terry&apos;s sardonic commentary
          </p>
          <div className="mt-4 text-sm text-muted-foreground font-mono">
            Updates at 9am, 12pm, 4pm & 8pm GMT
          </div>
        </header>

        <BriefingList briefings={briefings} />
      </div>
    </div>
  );
}
