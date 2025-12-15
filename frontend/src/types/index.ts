/**
 * 🌿 TYPESCRIPT TYPE DEFINITIONS
 * 
 * LEARNING: TypeScript helps catch errors at compile-time
 * Instead of: const user = { id: 1, name: "John" } (JavaScript)
 * We use: const user: User = { id: 1, username: "John" } (TypeScript)
 * 
 * BENEFITS:
 * - Auto-completion in your editor (IntelliSense)
 * - Catch type errors before runtime
 * - Better documentation (types are self-documenting)
 * - Easier refactoring (find all usages)
 * 
 * WHY?: Backend uses numeric IDs (PostgreSQL auto-increment)
 * So our frontend types match the backend response structure.
 */

/// <reference types="vite/client" />

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;               // UUID from database (not numeric!)
  email: string;
  username: string;
  password?: string;        // Optional, never sent from backend
  avatarUrl?: string;       // Optional avatar URL
  bio?: string;             // Optional user bio
  createdAt: string;        // ISO date string
  joinedAt?: string;        // Optional - when user joined a server (ServerMember.joinedAt)
}

export interface AuthResponse {
  token: string;            // JWT token for authentication
  user: User;               // User data
  message: string;          // Success message
}

// ============================================
// SERVER TYPES
// ============================================

export interface Server {
  id: string;               // UUID from database
  name: string;
  icon?: string;            // Emoji or URL
  theme?: string;           // Theme color scheme (nature, ocean, sunset)
  serverCode: string;       // 8-character alphanumeric code for joining (replaces inviteCode)
  codeGeneratedAt?: string; // ISO date string - when the code was last generated
  ownerId: string;          // UUID reference to User
  createdAt: string;
  server?: { name: string }; // Sometimes backend includes this
}

// ============================================
// CHANNEL TYPES
// ============================================

export interface Channel {
  id: string;               // UUID from database
  name: string;
  type: string;             // 'text' or 'voice'
  serverId: string;         // UUID reference to Server
  createdAt: string;
  server?: Server;          // Optional, included in some responses
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string;               // UUID from database
  content: string;
  userId: string;           // UUID reference to User
  channelId: string;        // UUID reference to Channel
  createdAt: string;
  user?: User;              // Included with message responses
}

// ============================================
// FORM DATA TYPES
// ============================================

/**
 * LEARNING: Form data types
 * Used for form state management and validation
 */

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiError {
  message: string;
  error?: string;
  details?: string;
}

export interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  //More vite api here for type safety
}
export interface ImportMeta {
  readonly env: ImportMetaEnv
}
