/**
 * Briefing Scheduler for Cron Job Integration
 * Handles automated hourly briefing generation
 */

import { generateBriefing } from './generator';

export interface SchedulerConfig {
  enabled: boolean;
  testMode: boolean;
  notificationWebhook?: string;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface SchedulerResult {
  success: boolean;
  briefingId?: string;
  timestamp: string;
  error?: string;
  retryCount: number;
  duration: number;
}

const defaultConfig: SchedulerConfig = {
  enabled: true,
  testMode: false,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

export class BriefingScheduler {
  private config: SchedulerConfig;
  
  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Execute scheduled briefing generation
   * Called by Vercel Cron or other scheduling systems
   */
  async execute(): Promise<SchedulerResult> {
    const startTime = Date.now();
    const now = new Date();
    
    // Generate timestamp for current hour
    const timestamp = this.generateTimestamp(now);
    
    console.log(`[BriefingScheduler] Starting scheduled generation for ${timestamp}`);
    
    if (!this.config.enabled) {
      console.log('[BriefingScheduler] Scheduler is disabled, skipping generation');
      return {
        success: false,
        timestamp,
        error: 'Scheduler disabled',
        retryCount: 0,
        duration: Date.now() - startTime,
      };
    }
    
    let retryCount = 0;
    let lastError: Error | null = null;
    
    // Retry logic for resilience
    while (retryCount <= this.config.maxRetries) {
      try {
        // Check if briefing already exists (idempotency)
        const exists = await this.checkBriefingExists(timestamp);
        if (exists) {
          console.log(`[BriefingScheduler] Briefing already exists for ${timestamp}`);
          return {
            success: true,
            briefingId: `briefing-${timestamp}`,
            timestamp,
            retryCount,
            duration: Date.now() - startTime,
          };
        }
        
        // Generate the briefing
        const briefing = await generateBriefing({
          timestamp,
          testMode: this.config.testMode,
        });
        
        // Notify success
        await this.notifySuccess(briefing.id, timestamp);
        
        console.log(`[BriefingScheduler] Successfully generated briefing ${briefing.id}`);
        
        return {
          success: true,
          briefingId: briefing.id,
          timestamp,
          retryCount,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;
        
        console.error(
          `[BriefingScheduler] Generation attempt ${retryCount} failed:`,
          lastError.message
        );
        
        if (retryCount <= this.config.maxRetries) {
          console.log(`[BriefingScheduler] Retrying in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }
    
    // All retries exhausted
    const errorMessage = `Generation failed after ${retryCount} attempts: ${lastError?.message}`;
    await this.notifyError(errorMessage, timestamp);
    
    return {
      success: false,
      timestamp,
      error: errorMessage,
      retryCount,
      duration: Date.now() - startTime,
    };
  }
  
  /**
   * Generate timestamp in YYYY-MM-DD-HH format
   */
  private generateTimestamp(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      String(date.getHours()).padStart(2, '0'),
    ].join('-');
  }
  
  /**
   * Check if briefing already exists (for idempotency)
   */
  private async checkBriefingExists(timestamp: string): Promise<boolean> {
    try {
      // TODO: Replace with actual database check
      // const existing = await prisma.briefing.findUnique({
      //   where: { slug: timestamp },
      //   select: { id: true },
      // });
      // return !!existing;
      
      // Mock implementation
      return false;
    } catch (error) {
      console.error('[BriefingScheduler] Error checking existing briefing:', error);
      return false;
    }
  }
  
  /**
   * Send success notification
   */
  private async notifySuccess(briefingId: string, timestamp: string): Promise<void> {
    if (!this.config.notificationWebhook) return;
    
    try {
      await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'briefing.generated',
          briefingId,
          timestamp,
          success: true,
        }),
      });
    } catch (error) {
      console.error('[BriefingScheduler] Failed to send success notification:', error);
    }
  }
  
  /**
   * Send error notification
   */
  private async notifyError(error: string, timestamp: string): Promise<void> {
    console.error(`[BriefingScheduler] Generation failed for ${timestamp}:`, error);
    
    if (!this.config.notificationWebhook) return;
    
    try {
      await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'briefing.generation.failed',
          timestamp,
          error,
          success: false,
        }),
      });
    } catch (notifyError) {
      console.error('[BriefingScheduler] Failed to send error notification:', notifyError);
    }
  }
  
  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get scheduler status
   */
  getStatus(): {
    enabled: boolean;
    testMode: boolean;
    nextRun: string;
  } {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    return {
      enabled: this.config.enabled,
      testMode: this.config.testMode,
      nextRun: nextHour.toISOString(),
    };
  }
}

// Export singleton instance for cron job
export const briefingScheduler = new BriefingScheduler({
  enabled: process.env.ENABLE_BRIEFING_GENERATION === 'true',
  testMode: process.env.NODE_ENV === 'development',
  notificationWebhook: process.env.BRIEFING_NOTIFICATION_WEBHOOK,
  maxRetries: parseInt(process.env.BRIEFING_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.BRIEFING_RETRY_DELAY || '5000'),
});

/**
 * Vercel Cron Job Handler
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/briefings",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function handleCronJob(): Promise<SchedulerResult> {
  return briefingScheduler.execute();
}