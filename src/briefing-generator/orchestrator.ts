/**
 * Briefing Generator Orchestrator
 * Re-exports the actual implementation from lib/briefings
 */

export { generateBriefing } from "@/lib/briefings/generator";
export type { GenerateBriefingOptions, GenerationResult } from "@/lib/briefings/generator";