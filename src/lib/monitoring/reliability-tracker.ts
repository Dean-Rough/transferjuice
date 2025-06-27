/**
 * Source Reliability Tracking System
 * Tracks historical accuracy and performance of ITK sources per region
 */

export interface SourceReliabilityMetrics {
  sourceId: string;
  region: string;
  totalTweets: number;
  transferRelatedTweets: number;
  confirmedTransfers: number; // Transfers that actually happened
  falsePositives: number; // Transfers predicted but didn't happen
  accuracyRate: number; // confirmed / (confirmed + falsePositives)
  responseTime: number; // Average minutes to break news
  lastUpdated: Date;
  trend: "improving" | "declining" | "stable";
}

export interface RegionalPerformance {
  region: string;
  totalSources: number;
  averageAccuracy: number;
  topPerformers: string[];
  coverageQuality: number; // How well the region is covered
  timezone: string;
  peakActivityHours: number[]; // Hours when most transfer news breaks
}

export class ReliabilityTracker {
  private metrics: Map<string, SourceReliabilityMetrics> = new Map();
  private regionalPerformance: Map<string, RegionalPerformance> = new Map();

  /**
   * Initialize tracking for all configured sources
   */
  async initializeTracking(sources: any[]): Promise<void> {
    for (const source of sources) {
      const sourceId =
        source.id ||
        source.username ||
        (source.handle ? source.handle.replace("@", "") : "unknown");

      if (!this.metrics.has(sourceId)) {
        this.metrics.set(sourceId, {
          sourceId,
          region: source.region || "UNKNOWN",
          totalTweets: 0,
          transferRelatedTweets: 0,
          confirmedTransfers: 0,
          falsePositives: 0,
          accuracyRate: source.reliability || source.reliabilityScore || 0.5,
          responseTime: 0,
          lastUpdated: new Date(),
          trend: "stable",
        });
      }
    }

    // Initialize regional performance tracking
    this.initializeRegionalTracking();
  }

  /**
   * Update source metrics after processing a tweet
   */
  updateSourceMetrics(
    sourceId: string,
    wasTransferRelated: boolean,
    confidence: number,
    timestamp: Date,
  ): void {
    const metrics = this.metrics.get(sourceId);
    if (!metrics) return;

    metrics.totalTweets++;
    metrics.lastUpdated = timestamp;

    if (wasTransferRelated) {
      metrics.transferRelatedTweets++;

      // Update accuracy rate based on confidence and historical performance
      const confidenceWeight = confidence * 0.1;
      metrics.accuracyRate = metrics.accuracyRate * 0.9 + confidenceWeight;
    }

    this.metrics.set(sourceId, metrics);
    this.updateRegionalPerformance(metrics.region);
  }

  /**
   * Record when a predicted transfer is confirmed or fails
   */
  recordTransferOutcome(
    sourceId: string,
    wasConfirmed: boolean,
    predictionTimestamp: Date,
    outcomeTimestamp: Date,
  ): void {
    const metrics = this.metrics.get(sourceId);
    if (!metrics) return;

    if (wasConfirmed) {
      metrics.confirmedTransfers++;

      // Update response time
      const responseMinutes =
        Math.abs(outcomeTimestamp.getTime() - predictionTimestamp.getTime()) /
        (1000 * 60);
      metrics.responseTime = (metrics.responseTime + responseMinutes) / 2;
    } else {
      metrics.falsePositives++;
    }

    // Recalculate accuracy rate
    const totalPredictions =
      metrics.confirmedTransfers + metrics.falsePositives;
    if (totalPredictions > 0) {
      metrics.accuracyRate = metrics.confirmedTransfers / totalPredictions;
    }

    // Update trend
    metrics.trend = this.calculateTrend(sourceId);

    this.metrics.set(sourceId, metrics);
    this.updateRegionalPerformance(metrics.region);
  }

  /**
   * Get reliability score for a source with recent performance weighting
   */
  getReliabilityScore(sourceId: string): number {
    const metrics = this.metrics.get(sourceId);
    if (!metrics) return 0.5; // Default reliability

    // Weight recent performance more heavily
    const daysSinceUpdate =
      (Date.now() - metrics.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0.5, 1 - daysSinceUpdate / 30); // Decay over 30 days

    return Math.min(0.99, metrics.accuracyRate * recencyFactor);
  }

  /**
   * Get performance metrics for a specific region
   */
  getRegionalPerformance(region: string): RegionalPerformance | null {
    return this.regionalPerformance.get(region) || null;
  }

