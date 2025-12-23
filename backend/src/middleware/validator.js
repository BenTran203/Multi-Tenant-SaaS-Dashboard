/**
 * ============================================================================
 * VALIDATION SCHEMAS - ChatWave
 * ============================================================================
 * Using Zod for runtime validation
 */
import * as z from "zod";

/**
 * Register validation - Strong password requirements
 * LEARNING: Password strength is only validated during registration,
 * not during login (users with old passwords shouldn't be blocked)
 */
export const registerValidator = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

/**
 * Login validation - Only check that fields are provided
 * LEARNING: Don't validate password strength at login - just verify credentials exist
 */
export const loginValidator = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Password validation schema - Reusable for password reset
 * Same strong requirements as registration
 */
export const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

/**
 * Reset password validation
 */
export const resetPasswordValidator = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordValidator,
});
