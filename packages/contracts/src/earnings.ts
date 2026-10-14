import { z } from 'zod';
import { PlatformSchema, VerificationStatusSchema, PaginationMetaSchema } from './common';

export const CreateEarningRecordSchema = z.object({
  platform: PlatformSchema,
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  hoursWorked: z.number().positive().max(24),
  grossAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  deductions: z.number().nonnegative().default(0),
  tipsAmount: z.number().nonnegative().default(0),
  bonusAmount: z.number().nonnegative().default(0),
  tripsCount: z.number().int().nonnegative().default(0),
  zoneId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});
export type CreateEarningRecord = z.infer<typeof CreateEarningRecordSchema>;

export const EarningRecordResponseSchema = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid(),
  platform: PlatformSchema,
  shiftDate: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  hoursWorked: z.number(),
  grossAmount: z.number(),
  netAmount: z.number(),
  deductions: z.number(),
  tipsAmount: z.number(),
  bonusAmount: z.number(),
  tripsCount: z.number(),
  hourlyRate: z.number(),
  zoneId: z.string().uuid().nullable().optional(),
  verificationStatus: VerificationStatusSchema,
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EarningRecordResponse = z.infer<typeof EarningRecordResponseSchema>;

// CSV Import Request & Response
export const CsvImportRowSchema = z.object({
  platform: PlatformSchema,
  shiftDate: z.string(),
  hoursWorked: z.number().positive(),
  grossAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  deductions: z.number().nonnegative().optional().default(0),
  tipsAmount: z.number().nonnegative().optional().default(0),
  bonusAmount: z.number().nonnegative().optional().default(0),
  tripsCount: z.number().int().nonnegative().optional().default(0),
});
export type CsvImportRow = z.infer<typeof CsvImportRowSchema>;

export const CsvImportRequestSchema = z.object({
  csvContent: z.string().min(1, 'CSV content cannot be empty'),
  hasHeader: z.boolean().default(true),
  platformFallback: PlatformSchema.optional(),
});
export type CsvImportRequest = z.infer<typeof CsvImportRequestSchema>;

export const CsvImportResponseSchema = z.object({
  totalRows: z.number().int().nonnegative(),
  importedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  records: z.array(EarningRecordResponseSchema),
  errors: z.array(
    z.object({
      row: z.number().int(),
      message: z.string(),
      rawLine: z.string().optional(),
    })
  ),
});
export type CsvImportResponse = z.infer<typeof CsvImportResponseSchema>;

// Screenshot Evidence Upload Contract
export const PresignedUploadRequestSchema = z.object({
  earningId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024, 'Max size 10MB'),
});
export type PresignedUploadRequest = z.infer<typeof PresignedUploadRequestSchema>;

export const PresignedUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storagePath: z.string(),
  evidenceId: z.string().uuid(),
  expiresInSeconds: z.number().int(),
});
export type PresignedUploadResponse = z.infer<typeof PresignedUploadResponseSchema>;

export const ConfirmEvidenceRequestSchema = z.object({
  evidenceId: z.string().uuid(),
  earningId: z.string().uuid(),
  storagePath: z.string(),
  extractedData: z
    .object({
      detectedPlatform: PlatformSchema.optional(),
      detectedAmount: z.number().optional(),
      detectedDate: z.string().optional(),
      ocrConfidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
});
export type ConfirmEvidenceRequest = z.infer<typeof ConfirmEvidenceRequestSchema>;

export const EvidenceResponseSchema = z.object({
  id: z.string().uuid(),
  earningId: z.string().uuid(),
  workerId: z.string().uuid(),
  storagePath: z.string(),
  contentType: z.string(),
  ocrConfidence: z.number().nullable().optional(),
  extractedData: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string().datetime(),
});
export type EvidenceResponse = z.infer<typeof EvidenceResponseSchema>;

// Earnings List Query & Paginated Response
export const EarningsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  platform: PlatformSchema.optional(),
  verificationStatus: VerificationStatusSchema.optional(),
});
export type EarningsListQuery = z.infer<typeof EarningsListQuerySchema>;

export const EarningsListResponseSchema = z.object({
  items: z.array(EarningRecordResponseSchema),
  meta: PaginationMetaSchema,
});
export type EarningsListResponse = z.infer<typeof EarningsListResponseSchema>;
