import { z } from 'zod';

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
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Asset Form Schema
export const assetSchema = z.object({
  name: z
    .string()
    .min(1, 'Asset name is required')
    .min(2, 'Asset name must be at least 2 characters')
    .max(100, 'Asset name must be less than 100 characters'),
  serialNumber: z
    .string()
    .max(50, 'Serial number must be less than 50 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  categoryId: z
    .string()
    .min(1, 'Category is required'),
  locationId: z
    .string()
    .min(1, 'Location is required'),
  purchaseDate: z
    .string()
    .optional(),
  purchasePrice: z
    .number()
    .min(0, 'Price must be a positive number')
    .optional()
    .nullable(),
  warrantyUntil: z
    .string()
    .optional(),
});

export type AssetFormData = z.infer<typeof assetSchema>;

// User Profile Schema
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional(),
  phone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
