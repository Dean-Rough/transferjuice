import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateRSSMetadata } from "@/lib/seoOptimizer";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://transferjuice.com";
    
    // Get recent briefings
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
      take: 20,
    });
    
    // Generate RSS XML
    const rssItems = briefings.map(briefing => {
      const metadata = generateRSSMetadata(briefing);
      
      // Build content from stories
      let content = "<div>";
      briefing.stories.forEach(({ story }: any) => {
        if (story.metadata?.headline) {
          content += `<h3>${story.metadata.headline}</h3>`;
          content += `<p>${story.metadata.contextParagraph}</p>`;
          if (story.metadata.transferDynamics) {
            content += `<p>${story.metadata.transferDynamics}</p>`;
          }
        } else {
          content += `<p>${story.tweet.content}</p>`;
        }
        content += `<p><em>${story.terryComment}</em></p>`;
        content += "<hr/>";
      });
      content += "</div>";
      
      return `
        <item>
          <title><![CDATA[${metadata.title}]]></title>
          <description><![CDATA[${metadata.description}]]></description>
          <link>${baseUrl}/briefing/${briefing.id}</link>
          <guid isPermaLink="true">${baseUrl}/briefing/${briefing.id}</guid>
          <pubDate>${metadata.pubDate}</pubDate>
          ${metadata.categories.map(cat => `<category>${cat}</category>`).join('')}
          <content:encoded><![CDATA[${content}]]></content:encoded>
        </item>
      `;
    }).join('');
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TransferJuice - Football Transfer News</title>
    <description>Hourly transfer briefings with the latest football transfer news, rumours and confirmed deals</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/feed/rss" rel="self" type="application/rss+xml" />
    <language>en-GB</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;
    
    await prisma.$disconnect();
    
    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}