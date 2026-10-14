import { z } from 'zod';
import { PlatformSchema } from './common';

export const ANOMALY_TYPES = {
  DEDUCTION_OUTLIER: 'deduction_outlier',
  SUDDEN_INCOME_DROP: 'sudden_income_drop',
  HOURLY_RATE_DEFICIT: 'hourly_rate_deficit',
  EXCESSIVE_UNPAID_TIME: 'excessive_unpaid_time',
} as const;

export type AnomalyType = (typeof ANOMALY_TYPES)[keyof typeof ANOMALY_TYPES];

export const AnomalyTypeSchema = z.enum([
  'deduction_outlier',
  'sudden_income_drop',
  'hourly_rate_deficit',
  'excessive_unpaid_time',
]);

export const ANOMALY_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export type AnomalySeverity = (typeof ANOMALY_SEVERITY)[keyof typeof ANOMALY_SEVERITY];

export const AnomalySeveritySchema = z.enum(['info', 'warning', 'critical']);

// Shift summary for standalone evaluation
export const ShiftDataPointSchema = z.object({
  id: z.string().optional(),
  shiftDate: z.string(),
  hoursWorked: z.number().positive(),
  grossAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  deductions: z.number().nonnegative().default(0),
  tipsAmount: z.number().nonnegative().default(0),
  tripsCount: z.number().int().nonnegative().default(0),
});
export type ShiftDataPoint = z.infer<typeof ShiftDataPointSchema>;

// Standalone request for deterministic anomaly analysis
export const AnalyzeAnomalyRequestSchema = z.object({
  targetShift: ShiftDataPointSchema,
  historicalShifts: z.array(ShiftDataPointSchema).default([]),
  platform: PlatformSchema.default('uber'),
  cityMinimumHourlyWage: z.number().positive().default(15.0),
  thresholds: z
    .object({
      maxDeductionRatio: z.number().min(0).max(1).default(0.30),
      deductionZScoreThreshold: z.number().positive().default(2.0),
      incomeDropPercentageThreshold: z.number().min(0).max(100).default(40.0),
      minimumBaselineShifts: z.number().int().min(1).default(3),
    })
    .optional(),
});
export type AnalyzeAnomalyRequest = z.infer<typeof AnalyzeAnomalyRequestSchema>;

export const DetectedAnomalySchema = z.object({
  type: AnomalyTypeSchema,
  severity: AnomalySeveritySchema,
  name: z.string(),
  description: z.string(),
  observedValue: z.number(),
  expectedThreshold: z.number(),
  delta: z.number(),
  unit: z.string(),
  explanation: z.string(),
  suggestedAction: z.string(),
});
export type DetectedAnomaly = z.infer<typeof DetectedAnomalySchema>;

export const AnalyzeAnomalyResponseSchema = z.object({
  isAnomaly: z.boolean(),
  anomalyScore: z.number().min(0).max(1), // Normalized 0-1
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  targetHourlyRate: z.number(),
  targetDeductionRatio: z.number(),
  baselineAverageHourlyRate: z.number().nullable(),
  baselineAverageDeductionRatio: z.number().nullable(),
  anomaliesDetected: z.array(DetectedAnomalySchema),
  evaluatedAt: z.string().datetime(),
  deterministicRulesApplied: z.array(z.string()),
});
export type AnalyzeAnomalyResponse = z.infer<typeof AnalyzeAnomalyResponseSchema>;
