/**
 * Fix broken briefings with malformed HTML
 * This script cleans up briefings that have HTML display issues
 */

import { prisma } from "../src/lib/prisma";

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  // First fix broken/incomplete HTML patterns
  let cleaned = html
    // Fix patterns like "20Madrid style=" 
    .replace(/(\d+)([A-Z][a-z]+)\s+style=/g, "$1 $2")
    // Remove inline styles and event handlers
    .replace(/\sstyle\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "")
    // Remove all HTML tags
    .replace(/<[^>]*>/g, "")
    // Clean up HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    // Clean up extra whitespace
    .replace(/\s+/g, " ")
    .trim();
    
  return cleaned;
}

/**
 * Clean malformed HTML from briefing content
 */
function cleanBriefingContent(content: any[]): any[] {
  return content.map((section) => {
    if (typeof section.content === "string" && section.content.includes("<")) {
      // Strip HTML from content
      const cleanContent = stripHtml(section.content);
      console.log(`Cleaned section ${section.type}: ${cleanContent.substring(0, 50)}...`);
      return {
        ...section,
        content: cleanContent,
      };
    }
    return section;
  });
}

async function fixBrokenBriefings() {
  try {
    console.log("🔧 Fixing broken briefings with HTML issues...\n");

    // Find briefings from the last 24 hours that might have HTML issues
    const recentBriefings = await prisma.briefing.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    console.log(`Found ${recentBriefings.length} recent briefings to check\n`);

    let fixedCount = 0;

    for (const briefing of recentBriefings) {
      const hasHtml = briefing.content.some(
        (section: any) =>
          typeof section.content === "string" && section.content.includes("<")
      );

      if (hasHtml) {
        console.log(`\n📝 Fixing briefing: ${briefing.title.main}`);
        console.log(`   Time: ${briefing.timestamp.toLocaleTimeString()}`);

        // Clean the content
        const cleanedContent = cleanBriefingContent(briefing.content as any[]);

        // Update the briefing
        await prisma.briefing.update({
          where: { id: briefing.id },
          data: {
            content: cleanedContent,
          },
        });

        fixedCount++;
        console.log(`   ✅ Fixed!`);
      }
    }

    console.log(`\n✨ Summary:`);
    console.log(`   - Checked: ${recentBriefings.length} briefings`);
    console.log(`   - Fixed: ${fixedCount} briefings`);
    console.log(`   - Clean: ${recentBriefings.length - fixedCount} briefings`);

    console.log("\n✅ All broken briefings have been fixed!");
  } catch (error) {
    console.error("❌ Error fixing briefings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixBrokenBriefings();