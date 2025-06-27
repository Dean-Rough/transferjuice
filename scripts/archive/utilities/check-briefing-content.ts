#!/usr/bin/env tsx

import { prisma } from "../src/lib/prisma";

async function checkBriefing() {
  try {
    const briefings = await prisma.briefing.findMany({
      take: 1,
      orderBy: { createdAt: "desc" },
    });

    if (briefings.length > 0) {
      const briefing = briefings[0];
      console.log("Latest briefing:");
      console.log("Title:", JSON.stringify(briefing.title, null, 2));
      console.log("Content type:", typeof briefing.content);
      console.log(
        "Content:",
        JSON.stringify(briefing.content, null, 2).substring(0, 500) + "...",
      );
      console.log("Sections:", briefing.sidebarSections);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBriefing();
