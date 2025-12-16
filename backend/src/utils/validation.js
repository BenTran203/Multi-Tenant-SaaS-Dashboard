

import { body, param, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // LEARNING: Format errors nicely
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ============================================
// VALIDATION RULES
// ============================================

export const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

];

/**
 * User login validation
 */
export const loginValidation = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * User New password validation
 */
export const forgotPassword = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),

  body("newPassword").notEmpty().withMessage("Password is required"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password must match the new password"),
];
/**
 * Server creation validation
 */
export const createServerValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Server name must be between 1 and 50 characters"),

  body("icon").optional().isString().withMessage("Icon must be a string"),
];

/**
 * Channel creation validation
 */
export const createChannelValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Channel name must be between 1 and 30 characters")
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Channel name can only contain lowercase letters, numbers, and hyphens"
    ),

  body("type")
    .optional()
    .isIn(["TEXT", "VOICE"])
    .withMessage("Channel type must be TEXT or VOICE"),
];

/**
 * Message creation validation
 */
export const createMessageValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
];

/**
 * Server join validation (server code)
 */
export const joinServerValidation = [
  body("serverCode")
    .trim()
    .notEmpty()
    .withMessage("Server code is required")
    .isLength({ min: 8, max: 8 })
    .withMessage("Server code must be exactly 8 characters")
    .matches(/^[A-Z0-9]{8}$/i)
    .withMessage("Server code must contain only letters and numbers"),
];

/**
 * UUID parameter validation
 */
export const validateUUID = (paramName) => [
  param(paramName).isUUID().withMessage(`Invalid ${paramName} format`),
];

//Update profile route
export const profileUpdateValidation = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Your bio can only have max 300 characters"),

  body("avatarUrl")
    .optional()
    .isURL()
    .withMessage("Avatar URL must be a valid URL"),
];
