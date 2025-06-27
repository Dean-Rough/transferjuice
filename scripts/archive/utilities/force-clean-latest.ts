import { prisma } from "../src/lib/prisma";

async function forceCleanLatest() {
  const latest = await prisma.briefing.findFirst({
    where: { slug: "2025-06-22-22-quansah-s-leverkusen-leap-35m-for-the-future-s-may" },
  });
  
  if (!latest) {
    console.log("Briefing not found");
    return;
  }
  
  console.log("Cleaning latest briefing:", (latest.title as any).main);
  
  // Clean each section
  const cleanedContent = (latest.content as any[]).map((section: any) => {
    let cleanContent = section.content;
    
    // Fix broken HTML patterns
    cleanContent = cleanContent
      // Fix patterns like "20Madrid style=" to "20 Madrid"
      .replace(/(\d+)([A-Z][a-z]+)\s+style=/g, "$1 $2")
      // Remove any remaining style attributes
      .replace(/\sstyle\s*=\s*["'][^"']*["']/gi, "")
      // Remove event handlers
      .replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "")
      // Remove title attributes
      .replace(/\stitle\s*=\s*["'][^"']*["']/gi, "")
      // Remove all HTML tags
      .replace(/<[^>]*>/g, "")
      // Clean up HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      // Fix duplicate text patterns (e.g., "Real Madrid Real Madrid")
      .replace(/\b(\w+\s+\w+)\s+\1\b/g, "$1")
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim();
    
    console.log(`Cleaned ${section.type} section`);
    
    return {
      ...section,
      content: cleanContent
    };
  });
  
  // Update the briefing
  await prisma.briefing.update({
    where: { id: latest.id },
    data: {
      content: cleanedContent
    }
  });
  
  console.log("✅ Briefing cleaned and updated!");
  await prisma.$disconnect();
}

forceCleanLatest();