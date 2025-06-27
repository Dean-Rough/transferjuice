import { prisma } from "../src/lib/prisma";

async function deleteBriefing() {
  await prisma.briefing.delete({
    where: {
      slug: "2025-06-22-18-quansah-s-leverkusen-leap-35m-dance-around-the-may",
    },
  });
  console.log("Deleted existing briefing");
  await prisma.$disconnect();
}

deleteBriefing();
