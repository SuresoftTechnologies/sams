import { z } from 'zod';
import { AssetStatus } from '@sams/shared-types';
import { VALIDATION } from './constants';

/**
 * Validation Schemas using Zod
 *
 * Centralized validation schemas for forms across the app.
 * Used with React Hook Form via @hookform/resolvers/zod
 */

// Login Form Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일은 필수입니다')
    .email('유효하지 않은 이메일 주소입니다'),
  password: z
    .string()
    .min(1, '비밀번호는 필수입니다')
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${VALIDATION.PASSWORD_MIN_LENGTH}자 이상이어야 합니다`),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Asset Form Schema with all 23+ fields
export const assetSchema = z.object({
  // Basic Info
  assetTag: z.string().optional().or(z.literal('')), // Auto-generated, readonly in edit mode
  model: z.string().optional().or(z.literal('')),
  serialNumber: z
    .string()
    .max(VALIDATION.SERIAL_NUMBER_MAX_LENGTH, `시리얼번호는 ${VALIDATION.SERIAL_NUMBER_MAX_LENGTH}자 미만이어야 합니다`)
    .optional()
    .or(z.literal('')),
  categoryId: z.string().min(1, '카테고리는 필수입니다'),
  locationId: z.string().min(1, '위치는 필수입니다'),
  status: z.nativeEnum(AssetStatus).optional(),
  grade: z.string().optional().or(z.literal('')), // Auto-calculated, readonly
  assignedTo: z.string().optional().or(z.literal('')),

  // Purchase Info
  purchaseDate: z.string().optional().or(z.literal('')),
  purchasePrice: z.number().min(0, '가격은 양수여야 합니다').optional().nullable(),
  purchaseRequest: z.string().optional().or(z.literal('')),
  taxInvoiceDate: z.string().optional().or(z.literal('')),
  supplier: z.string().optional().or(z.literal('')),
  warrantyUntil: z.string().optional().or(z.literal('')),

  // Category Details
  furnitureCategory: z.string().optional().or(z.literal('')),
  detailedCategory: z.string().optional().or(z.literal('')),

  // Checkout/Return Info
  checkoutDate: z.string().optional().or(z.literal('')),
  returnDate: z.string().optional().or(z.literal('')),

  // User History
  firstUser: z.string().optional().or(z.literal('')),
  previousUser1: z.string().optional().or(z.literal('')),
  previousUser2: z.string().optional().or(z.literal('')),

  // Other Info
  oldAssetNumber: z.string().optional().or(z.literal('')),
  qrCodeExists: z.string().optional().or(z.literal('')),
  notes: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `비고는 ${VALIDATION.DESCRIPTION_MAX_LENGTH}자 미만이어야 합니다`)
    .optional()
    .or(z.literal('')),
  specialNotes: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `특이사항은 ${VALIDATION.DESCRIPTION_MAX_LENGTH}자 미만이어야 합니다`)
    .optional()
    .or(z.literal('')),
});

export type AssetFormData = z.infer<typeof assetSchema>;

// Asset Update Schema (similar to create but with optional fields)
export const assetUpdateSchema = assetSchema.partial().extend({
  id: z.string().min(1),
});

export type AssetUpdateFormData = z.infer<typeof assetUpdateSchema>;

// Asset Filter Schema
export const assetFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  categoryId: z.string().optional(),
  locationId: z.string().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export type AssetFilterData = z.infer<typeof assetFilterSchema>;

// User Profile Schema
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  department: z
    .string()
    .max(VALIDATION.NAME_MAX_LENGTH, `Department must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[0-9-+() ]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// User Registration Schema
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD_MAX_LENGTH, `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`),
  departmentId: z
    .string()
    .min(1, 'Department is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(1, 'New password is required')
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD_MAX_LENGTH, `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Workflow Request Schema
export const workflowRequestSchema = z.object({
  assetId: z
    .string()
    .min(1, 'Asset is required'),
  requestType: z
    .enum(['assignment', 'return', 'transfer', 'maintenance', 'disposal'])
    .default('assignment'),
  toUserId: z
    .string()
    .optional(),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .min(10, 'Reason must be at least 10 characters')
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `Reason must be less than ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  dueDate: z
    .string()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `Notes must be less than ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .or(z.literal('')),
});

export type WorkflowRequestFormData = z.infer<typeof workflowRequestSchema>;

/**
 * Helper function to transform empty strings to undefined
 * Useful for optional form fields
 */
export const emptyStringToUndefined = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

/**
 * Helper function to transform empty strings to null
 * Useful for nullable form fields
 */
export const emptyStringToNull = z
  .string()
  .nullable()
  .transform((val) => (val === '' ? null : val));

/**
 * Validation helper: Check if date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  return date < new Date();
}

/**
 * Validation helper: Check if date is in the future
 */
export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  return date > new Date();
}
