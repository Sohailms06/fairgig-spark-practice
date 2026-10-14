import { z } from 'zod';
import { PlatformSchema } from './common';

// Worker Personal Analytics
export const WorkerAnalyticsSummarySchema = z.object({
  workerId: z.string().uuid(),
  timeframe: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time']),
  totalGrossEarnings: z.number().nonnegative(),
  totalNetEarnings: z.number().nonnegative(),
  totalDeductions: z.number().nonnegative(),
  totalTips: z.number().nonnegative(),
  totalHoursWorked: z.number().nonnegative(),
  effectiveHourlyRate: z.number().nonnegative(),
  shiftsLoggedCount: z.number().int().nonnegative(),
  verifiedShiftsCount: z.number().int().nonnegative(),
  verificationRate: z.number().min(0).max(1), // 0 to 1
  platformBreakdown: z.array(
    z.object({
      platform: PlatformSchema,
      grossAmount: z.number(),
      netAmount: z.number(),
      hoursWorked: z.number(),
      hourlyRate: z.number(),
      shiftsCount: z.number().int(),
    })
  ),
  dailyEarningsTrend: z.array(
    z.object({
      date: z.string(),
      amount: z.number(),
      hours: z.number(),
    })
  ),
});
export type WorkerAnalyticsSummary = z.infer<typeof WorkerAnalyticsSummarySchema>;

// Advocate Aggregated Analytics with K-Anonymity Safeguards
export const AdvocateCohortMetricSchema = z.object({
  platform: PlatformSchema,
  cityId: z.string().uuid().optional(),
  cityName: z.string().optional(),
  workerSampleCount: z.number().int(),
  isSuppressedForPrivacy: z.boolean(), // True if workerSampleCount < MIN_GROUP_SIZE (5)
  averageHourlyRate: z.number().nullable(),
  averageDeductionPercentage: z.number().nullable(),
  discrepancyRate: z.number().nullable(),
  topDisputeCategories: z.array(z.string()),
  estimatedWageTheftTotal: z.number().nullable(),
});
export type AdvocateCohortMetric = z.infer<typeof AdvocateCohortMetricSchema>;

export const AdvocateAnalyticsOverviewSchema = z.object({
  privacyMinimumThreshold: z.number().int().default(5),
  totalWorkersMonitored: z.number().int(),
  totalShiftsAnalyzed: z.number().int(),
  totalDiscrepanciesIdentified: z.number().int(),
  totalEstimatedLossClaimed: z.number(),
  platformComparison: z.array(AdvocateCohortMetricSchema),
  topGrievanceClusters: z.array(
    z.object({
      clusterId: z.string().uuid(),
      title: z.string(),
      platform: PlatformSchema,
      affectedCount: z.number().int(),
      estimatedLoss: z.number(),
    })
  ),
  generatedAt: z.string().datetime(),
});
export type AdvocateAnalyticsOverview = z.infer<typeof AdvocateAnalyticsOverviewSchema>;
