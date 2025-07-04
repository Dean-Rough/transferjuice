#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { generateDailyEmailSummary } from "../src/lib/emailSummary";

async function main() {
  try {
    console.log("📧 Starting daily email summary...");

    await generateDailyEmailSummary();

    console.log("✅ Daily emails sent successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error sending daily emails:", error);
    process.exit(1);
  }
}

main();
