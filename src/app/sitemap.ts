import { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://transferjuice.com";
  
  // Get all briefings
  const briefings = await prisma.briefing.findMany({
    select: {
      id: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
  
  await prisma.$disconnect();
  
  // Generate sitemap entries
  const briefingUrls = briefings.map((briefing) => ({
    url: `${baseUrl}/briefing/${briefing.id}`,
    lastModified: briefing.publishedAt || briefing.createdAt,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...briefingUrls,
  ];
}