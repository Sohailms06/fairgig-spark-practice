import { z } from 'zod';
import { VerificationStatusSchema } from './common';

export const VERIFICATION_DECISIONS = {
  APPROVE: 'approve',
  FLAG_DISCREPANCY: 'flag_discrepancy',
  MARK_UNVERIFIABLE: 'mark_unverifiable',
} as const;

export type VerificationDecisionType =
  (typeof VERIFICATION_DECISIONS)[keyof typeof VERIFICATION_DECISIONS];

export const VerificationDecisionTypeSchema = z.enum([
  'approve',
  'flag_discrepancy',
  'mark_unverifiable',
]);

export const SubmitVerificationReviewSchema = z.object({
  earningId: z.string().uuid(),
  decision: VerificationDecisionTypeSchema,
  notes: z.string().min(5, 'Review notes must contain at least 5 characters'),
  discrepancyReason: z
    .enum([
      'amount_mismatch',
      'date_mismatch',
      'platform_mismatch',
      'tampered_screenshot',
      'illegible_proof',
      'duplicate_submission',
      'other',
    ])
    .optional(),
  verifiedGrossAmount: z.number().nonnegative().optional(),
  verifiedNetAmount: z.number().nonnegative().optional(),
  verifiedHoursWorked: z.number().positive().optional(),
});
export type SubmitVerificationReview = z.infer<typeof SubmitVerificationReviewSchema>;

export const VerificationReviewResponseSchema = z.object({
  id: z.string().uuid(),
  earningId: z.string().uuid(),
  verifierId: z.string().uuid(),
  previousStatus: VerificationStatusSchema,
  newStatus: VerificationStatusSchema,
  decision: VerificationDecisionTypeSchema,
  notes: z.string(),
  discrepancyReason: z.string().nullable().optional(),
  verifiedGrossAmount: z.number().nullable().optional(),
  verifiedNetAmount: z.number().nullable().optional(),
  verifiedHoursWorked: z.number().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type VerificationReviewResponse = z.infer<typeof VerificationReviewResponseSchema>;

export const VerificationQueueItemSchema = z.object({
  earningId: z.string().uuid(),
  workerId: z.string().uuid(),
  platform: z.string(),
  shiftDate: z.string(),
  hoursWorked: z.number(),
  grossAmount: z.number(),
  netAmount: z.number(),
  evidenceCount: z.number().int(),
  submittedAt: z.string().datetime(),
  status: VerificationStatusSchema,
  flaggedByAnomaly: z.boolean(),
});
export type VerificationQueueItem = z.infer<typeof VerificationQueueItemSchema>;
