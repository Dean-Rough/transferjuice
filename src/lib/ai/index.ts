/**
 * AI Module Index
 * Main exports for the AI system with circular dependency fixes
 */

// Core AI components (temporarily limited exports due to circular dependencies)
export { TerryCommentaryGenerator } from './terry-pipeline';
export { TerryCommentarySystem } from './terryCommentarySystem';

// Temporarily disabled due to circular dependencies - will be re-enabled after architecture fix
// export { TerryIntegration } from './terryIntegration';
// export { TerryOrchestrator } from './terryOrchestrator';
// export { ContentQualityValidator } from './quality-validator';
// export { AIContentAnalyzer } from './content-analyzer';
// export { TerryArticleGenerator } from './article-generator';

// Types that are safe to export
export type {
  TerryCommentaryResult,
  TerryVoiceMetrics,
} from './terryCommentarySystem';

// Utility functions
export { terryPrompts } from './terry-prompts';

/**
 * Initialize AI system with dependency injection to avoid circular imports
 */
export function initializeAISystem(config?: {
  enableTerryCommentary?: boolean;
  enableQualityValidation?: boolean;
  enableContentAnalysis?: boolean;
}) {
  console.log('🤖 Initializing AI System...');
  console.log('AI system configuration:', config);
  console.log(
    'Some modules disabled temporarily due to circular dependency fixes'
  );

  console.log('✅ AI System initialized (partial functionality)');
  console.log('   - Terry commentary generation available');
  console.log('   - Quality validation temporarily disabled');
  console.log('   - Content analysis temporarily disabled');
  console.log('   - Terry orchestration temporarily disabled');

  return {
    terry: null, // TODO: Re-enable after circular dependency fix
    validator: null, // TODO: Re-enable after circular dependency fix
    analyzer: null, // TODO: Re-enable after circular dependency fix
    orchestrator: null, // TODO: Re-enable after circular dependency fix
    status: {
      isActive: true,
      warning: 'Partial functionality due to dependency fixes',
    },
  };
}

/**
 * Get AI system status
 */
export function getAISystemStatus() {
  return {
    terry: { isActive: true, warning: 'Basic functionality only' },
    validator: {
      isActive: false,
      error: 'Disabled due to circular dependency',
    },
    analyzer: { isActive: false, error: 'Disabled due to circular dependency' },
    orchestrator: {
      isActive: false,
      error: 'Disabled due to circular dependency',
    },
    timestamp: new Date().toISOString(),
  };
}
