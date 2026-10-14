import { z } from 'zod';

export const USER_ROLES = {
  WORKER: 'worker',
  VERIFIER: 'verifier',
  ADVOCATE: 'advocate',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const UserRoleSchema = z.enum(['worker', 'verifier', 'advocate', 'admin']);

export const VERIFICATION_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  DISCREPANCY: 'discrepancy',
  UNVERIFIABLE: 'unverifiable',
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[keyof typeof VERIFICATION_STATUSES];

export const VerificationStatusSchema = z.enum([
  'pending',
  'verified',
  'discrepancy',
  'unverifiable',
]);

export const GRIEVANCE_STATUSES = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  CLUSTERED: 'clustered',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;

export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[keyof typeof GRIEVANCE_STATUSES];

export const GrievanceStatusSchema = z.enum([
  'submitted',
  'under_review',
  'clustered',
  'escalated',
  'resolved',
  'rejected',
]);

export const GRIEVANCE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type GrievancePriority = (typeof GRIEVANCE_PRIORITIES)[keyof typeof GRIEVANCE_PRIORITIES];

export const GrievancePrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const PLATFORMS = {
  UBER: 'uber',
  DOORDASH: 'doordash',
  GRUBHUB: 'grubhub',
  LYFT: 'lyft',
  INSTACART: 'instacart',
  DELIVEROO: 'deliveroo',
  OTHER: 'other',
} as const;

export type PlatformType = (typeof PLATFORMS)[keyof typeof PLATFORMS];

export const PlatformSchema = z.enum([
  'uber',
  'doordash',
  'grubhub',
  'lyft',
  'instacart',
  'deliveroo',
  'other',
]);

// Standard API Error Format
export const ApiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});
export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorDetailSchema).optional(),
    timestamp: z.string().datetime(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// Standard Health Response
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.string(),
  version: z.string(),
  timestamp: z.string().datetime(),
  uptime: z.number().optional(),
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// Pagination Query & Metadata
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

// Service Registry Information
export interface ServiceDefinition {
  name: string;
  runtime: 'python' | 'node';
  defaultPort: number;
  healthPath: string;
  description: string;
}

export const FAIRGIG_SERVICES: ServiceDefinition[] = [
  {
    name: 'auth',
    runtime: 'python',
    defaultPort: 8001,
    healthPath: '/health',
    description: 'FastAPI auth service: JWT issue, refresh token rotation, password hashing, RBAC',
  },
  {
    name: 'earnings',
    runtime: 'python',
    defaultPort: 8002,
    healthPath: '/health',
    description: 'FastAPI earnings service: shifts, CSV bulk imports, OCR screenshot metadata & verification queue',
  },
  {
    name: 'anomaly',
    runtime: 'python',
    defaultPort: 8003,
    healthPath: '/health',
    description: 'FastAPI anomaly engine: deterministic statistical deduction outliers & sudden income-drop detection',
  },
  {
    name: 'grievance',
    runtime: 'node',
    defaultPort: 4001,
    healthPath: '/health',
    description: 'Node.js/TS grievance service: dispute submissions, auto-tagging, clustering & advocate escalation',
  },
  {
    name: 'analytics',
    runtime: 'python',
    defaultPort: 8004,
    healthPath: '/health',
    description: 'FastAPI analytics: worker earnings insights, advocate intelligence with k-anonymity privacy safeguards',
  },
  {
    name: 'certificate',
    runtime: 'node',
    defaultPort: 4002,
    healthPath: '/health',
    description: 'Node.js/TS certificate service: cryptographically hashed, verifiable income certificates & PDF data',
  },
];
