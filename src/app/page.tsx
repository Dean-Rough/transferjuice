import { PrismaClient } from "@prisma/client";
import { BriefingList } from "@/components/BriefingList";
import { RSSFeedWidget } from "@/components/RSSFeedWidget";

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
      <div className="container mx-auto px-8 max-w-7xl">
        <header className="mb-12 border-b border-border py-8">
          <div className="flex items-center">
            {/* Logo lockup on the left */}
            <div className="flex items-center gap-3">
              <img 
                src="/transfer-icon.svg" 
                alt="TransferJuice Icon" 
                className="h-12 w-auto"
              />
              <img 
                src="/transfer-logo-cream.svg" 
                alt="TransferJuice" 
                className="h-12 w-auto"
              />
            </div>
            
            {/* Spacer */}
            <div className="flex-1"></div>
            
            {/* Get the news button aligned with right edge of widget column */}
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bouchers text-lg transition-colors">
              GET THE NEWS
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - briefings */}
          <div className="flex-1">
            <BriefingList briefings={briefings} />
          </div>

          {/* Right sidebar - RSS feed */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex justify-center">
            <div className="sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto w-full max-w-[350px]">
              <RSSFeedWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