  /**
   * Get timezone-aware monitoring recommendations
   */
  getMonitoringRecommendations(): {
    peakHours: Record<string, number[]>;
    prioritySources: string[];
    regionCoverage: Record<string, number>;
  } {
    const peakHours: Record<string, number[]> = {};
    const regionCoverage: Record<string, number> = {};

    this.regionalPerformance.forEach((performance, region) => {
      peakHours[region] = performance.peakActivityHours;
      regionCoverage[region] = performance.coverageQuality;
    });

    // Get top performing sources across all regions
    const prioritySources = Array.from(this.metrics.values())
      .filter((m) => m.accuracyRate > 0.8)
      .sort((a, b) => b.accuracyRate - a.accuracyRate)
      .slice(0, 10)
      .map((m) => m.sourceId);

    return {
      peakHours,
      prioritySources,
      regionCoverage,
    };
  }

  /**
   * Export reliability data for analysis
   */
  exportReliabilityData(): {
    sources: SourceReliabilityMetrics[];
    regions: RegionalPerformance[];
    summary: {
      totalSources: number;
      averageAccuracy: number;
      bestRegion: string;
      topSource: string;
    };
  } {
    const sources = Array.from(this.metrics.values());
    const regions = Array.from(this.regionalPerformance.values());

    const averageAccuracy =
      sources.reduce((sum, s) => sum + s.accuracyRate, 0) / sources.length;
    const bestRegion =
      regions.sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0]
        ?.region || "N/A";
    const topSource =
      sources.sort((a, b) => b.accuracyRate - a.accuracyRate)[0]?.sourceId ||
      "N/A";

    return {
      sources,
      regions,
      summary: {
        totalSources: sources.length,
        averageAccuracy,
        bestRegion,
        topSource,
      },
    };
  }

  /**
   * Initialize regional performance tracking
   */
  private initializeRegionalTracking(): void {
    const regions = ["UK", "ES", "IT", "FR", "DE", "BR", "GLOBAL"];

    regions.forEach((region) => {
      if (!this.regionalPerformance.has(region)) {
        this.regionalPerformance.set(region, {
          region,
          totalSources: 0,
          averageAccuracy: 0.5,
          topPerformers: [],
          coverageQuality: 0.5,
          timezone: this.getRegionTimezone(region),
          peakActivityHours: this.getRegionPeakHours(region),
        });
      }
    });
  }

  /**
   * Update regional performance metrics
   */
  private updateRegionalPerformance(region: string): void {
    const regionalSources = Array.from(this.metrics.values()).filter(
      (m) => m.region === region,
    );

    if (regionalSources.length === 0) return;

    const averageAccuracy =
      regionalSources.reduce((sum, s) => sum + s.accuracyRate, 0) /
      regionalSources.length;
    const topPerformers = regionalSources
      .sort((a, b) => b.accuracyRate - a.accuracyRate)
      .slice(0, 3)
      .map((s) => s.sourceId);

    const performance = this.regionalPerformance.get(region);
    if (performance) {
      performance.totalSources = regionalSources.length;
      performance.averageAccuracy = averageAccuracy;
      performance.topPerformers = topPerformers;
      performance.coverageQuality = Math.min(1.0, regionalSources.length / 5); // Target 5 sources per region

      this.regionalPerformance.set(region, performance);
    }
  }

  /**
   * Calculate trend for a source based on recent performance
   */
  private calculateTrend(
    sourceId: string,
  ): "improving" | "declining" | "stable" {
    const metrics = this.metrics.get(sourceId);
    if (!metrics) return "stable";

    // Simple trend calculation - would be enhanced with time-series analysis
    const recentAccuracy = metrics.accuracyRate;
    const baselineAccuracy = 0.7; // Could be historical average

    if (recentAccuracy > baselineAccuracy + 0.1) return "improving";
    if (recentAccuracy < baselineAccuracy - 0.1) return "declining";
    return "stable";
  }

  /**
   * Get timezone for a region
   */
  private getRegionTimezone(region: string): string {
    const timezones: Record<string, string> = {
      UK: "Europe/London",
      ES: "Europe/Madrid",
      IT: "Europe/Rome",
      FR: "Europe/Paris",
      DE: "Europe/Berlin",
      BR: "America/Sao_Paulo",
      GLOBAL: "UTC",
    };

    return timezones[region] || "UTC";
  }

  /**
   * Get peak activity hours for a region (in local time)
   */
  private getRegionPeakHours(region: string): number[] {
    // Based on typical football news patterns
    const peakHours: Record<string, number[]> = {
      UK: [9, 10, 11, 15, 16, 17, 20, 21], // Business hours + evening
      ES: [10, 11, 12, 16, 17, 18, 21, 22], // Later Spanish schedule
      IT: [9, 10, 11, 15, 16, 17, 20, 21], // Similar to UK
      FR: [9, 10, 11, 15, 16, 17, 20, 21], // Similar to UK
      DE: [8, 9, 10, 14, 15, 16, 19, 20], // Earlier German schedule
      BR: [8, 9, 10, 14, 15, 16, 19, 20], // Brazilian business hours
      GLOBAL: [10, 11, 12, 15, 16, 17, 20, 21], // Average across regions
    };

    return peakHours[region] || peakHours["GLOBAL"];
  }
}

// Export singleton instance
export const reliabilityTracker = new ReliabilityTracker();
