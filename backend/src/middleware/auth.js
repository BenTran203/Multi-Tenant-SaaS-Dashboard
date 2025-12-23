/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 */

import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';
import { registerValidator, loginValidator } from "./validator.js";
import crypto from "crypto";

export const authenticate = async (req, res, next) => {
  try {
    // 1. Get Header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization token provided' 
      });
    }

    // 2. Check Format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    // 3. Verify Token
    const token = authHeader.substring(7); // Remove "Bearer "
    const decoded = verifyToken(token);

    // 4. Fetch User
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        password: false // Security: Never select password
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User no longer exists' 
      });
    }

    // Check email verification (except for certain routes)
   
    const exemptRoutes = ['/api/auth/verify-email', '/api/auth/resend-verification', '/api/auth/me'];
    const isExempt = exemptRoutes.some(route => req.path.includes(route.split('/api')[1]));
    
    if (!user.isEmailVerified && !isExempt) {
      return res.status(403).json({ 
        error: 'Please verify your email address before accessing this feature',
        errorType: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
    }

    // Attach & Proceed
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: error.message 
    });
  }
};

export const register = async (req, res) => {
  try {
    // Log incoming request data for debugging
    console.log("Registration request body:", JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      firstName,
      lastName,
      role = "CUSTOMER",
    } = req.body;
    const validate = registerValidator.safeParse(req.body);
    
    // Log validation result
    if (!validate.success) {
      console.log("Validation failed:", JSON.stringify(validate.error.errors, null, 2));
    }
    if (!validate.success) {
      // Format validation errors for user-friendly display
      const formattedErrors = validate.error.errors.map((err) => {
        const field = err.path.join(".");
        return `${field}: ${err.message}`;
      });

      return res.status(400).json({
        status: "error",
        message: formattedErrors.join(", "),
        errors: validate.error.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "This email has already exists",
      });
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 15);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        emailRaw: email,
        password: hashedPass,
        firstName,
        lastName,
        role,
        verificationToken,
        verificationExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Timeless - Verify Your Email",
        template: "email-verification",
        data: {
          firstName: user.firstName,
          verificationUrl,
        },
      });
      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;


    const validation = loginValidator.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error
      })
    }

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account has been deactivated. Please contact support.",
      });
    }

    // Verify password
    // Check if user has a password (social auth users don't have passwords)
    // if (!user.password) {
    //   return res.status(401).json({
    //     status: "error",
    //     message: "This account uses social login. Please login with your social provider.",
    //   });
    // }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during login",
    });
  }
};