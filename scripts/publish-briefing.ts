/**
 * Publish the latest briefing
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function publishBriefing() {
  try {
    // Get the most recent unpublished briefing
    const briefing = await prisma.briefing.findFirst({
      where: { isPublished: false },
      orderBy: { createdAt: "desc" },
    });

    if (!briefing) {
      console.log("No unpublished briefings found");

      // Show recent briefings
      const recent = await prisma.briefing.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          slug: true,
          title: true,
          isPublished: true,
          createdAt: true,
        },
      });

      console.log("\nRecent briefings:");
      recent.forEach((b) => {
        console.log(
          `- ${b.slug} (${b.isPublished ? "Published" : "Draft"}) - ${b.createdAt.toLocaleString()}`,
        );
      });
      return;
    }

    // Publish it
    const updated = await prisma.briefing.update({
      where: { id: briefing.id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    console.log("✅ Briefing published!");
    console.log(`Slug: ${updated.slug}`);
    console.log(`Title: ${updated.title}`);
    console.log(`URL: https://transferjuice.com/briefings/${updated.slug}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

publishBriefing().catch(console.error);
