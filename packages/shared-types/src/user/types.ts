/**
 * User-related types and enums
 */

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

/**
 * User entity interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User with relations
 */
export interface UserWithRelations extends User {
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedAssets?: Array<{
    id: string;
    assetTag: string;
    status: string;
  }>;
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  departmentId?: string;
  phone?: string;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  departmentId?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

/**
 * User filter params
 */
export interface UserFilterParams {
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Login credentials
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * Refresh token request
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
