import { z } from 'zod';
import { PlatformSchema } from './common';

export const CertificatePurposeSchema = z.enum([
  'housing_rental',
  'loan_application',
  'government_support',
  'visa_immigration',
  'personal_record',
]);
export type CertificatePurpose = z.infer<typeof CertificatePurposeSchema>;

export const GenerateCertificateRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purpose: CertificatePurposeSchema,
  recipientName: z.string().max(100).optional(),
  includePlatforms: z.array(PlatformSchema).optional(),
});
export type GenerateCertificateRequest = z.infer<typeof GenerateCertificateRequestSchema>;

export const IncomeCertificateSchema = z.object({
  id: z.string().uuid(),
  certificateNumber: z.string(), // e.g. FG-2026-X89B
  workerId: z.string().uuid(),
  workerName: z.string(),
  purpose: CertificatePurposeSchema,
  recipientName: z.string().nullable().optional(),
  periodStartDate: z.string(),
  periodEndDate: z.string(),
  totalGrossIncome: z.number().nonnegative(),
  totalNetIncome: z.number().nonnegative(),
  totalDeductions: z.number().nonnegative(),
  totalHoursWorked: z.number().nonnegative(),
  averageMonthlyIncome: z.number().nonnegative(),
  verifiedShiftsCount: z.number().int().nonnegative(),
  unverifiedShiftsCount: z.number().int().nonnegative(),
  verificationPercentage: z.number().min(0).max(100),
  cryptographicSignature: z.string(), // SHA-256 signature hash of certificate payload
  publicVerificationUrl: z.string().url(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type IncomeCertificate = z.infer<typeof IncomeCertificateSchema>;

export const PublicVerifyCertificateResponseSchema = z.object({
  isValid: z.boolean(),
  certificate: IncomeCertificateSchema.nullable(),
  message: z.string(),
  verifiedAt: z.string().datetime(),
});
export type PublicVerifyCertificateResponse = z.infer<
  typeof PublicVerifyCertificateResponseSchema
>;
