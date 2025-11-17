/**
 * TypeScript Type Definitions
 * 
 * LEARNING: TypeScript helps catch errors at compile-time
 * Instead of: const user = { id: 1, name: "John" } (JavaScript)
 * We use: const user: User = { id: "uuid", username: "John" } (TypeScript)
 * 
 * BENEFITS:
 * - Auto-completion in your editor
 * - Catch type errors before runtime
 * - Better documentation
 * - Easier refactoring
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// ============================================
// SERVER TYPES
// ============================================

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerWithDetails extends Server {
  owner: User;
  channels: Channel[];
  members: ServerMember[];
}

export interface ServerMember {
  id: string;
  role: 'ADMIN' | 'MEMBER';
  userId: string;
  serverId: string;
  joinedAt: string;
  user?: User; // Optional, included when fetching members
}

// ============================================
// CHANNEL TYPES
// ============================================

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  serverId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  user: User;
}

export interface MessageResponse {
  messages: Message[];
  hasMore: boolean;
}

// ============================================
// SOCKET EVENT TYPES
// ============================================

/**
 * LEARNING: Socket.io events are typed too!
 * This helps ensure we send/receive the correct data
 */

// Events the client SENDS to the server
export interface ClientToServerEvents {
  'join-channel': (data: { channelId: string }) => void;
  'leave-channel': (data: { channelId: string }) => void;
  'send-message': (data: { channelId: string; content: string }) => void;
  'typing-start': (data: { channelId: string }) => void;
  'typing-stop': (data: { channelId: string }) => void;
}

// Events the client RECEIVES from the server
export interface ServerToClientEvents {
  'new-message': (data: { message: Message }) => void;
  'user-joined': (data: { user: User; channelId: string }) => void;
  'user-typing': (data: { user: User; channelId: string }) => void;
  'user-stopped-typing': (data: { userId: string; channelId: string }) => void;
  'error': (data: { message: string }) => void;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiError {
  error: string;
  details?: string;
}

/**
 * LEARNING: Generic wrapper for API responses
 * Makes it easy to handle loading/error states
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

