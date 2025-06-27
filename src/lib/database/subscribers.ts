/**
 * Email Subscriber Data Access Layer
 * Database operations for email subscriber management
 */

import { prisma } from "@/lib/prisma";
import type { EmailSubscriber, EmailFrequency, Prisma } from "@prisma/client";
import { createHash } from "crypto";

/**
 * Hash email for privacy
 */
function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

/**
 * Create new subscriber
 */
export async function createSubscriber(data: {
  email: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  frequency?: EmailFrequency;
  preferredTime?: string;
  timezone?: string;
}): Promise<EmailSubscriber> {
  return await prisma.emailSubscriber.create({
    data: {
      email: data.email.toLowerCase(),
      source: data.source,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      frequency: data.frequency || "DAILY",
      preferredTime: data.preferredTime || "08:00",
      timezone: data.timezone || "Europe/London",
    },
  });
}

/**
 * Get subscriber by email
 */
export async function getSubscriberByEmail(
  email: string,
): Promise<EmailSubscriber | null> {
  return await prisma.emailSubscriber.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Update subscriber preferences
 */
export async function updateSubscriberPreferences(
  email: string,
  preferences: {
    frequency?: EmailFrequency;
    preferredTime?: string;
    timezone?: string;
  },
): Promise<EmailSubscriber> {
  return await prisma.emailSubscriber.update({
    where: { email: email.toLowerCase() },
    data: preferences,
  });
}

/**
 * Verify subscriber email
 */
export async function verifySubscriber(email: string): Promise<void> {
  await prisma.emailSubscriber.update({
    where: { email: email.toLowerCase() },
    data: { isVerified: true },
  });
}

/**
 * Unsubscribe user
 */
export async function unsubscribeUser(email: string): Promise<void> {
  await prisma.emailSubscriber.update({
    where: { email: email.toLowerCase() },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });
}

/**
 * Resubscribe user
 */
export async function resubscribeUser(email: string): Promise<EmailSubscriber> {
  return await prisma.emailSubscriber.update({
    where: { email: email.toLowerCase() },
    data: {
      isActive: true,
      unsubscribedAt: null,
    },
  });
}

/**
 * Get active subscribers for mailing
 */
export async function getActiveSubscribersForMailing(options?: {
  frequency?: EmailFrequency;
  hour?: number;
  timezone?: string;
  limit?: number;
  offset?: number;
}): Promise<EmailSubscriber[]> {
  const { frequency, hour, timezone, limit, offset } = options || {};

  const where: Prisma.EmailSubscriberWhereInput = {
    isActive: true,
    isVerified: true,
    ...(frequency && { frequency }),
    ...(timezone && { timezone }),
  };

  // If hour is specified, filter by preferred time
  if (hour !== undefined) {
    const hourStr = hour.toString().padStart(2, "0");
    where.preferredTime = {
      startsWith: hourStr,
    };
  }

  return await prisma.emailSubscriber.findMany({
    where,
    ...(limit && { take: limit }),
    ...(offset && { skip: offset }),
    orderBy: { subscribedAt: "asc" },
  });
}

/**
 * Track email sent
 */
export async function trackEmailSent(
  subscriberId: string,
  briefingId: string,
): Promise<void> {
  await prisma.$transaction([
    // Update subscriber stats
    prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: {
        lastEmailSent: new Date(),
        totalEmailsSent: { increment: 1 },
      },
    }),

    // Create briefing email record
    prisma.briefingEmail.create({
      data: {
        briefingId,
        subscriberId,
      },
    }),
  ]);
}

/**
 * Track email opened
 */
export async function trackEmailOpened(
  subscriberId: string,
  briefingId: string,
): Promise<void> {
  await prisma.$transaction([
    // Update subscriber stats
    prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: {
        lastOpenedAt: new Date(),
        totalOpens: { increment: 1 },
      },
    }),

    // Update briefing email record
    prisma.briefingEmail.updateMany({
      where: {
        subscriberId,
        briefingId,
        openedAt: null,
      },
      data: {
        openedAt: new Date(),
      },
    }),
  ]);
}

