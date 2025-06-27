#!/usr/bin/env tsx

import { config } from "dotenv";
import { processMediaPlaceholders } from "@/briefing-generator/steps/07-process-media-placeholders";

config();

async function testMediaProcessing() {
  console.log("Testing media processing...");
  
  const testContent = `
[HERO IMAGE: Erling Haaland celebration]

Some content here.

<blockquote class="twitter-tweet">
<p>🚨 BREAKING: Real Madrid target Haaland</p>
&mdash; Fabrizio Romano (@FabrizioRomano) <a href="https://twitter.com/test">June 25, 2025</a>
</blockquote>

[IMAGE: Santiago Bernabéu stadium]

More content.
  `;
  
  try {
    const result = await processMediaPlaceholders(testContent, "test-briefing-id");
    
    console.log("✅ Processing successful!");
    console.log("\nProcessed content:", result.content);
    console.log("\nMedia items:", result.media.length);
    console.log("\nTweet items:", result.tweets.length);
    
    result.media.forEach((item, i) => {
      console.log(`Media ${i + 1}:`, item);
    });
    
    result.tweets.forEach((item, i) => {
      console.log(`Tweet ${i + 1}:`, item);
    });
    
  } catch (error) {
    console.error("❌ Processing failed:", error);
  }
}

testMediaProcessing().catch(console.error);