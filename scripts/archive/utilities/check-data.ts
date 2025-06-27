import { prisma } from "../src/lib/prisma";

async function checkData() {
  try {
    // Check recent briefings
    const briefings = await prisma.briefing.findMany({
      take: 3,
      orderBy: { timestamp: "desc" },
      select: { slug: true, title: true, timestamp: true },
    });

    console.log("Recent briefings:");
    briefings.forEach((b) => {
      console.log(`- ${b.slug} | ${b.title.main}`);
    });

    // Check breaking news config
    const breakingNews = await prisma.systemConfig.findUnique({
      where: { key: "daily_breaking_news" },
    });

    if (breakingNews) {
      const stories = JSON.parse(breakingNews.value);
      console.log("\nBreaking news stories:", stories.length);
      console.log("Sample:", stories[0]?.headline);
    } else {
      console.log("\nNo breaking news found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
