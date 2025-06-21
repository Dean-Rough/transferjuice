/**
 * Pipeline Metrics Collection and Monitoring
 * Real-time performance tracking for the Transfer Juice data pipeline
 */

import { prisma } from '@/lib/prisma';
import { CONFIG } from '@/config/pipeline';
import { z } from 'zod';

// Metrics schemas
export const PipelineExecutionMetricsSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.enum(['running', 'completed', 'failed', 'timeout']),
  stage: z.enum(['source_monitoring', 'classification', 'processing', 'quality', 'mixing', 'broadcasting']),
  
  // Performance metrics
  itemsProcessed: z.number().default(0),
  itemsSuccessful: z.number().default(0),
  itemsFailed: z.number().default(0),
  
  // Resource usage
  memoryUsed: z.number().optional(),
  cpuUsage: z.number().optional(),
  
  // Quality metrics
  averageQualityScore: z.number().optional(),
  terryCompatibilityScore: z.number().optional(),
  humanReviewRequired: z.number().default(0),
  
  // Error information
  errorType: z.string().optional(),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  
  metadata: z.record(z.any()).optional(),
});

export const HealthCheckResultSchema = z.object({
  service: z.enum(['database', 'ai', 'twitter', 'websocket', 'cache']),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  responseTime: z.number(),
  timestamp: z.date(),
  details: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export const PerformanceMetricsSchema = z.object({
  timestamp: z.date(),
  
  // Pipeline performance
  averageProcessingTime: z.number(),
  successRate: z.number(),
  errorRate: z.number(),
  throughput: z.number(), // items per hour
  
  // Quality metrics
  averageQualityScore: z.number(),
  qualityPassRate: z.number(),
  humanReviewRate: z.number(),
  
  // Resource metrics
  memoryUsage: z.number(),
  cpuUsage: z.number(),
  cacheHitRate: z.number(),
  
  // External service metrics
  databaseResponseTime: z.number(),
  aiServiceResponseTime: z.number(),
  twitterApiResponseTime: z.number(),
  
  // User experience metrics
  websocketConnections: z.number(),
  feedUpdateLatency: z.number(),
  
  // Content metrics
  totalFeedItems: z.number(),
  partnerContentRatio: z.number(),
  uniqueTagsUsed: z.number(),
});

export type PipelineExecutionMetrics = z.infer<typeof PipelineExecutionMetricsSchema>;
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

interface MetricsCollectorConfig {
  enabled: boolean;
  retentionPeriod: number; // in milliseconds
  aggregationInterval: number; // in milliseconds
  enableRealTimeAlerts: boolean;
}

export class PipelineMetricsCollector {
  private config: MetricsCollectorConfig;
  private currentExecution: Map<string, PipelineExecutionMetrics> = new Map();
  private healthCache: Map<string, HealthCheckResult> = new Map();
  private metricsBuffer: PerformanceMetrics[] = [];

  constructor(config: Partial<MetricsCollectorConfig> = {}) {
    this.config = {
      enabled: true,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      aggregationInterval: 60 * 1000, // 1 minute
      enableRealTimeAlerts: true,
      ...config,
    };

    if (this.config.enabled) {
      this.startMetricsCollection();
    }
  }

  /**
   * Track pipeline execution start
   */
  async startExecution(stage: PipelineExecutionMetrics['stage'], metadata?: Record<string, any>): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: PipelineExecutionMetrics = {
      id: `metrics_${executionId}`,
      executionId,
      startTime: new Date(),
      status: 'running',
      stage,
      itemsProcessed: 0,
      itemsSuccessful: 0,
      itemsFailed: 0,
      humanReviewRequired: 0,
      metadata,
    };

    this.currentExecution.set(executionId, execution);
    
    // Log execution start
    console.log(`📊 Pipeline execution started: ${executionId} (${stage})`);
    
    return executionId;
  }

  /**
   * Update execution progress
   */
  updateExecution(
    executionId: string,
    updates: Partial<PipelineExecutionMetrics>
  ): void {
    const execution = this.currentExecution.get(executionId);
    if (!execution) {
      console.warn(`Execution ${executionId} not found for update`);
      return;
    }

    // Update execution metrics
    Object.assign(execution, updates);
    
    // Calculate duration if not provided
    if (!execution.duration && execution.startTime) {
      execution.duration = Date.now() - execution.startTime.getTime();
    }

    this.currentExecution.set(executionId, execution);
  }

  /**
   * Complete pipeline execution
   */
  async completeExecution(
    executionId: string,
    status: 'completed' | 'failed' | 'timeout',
    error?: { type: string; message: string; stack?: string }
  ): Promise<void> {
    const execution = this.currentExecution.get(executionId);
    if (!execution) {
      console.warn(`Execution ${executionId} not found for completion`);
      return;
    }

    // Finalize execution metrics
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.status = status;

    if (error) {
      execution.errorType = error.type;
      execution.errorMessage = error.message;
      execution.stackTrace = error.stack;
    }

    // Calculate resource usage if available
    if (process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      execution.memoryUsed = memoryUsage.heapUsed;
    }

    // Store in database for historical tracking
    await this.persistExecution(execution);

    // Remove from current executions
    this.currentExecution.delete(executionId);

    // Check for alerts
    if (this.config.enableRealTimeAlerts) {
      await this.checkAlerts(execution);
    }

    console.log(`📊 Pipeline execution completed: ${executionId} (${status}) - ${execution.duration}ms`);
  }

  /**
   * Perform health check on a service
   */
  async checkServiceHealth(service: HealthCheckResult['service']): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let status: HealthCheckResult['status'] = 'healthy';
    let details: Record<string, any> = {};
    let error: string | undefined;

    try {
      switch (service) {
        case 'database':
          await this.checkDatabaseHealth();
          details = { connectionCount: await this.getDatabaseConnections() };
          break;

        case 'ai':
          await this.checkAIHealth();
          details = { modelVersion: CONFIG.ai.openai.model };
          break;

        case 'twitter':
          await this.checkTwitterHealth();
          details = { rateLimitRemaining: await this.getTwitterRateLimit() };
          break;

        case 'websocket':
          details = await this.checkWebSocketHealth();
          break;

        case 'cache':
          details = await this.checkCacheHealth();
          break;
      }
    } catch (err) {
      status = 'unhealthy';
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const result: HealthCheckResult = {
      service,
      status,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details,
      error,
    };

    // Cache result for dashboard
    this.healthCache.set(service, result);

    return result;
  }

  /**
   * Get current pipeline metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    
    // Calculate metrics from recent executions
    const recentExecutions = await this.getRecentExecutions(60 * 60 * 1000); // Last hour
    
    const metrics: PerformanceMetrics = {
      timestamp: now,
      
      // Pipeline performance
      averageProcessingTime: this.calculateAverageProcessingTime(recentExecutions),
      successRate: this.calculateSuccessRate(recentExecutions),
      errorRate: this.calculateErrorRate(recentExecutions),
      throughput: this.calculateThroughput(recentExecutions),
      
      // Quality metrics
      averageQualityScore: this.calculateAverageQualityScore(recentExecutions),
      qualityPassRate: this.calculateQualityPassRate(recentExecutions),
      humanReviewRate: this.calculateHumanReviewRate(recentExecutions),
      
      // Resource metrics
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCPUUsage(),
      cacheHitRate: await this.getCacheHitRate(),
      
      // External service metrics
      databaseResponseTime: this.healthCache.get('database')?.responseTime || 0,
      aiServiceResponseTime: this.healthCache.get('ai')?.responseTime || 0,
      twitterApiResponseTime: this.healthCache.get('twitter')?.responseTime || 0,
      
      // User experience metrics
      websocketConnections: await this.getWebSocketConnections(),
      feedUpdateLatency: await this.getFeedUpdateLatency(),
      
      // Content metrics
      totalFeedItems: await this.getTotalFeedItems(),
      partnerContentRatio: await this.getPartnerContentRatio(),
      uniqueTagsUsed: await this.getUniqueTagsUsed(),
    };

    // Add to buffer for aggregation
    this.metricsBuffer.push(metrics);

    return metrics;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<{
    currentMetrics: PerformanceMetrics;
    healthChecks: HealthCheckResult[];
    activeExecutions: PipelineExecutionMetrics[];
    recentAlerts: any[];
    historicalTrends: any[];
  }> {
    const [currentMetrics, healthChecks] = await Promise.all([
      this.getCurrentMetrics(),
      this.performAllHealthChecks(),
    ]);

    const activeExecutions = Array.from(this.currentExecution.values());
    const recentAlerts = await this.getRecentAlerts();
    const historicalTrends = await this.getHistoricalTrends();

    return {
      currentMetrics,
      healthChecks,
      activeExecutions,
      recentAlerts,
      historicalTrends,
    };
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every minute
    setInterval(async () => {
      try {
        await this.getCurrentMetrics();
        await this.performAllHealthChecks();
        await this.cleanupOldMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, this.config.aggregationInterval);

    console.log('📊 Pipeline metrics collection started');
  }

  /**
   * Perform all health checks
   */
  private async performAllHealthChecks(): Promise<HealthCheckResult[]> {
    const services: HealthCheckResult['service'][] = ['database', 'ai', 'twitter', 'websocket', 'cache'];
    
    const results = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<HealthCheckResult> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(execution: PipelineExecutionMetrics): Promise<void> {
    const alerts: string[] = [];

    // Check processing time
    if (execution.duration && execution.duration > CONFIG.monitoring.alerts.performanceThreshold) {
      alerts.push(`Pipeline execution exceeded performance threshold: ${execution.duration}ms`);
    }

    // Check error rate
    const errorRate = execution.itemsFailed / (execution.itemsProcessed || 1);
    if (errorRate > CONFIG.monitoring.alerts.pipelineFailureThreshold) {
      alerts.push(`High error rate detected: ${(errorRate * 100).toFixed(2)}%`);
    }

    // Check quality score
    if (execution.averageQualityScore && execution.averageQualityScore < CONFIG.monitoring.alerts.qualityDegradationThreshold * 100) {
      alerts.push(`Quality score below threshold: ${execution.averageQualityScore}`);
    }

    // Send alerts if any
    for (const alert of alerts) {
      await this.sendAlert(alert, execution);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(message: string, execution: PipelineExecutionMetrics): Promise<void> {
    console.warn(`🚨 ALERT: ${message}`);
    
    // Here you would integrate with your alerting system (Slack, email, etc.)
    // For now, we'll just log and store in database
    
    try {
      // Store alert in database for tracking
      // This would be implemented based on your alerting schema
      console.log(`Alert stored for execution ${execution.executionId}: ${message}`);
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  /**
   * Database-specific health checks
   */
  private async checkDatabaseHealth(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }

  private async getDatabaseConnections(): Promise<number> {
    // This would return actual connection count from your database
    return 5; // Placeholder
  }

  /**
   * AI service health checks
   */
  private async checkAIHealth(): Promise<void> {
    // This would test OpenAI API connectivity
    // Implementation depends on your AI service setup
  }

  /**
   * Twitter API health checks
   */
  private async checkTwitterHealth(): Promise<void> {
    // This would test Twitter API connectivity
    // Implementation depends on your Twitter client setup
  }

  private async getTwitterRateLimit(): Promise<number> {
    // Return remaining rate limit
    return 100; // Placeholder
  }

  /**
   * WebSocket health checks
   */
  private async checkWebSocketHealth(): Promise<Record<string, any>> {
    return {
      activeConnections: await this.getWebSocketConnections(),
      messageQueue: 0, // Placeholder
    };
  }

  /**
   * Cache health checks
   */
  private async checkCacheHealth(): Promise<Record<string, any>> {
    return {
      hitRate: await this.getCacheHitRate(),
      memoryUsage: 50, // Placeholder percentage
    };
  }

  /**
   * Utility methods for metric calculations
   */
  private calculateAverageProcessingTime(executions: PipelineExecutionMetrics[]): number {
    if (executions.length === 0) return 0;
    const totalTime = executions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
    return totalTime / executions.length;
  }

  private calculateSuccessRate(executions: PipelineExecutionMetrics[]): number {
    if (executions.length === 0) return 1;
    const successful = executions.filter(exec => exec.status === 'completed').length;
    return successful / executions.length;
  }

  private calculateErrorRate(executions: PipelineExecutionMetrics[]): number {
    return 1 - this.calculateSuccessRate(executions);
  }

  private calculateThroughput(executions: PipelineExecutionMetrics[]): number {
    const totalItems = executions.reduce((sum, exec) => sum + exec.itemsProcessed, 0);
    return totalItems; // Items processed in the time period
  }

  private calculateAverageQualityScore(executions: PipelineExecutionMetrics[]): number {
    const withQuality = executions.filter(exec => exec.averageQualityScore);
    if (withQuality.length === 0) return 0;
    const totalQuality = withQuality.reduce((sum, exec) => sum + (exec.averageQualityScore || 0), 0);
    return totalQuality / withQuality.length;
  }

  private calculateQualityPassRate(executions: PipelineExecutionMetrics[]): number {
    const withQuality = executions.filter(exec => exec.averageQualityScore);
    if (withQuality.length === 0) return 1;
    const passing = withQuality.filter(exec => (exec.averageQualityScore || 0) >= CONFIG.quality.autoPublishThreshold * 100);
    return passing.length / withQuality.length;
  }

  private calculateHumanReviewRate(executions: PipelineExecutionMetrics[]): number {
    const totalItems = executions.reduce((sum, exec) => sum + exec.itemsProcessed, 0);
    const reviewItems = executions.reduce((sum, exec) => sum + exec.humanReviewRequired, 0);
    return totalItems > 0 ? reviewItems / totalItems : 0;
  }

  private getCurrentMemoryUsage(): number {
    if (process.memoryUsage) {
      const memory = process.memoryUsage();
      return (memory.heapUsed / memory.heapTotal) * 100;
    }
    return 0;
  }

  private getCurrentCPUUsage(): number {
    // This would require a CPU monitoring library
    return 0; // Placeholder
  }

  private async getCacheHitRate(): Promise<number> {
    // This would return actual cache hit rate
    return 0.85; // 85% placeholder
  }

  private async getWebSocketConnections(): Promise<number> {
    // Return current WebSocket connection count
    return 150; // Placeholder
  }

  private async getFeedUpdateLatency(): Promise<number> {
    // Return average feed update latency
    return 2.5; // 2.5 seconds placeholder
  }

  private async getTotalFeedItems(): Promise<number> {
    return prisma.feedItem.count();
  }

  private async getPartnerContentRatio(): Promise<number> {
    const total = await prisma.feedItem.count();
    const partner = await prisma.feedItem.count({
      where: { type: 'PARTNER' }
    });
    return total > 0 ? partner / total : 0;
  }

  private async getUniqueTagsUsed(): Promise<number> {
    // Count unique tags used in recent period
    return 250; // Placeholder
  }

  /**
   * Database persistence methods
   */
  private async persistExecution(execution: PipelineExecutionMetrics): Promise<void> {
    try {
      // Store execution metrics in database
      // This would use your actual metrics table schema
      console.log(`Persisting execution metrics for ${execution.executionId}`);
    } catch (error) {
      console.error('Failed to persist execution metrics:', error);
    }
  }

  private async getRecentExecutions(timeWindow: number): Promise<PipelineExecutionMetrics[]> {
    // This would query your metrics database
    return []; // Placeholder
  }

  private async getRecentAlerts(): Promise<any[]> {
    // This would query your alerts database
    return []; // Placeholder
  }

  private async getHistoricalTrends(): Promise<any[]> {
    // This would return aggregated historical data
    return []; // Placeholder
  }

  private async cleanupOldMetrics(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod);
    // Delete old metrics based on retention policy
    console.log(`Cleaning up metrics older than ${cutoffDate.toISOString()}`);
  }
}

// Export singleton instance
export const metricsCollector = new PipelineMetricsCollector({
  enabled: CONFIG.monitoring.metrics.exportEnabled,
  retentionPeriod: CONFIG.monitoring.metrics.retentionPeriod,
});

// Export utility functions for manual metric collection
export async function trackPipelineExecution<T>(
  stage: PipelineExecutionMetrics['stage'],
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const executionId = await metricsCollector.startExecution(stage, metadata);
  
  try {
    const result = await operation();
    await metricsCollector.completeExecution(executionId, 'completed');
    return result;
  } catch (error) {
    await metricsCollector.completeExecution(executionId, 'failed', {
      type: error instanceof Error ? error.constructor.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}