/**
 * Track email click
 */
export async function trackEmailClick(
  subscriberId: string,
  briefingId: string,
): Promise<void> {
  await prisma.$transaction([
    // Update subscriber stats
    prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: {
        totalClicks: { increment: 1 },
      },
    }),

    // Update briefing email record
    prisma.briefingEmail.updateMany({
      where: {
        subscriberId,
        briefingId,
      },
      data: {
        clickedAt: new Date(),
        clickCount: { increment: 1 },
      },
    }),
  ]);
}

/**
 * Get subscriber statistics
 */
export async function getSubscriberStats(): Promise<{
  total: number;
  active: number;
  verified: number;
  unsubscribed: number;
  byFrequency: Record<EmailFrequency, number>;
  recentActivity: {
    newToday: number;
    newThisWeek: number;
    unsubscribedThisWeek: number;
  };
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    active,
    verified,
    unsubscribed,
    byFrequency,
    newToday,
    newThisWeek,
    unsubscribedThisWeek,
  ] = await Promise.all([
    prisma.emailSubscriber.count(),
    prisma.emailSubscriber.count({ where: { isActive: true } }),
    prisma.emailSubscriber.count({ where: { isVerified: true } }),
    prisma.emailSubscriber.count({ where: { isActive: false } }),
    prisma.emailSubscriber.groupBy({
      by: ["frequency"],
      where: { isActive: true },
      _count: true,
    }),
    prisma.emailSubscriber.count({
      where: { subscribedAt: { gte: todayStart } },
    }),
    prisma.emailSubscriber.count({
      where: { subscribedAt: { gte: weekAgo } },
    }),
    prisma.emailSubscriber.count({
      where: { unsubscribedAt: { gte: weekAgo } },
    }),
  ]);

  const frequencyMap = Object.fromEntries(
    byFrequency.map((f) => [f.frequency, f._count]),
  ) as Record<EmailFrequency, number>;

  // Ensure all frequencies are represented
  const allFrequencies: EmailFrequency[] = [
    "DAILY",
    "WEEKLY",
    "BREAKING_ONLY",
    "DISABLED",
  ];
  allFrequencies.forEach((freq) => {
    if (!frequencyMap[freq]) {
      frequencyMap[freq] = 0;
    }
  });

  return {
    total,
    active,
    verified,
    unsubscribed,
    byFrequency: frequencyMap,
    recentActivity: {
      newToday,
      newThisWeek,
      unsubscribedThisWeek,
    },
  };
}

/**
 * Clean up unverified old subscribers
 */
export async function cleanupUnverifiedSubscribers(
  daysOld = 7,
): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const result = await prisma.emailSubscriber.deleteMany({
    where: {
      isVerified: false,
      subscribedAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Get subscribers by engagement level
 */
export async function getSubscribersByEngagement(
  level: "high" | "medium" | "low" | "inactive",
): Promise<EmailSubscriber[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let where: Prisma.EmailSubscriberWhereInput = {
    isActive: true,
    isVerified: true,
  };

  switch (level) {
    case "high":
      where.AND = [
        { lastOpenedAt: { gte: thirtyDaysAgo } },
        { totalOpens: { gte: 10 } },
        { totalClicks: { gte: 5 } },
      ];
      break;

    case "medium":
      where.AND = [
        { lastOpenedAt: { gte: thirtyDaysAgo } },
        { totalOpens: { gte: 3 } },
      ];
      break;

    case "low":
      where.OR = [
        { lastOpenedAt: { lt: thirtyDaysAgo } },
        { totalOpens: { lt: 3 } },
      ];
      break;

    case "inactive":
      where.OR = [{ lastOpenedAt: null }, { totalOpens: 0 }];
      break;
  }

  return await prisma.emailSubscriber.findMany({
    where,
    orderBy: { lastOpenedAt: "desc" },
  });
}
