/**
 * Pipeline Monitoring Dashboard API
 * Real-time metrics and health status for the Transfer Juice pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/monitoring/pipelineMetrics';
import { CONFIG } from '@/config/pipeline';
import { z } from 'zod';

// Request validation schemas
const DashboardRequestSchema = z.object({
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
  services: z.array(z.enum(['database', 'ai', 'twitter', 'websocket', 'cache'])).optional(),
  includeHistorical: z.boolean().optional().default(true),
});

const AlertsRequestSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  since: z.string().datetime().optional(),
});

/**
 * GET /api/monitoring/dashboard
 * Returns comprehensive dashboard data including metrics, health checks, and trends
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = DashboardRequestSchema.parse({
      timeRange: searchParams.get('timeRange'),
      services: searchParams.get('services')?.split(','),
      includeHistorical: searchParams.get('includeHistorical') === 'true',
    });

    console.log('📊 Dashboard data requested with params:', params);

    // Get comprehensive dashboard data
    const dashboardData = await metricsCollector.getDashboardData();

    // Calculate system status
    const systemStatus = calculateSystemStatus(dashboardData.healthChecks);

    // Prepare response
    const response = {
      timestamp: new Date().toISOString(),
      systemStatus,
      
      // Current metrics
      metrics: {
        pipeline: {
          averageProcessingTime: dashboardData.currentMetrics.averageProcessingTime,
          successRate: (dashboardData.currentMetrics.successRate * 100).toFixed(2) + '%',
          errorRate: (dashboardData.currentMetrics.errorRate * 100).toFixed(2) + '%',
          throughput: dashboardData.currentMetrics.throughput,
        },
        
        quality: {
          averageScore: dashboardData.currentMetrics.averageQualityScore.toFixed(1),
          passRate: (dashboardData.currentMetrics.qualityPassRate * 100).toFixed(2) + '%',
          humanReviewRate: (dashboardData.currentMetrics.humanReviewRate * 100).toFixed(2) + '%',
        },
        
        performance: {
          memoryUsage: dashboardData.currentMetrics.memoryUsage.toFixed(1) + '%',
          cpuUsage: dashboardData.currentMetrics.cpuUsage.toFixed(1) + '%',
          cacheHitRate: (dashboardData.currentMetrics.cacheHitRate * 100).toFixed(2) + '%',
        },
        
        external: {
          databaseResponseTime: dashboardData.currentMetrics.databaseResponseTime + 'ms',
          aiServiceResponseTime: dashboardData.currentMetrics.aiServiceResponseTime + 'ms',
          twitterApiResponseTime: dashboardData.currentMetrics.twitterApiResponseTime + 'ms',
        },
        
        userExperience: {
          websocketConnections: dashboardData.currentMetrics.websocketConnections,
          feedUpdateLatency: dashboardData.currentMetrics.feedUpdateLatency.toFixed(2) + 's',
        },
        
        content: {
          totalFeedItems: dashboardData.currentMetrics.totalFeedItems,
          partnerContentRatio: (dashboardData.currentMetrics.partnerContentRatio * 100).toFixed(1) + '%',
          uniqueTagsUsed: dashboardData.currentMetrics.uniqueTagsUsed,
        },
      },
      
      // Health status for each service
      healthChecks: dashboardData.healthChecks.map(check => ({
        service: check.service,
        status: check.status,
        responseTime: check.responseTime + 'ms',
        lastChecked: check.timestamp.toISOString(),
        details: check.details,
        error: check.error,
      })),
      
      // Active pipeline executions
      activeExecutions: dashboardData.activeExecutions.map(execution => ({
        id: execution.executionId,
        stage: execution.stage,
        status: execution.status,
        startTime: execution.startTime.toISOString(),
        duration: execution.duration ? execution.duration + 'ms' : 'Running...',
        itemsProcessed: execution.itemsProcessed,
        itemsSuccessful: execution.itemsSuccessful,
        itemsFailed: execution.itemsFailed,
      })),
      
      // Recent alerts
      alerts: dashboardData.recentAlerts,
      
      // Configuration status
      configuration: {
        environment: CONFIG.env.NODE_ENV,
        terryVoiceThreshold: CONFIG.quality.thresholds.terryVoice,
        qualityThreshold: CONFIG.quality.autoPublishThreshold,
        processingTimeout: CONFIG.performance.maxProcessingTime + 'ms',
        cacheEnabled: CONFIG.performance.cacheEnabled,
        websocketHeartbeat: CONFIG.performance.websocketHeartbeat + 'ms',
      },
      
      // SLA status
      slaStatus: calculateSLAStatus(dashboardData.currentMetrics),
    };

    // Include historical trends if requested
    if (params.includeHistorical) {
      response.historical = {
        trends: dashboardData.historicalTrends,
        timeRange: params.timeRange,
      };
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/dashboard/health-check
 * Trigger manual health check for all services
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual health check triggered');
    
    // Trigger health checks for all services
    const services = ['database', 'ai', 'twitter', 'websocket', 'cache'] as const;
    const healthChecks = await Promise.allSettled(
      services.map(service => metricsCollector.checkServiceHealth(service))
    );

    const results = healthChecks.map((result, index) => ({
      service: services[index],
      status: result.status === 'fulfilled' ? 'completed' : 'failed',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason?.message : null,
    }));

    const overallStatus = results.every(r => r.status === 'completed' && r.result?.status === 'healthy')
      ? 'healthy'
      : results.some(r => r.result?.status === 'unhealthy' || r.status === 'failed')
      ? 'unhealthy'
      : 'degraded';

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallStatus,
      results,
      message: 'Health check completed',
    });
    
  } catch (error) {
    console.error('❌ Health check API error:', error);
    
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall system status based on health checks
 */
