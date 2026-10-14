import { z } from 'zod';
import { UserRoleSchema, USER_ROLES } from './common';

// Public registration enforces worker role only (no verifier/advocate self-assignment)
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().optional(),
  cityId: z.string().uuid().optional(),
  primaryPlatform: z.string().optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: UserRoleSchema,
  phoneNumber: z.string().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
  primaryPlatform: z.string().nullable().optional(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer').default('Bearer'),
  expiresInSeconds: z.number().int().positive(),
  user: UserProfileSchema,
});
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
