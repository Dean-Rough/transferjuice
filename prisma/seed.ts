/**
 * Simple Database Seeding Script
 * Creates basic test data for the simplified schema
 */

import { PrismaClient } from "@prisma/client";
import { ITK_SOURCES } from "../src/lib/sources";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting simple database seeding...");

  // Clean existing data
  console.log("Cleaning existing data...");
  await prisma.briefingStory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.briefing.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();

  // Create sources
  console.log("Creating ITK sources...");
  for (const source of ITK_SOURCES) {
    await prisma.source.create({
      data: {
        name: source.name,
        handle: source.handle,
      },
    });
  }

  // Create a test user
  console.log("Creating test user...");
  await prisma.user.create({
    data: {
      email: "test@transferjuice.com",
      isActive: true,
    },
  });

  console.log("✅ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