function calculateSystemStatus(healthChecks: any[]): {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  summary: string;
  criticalIssues: number;
} {
  if (healthChecks.length === 0) {
    return {
      overall: 'unhealthy',
      summary: 'No health check data available',
      criticalIssues: 1,
    };
  }

  const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
  const unhealthyCount = healthChecks.filter(check => check.status === 'unhealthy').length;
  const degradedCount = healthChecks.filter(check => check.status === 'degraded').length;

  let overall: 'healthy' | 'degraded' | 'unhealthy';
  let summary: string;

  if (unhealthyCount > 0) {
    overall = 'unhealthy';
    summary = `${unhealthyCount} service(s) unhealthy, ${degradedCount} degraded`;
  } else if (degradedCount > 0) {
    overall = 'degraded';
    summary = `${degradedCount} service(s) degraded, ${healthyCount} healthy`;
  } else {
    overall = 'healthy';
    summary = `All ${healthyCount} services healthy`;
  }

  return {
    overall,
    summary,
    criticalIssues: unhealthyCount,
  };
}

/**
 * Calculate SLA compliance status
 */
function calculateSLAStatus(metrics: any): {
  availability: string;
  performance: string;
  quality: string;
  overall: 'meeting' | 'at_risk' | 'failing';
} {
  // SLA targets
  const SLA_TARGETS = {
    availability: 0.999, // 99.9%
    avgResponseTime: 200, // 200ms
    qualityPassRate: 0.85, // 85%
  };

  const availability = (metrics.successRate * 100).toFixed(2) + '%';
  const performance = metrics.averageProcessingTime < SLA_TARGETS.avgResponseTime ? 'Meeting' : 'At Risk';
  const quality = metrics.qualityPassRate >= SLA_TARGETS.qualityPassRate ? 'Meeting' : 'At Risk';

  // Determine overall SLA status
  let overall: 'meeting' | 'at_risk' | 'failing';
  
  if (metrics.successRate >= SLA_TARGETS.availability && 
      metrics.averageProcessingTime < SLA_TARGETS.avgResponseTime && 
      metrics.qualityPassRate >= SLA_TARGETS.qualityPassRate) {
    overall = 'meeting';
  } else if (metrics.successRate >= 0.995) { // Still above 99.5%
    overall = 'at_risk';
  } else {
    overall = 'failing';
  }

  return {
    availability,
    performance,
    quality,
    overall,
  };
}

/**
 * GET /api/monitoring/dashboard/alerts
 * Get recent alerts with filtering
 */
export async function alertsEndpoint(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = AlertsRequestSchema.parse({
      severity: searchParams.get('severity'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      since: searchParams.get('since'),
    });

    // This would query your alerts database
    // For now, returning mock data
    const alerts = [
      {
        id: 'alert_1',
        severity: 'high',
        message: 'Pipeline processing time exceeded threshold',
        timestamp: new Date().toISOString(),
        service: 'pipeline',
        resolved: false,
      },
      {
        id: 'alert_2',
        severity: 'medium',
        message: 'Quality score below 85% threshold',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        service: 'ai',
        resolved: true,
      },
    ];

    return NextResponse.json({
      alerts: alerts.slice(0, params.limit),
      total: alerts.length,
      params,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}