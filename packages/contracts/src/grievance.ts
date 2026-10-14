import { z } from 'zod';
import {
  GrievanceStatusSchema,
  GrievancePrioritySchema,
  PlatformSchema,
  PaginationMetaSchema,
} from './common';

export const GRIEVANCE_CATEGORIES = {
  UNEXPLAINED_DEDUCTION: 'unexplained_deduction',
  TIP_WITHHOLDING: 'tip_withholding',
  ACCOUNT_DEACTIVATION: 'account_deactivation',
  ALGORITHMIC_PENALTY: 'algorithmic_penalty',
  FARE_UNDERPAYMENT: 'fare_underpayment',
  SAFETY_INCIDENT: 'safety_incident',
  OTHER: 'other',
} as const;

export type GrievanceCategory =
  (typeof GRIEVANCE_CATEGORIES)[keyof typeof GRIEVANCE_CATEGORIES];

export const GrievanceCategorySchema = z.enum([
  'unexplained_deduction',
  'tip_withholding',
  'account_deactivation',
  'algorithmic_penalty',
  'fare_underpayment',
  'safety_incident',
  'other',
]);

// Grievance Submission
export const CreateGrievanceRequestSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(2000),
  category: GrievanceCategorySchema,
  platform: PlatformSchema,
  priority: GrievancePrioritySchema.default('medium'),
  associatedEarningIds: z.array(z.string().uuid()).optional().default([]),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
  claimedLossAmount: z.number().nonnegative().optional(),
});
export type CreateGrievanceRequest = z.infer<typeof CreateGrievanceRequestSchema>;

export const GrievanceResponseSchema = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: GrievanceCategorySchema,
  platform: PlatformSchema,
  priority: GrievancePrioritySchema,
  status: GrievanceStatusSchema,
  claimedLossAmount: z.number().nullable().optional(),
  clusterId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()),
  associatedEarningIds: z.array(z.string().uuid()),
  evidenceUrls: z.array(z.string()),
  escalatedAt: z.string().datetime().nullable().optional(),
  escalatedToAdvocateId: z.string().uuid().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type GrievanceResponse = z.infer<typeof GrievanceResponseSchema>;

// Clustering Schemas
export const GrievanceClusterSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: GrievanceCategorySchema,
  platform: PlatformSchema,
  affectedWorkerCount: z.number().int().positive(),
  totalClaimedLoss: z.number().nonnegative(),
  grievanceIds: z.array(z.string().uuid()),
  commonTags: z.array(z.string()),
  severity: GrievancePrioritySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type GrievanceCluster = z.infer<typeof GrievanceClusterSchema>;

// Escalation Request
export const EscalateGrievanceRequestSchema = z.object({
  grievanceId: z.string().uuid(),
  escalationReason: z.string().min(10).max(500),
  advocateNotes: z.string().optional(),
  targetRepresentative: z.string().optional(),
});
export type EscalateGrievanceRequest = z.infer<typeof EscalateGrievanceRequestSchema>;

export const GrievanceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: GrievanceStatusSchema.optional(),
  platform: PlatformSchema.optional(),
  category: GrievanceCategorySchema.optional(),
  clusterId: z.string().uuid().optional(),
});
export type GrievanceListQuery = z.infer<typeof GrievanceListQuerySchema>;

export const GrievanceListResponseSchema = z.object({
  items: z.array(GrievanceResponseSchema),
  meta: PaginationMetaSchema,
});
export type GrievanceListResponse = z.infer<typeof GrievanceListResponseSchema>;
