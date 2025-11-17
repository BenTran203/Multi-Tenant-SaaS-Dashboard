/**
 * API SERVICE
 * 
 * LEARNING: This file handles all HTTP requests to the backend
 * Using Axios for HTTP client (similar to fetch but with more features)
 * 
 * WHY A SEPARATE SERVICE?
 * - Single source of truth for API calls
 * - Automatic token attachment
 * - Centralized error handling
 * - Easy to mock for testing
 */

import axios from 'axios';
import type { 
  User, 
  AuthResponse, 
  Server, 
  ServerWithDetails, 
  Channel, 
  MessageResponse 
} from '../types';

// LEARNING: Base URL for all API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// LEARNING: Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * LEARNING: Request interceptor
 * Automatically adds JWT token to all requests
 * 
 * WHY?
 * - Don't need to manually add token to every request
 * - Token is stored in localStorage
 * - Interceptor adds it to Authorization header
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * LEARNING: Response interceptor
 * Handles common errors (401 Unauthorized, etc.)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // LEARNING: Handle 401 Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION API
// ============================================

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: { 
    email: string; 
    username: string; 
    password: string 
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: { 
    email: string; 
    password: string 
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<{ user: User }>('/api/auth/me');
    return response.data;
  }
};

// ============================================
// SERVER API
// ============================================

export const serverApi = {
  /**
   * Create a new server
   */
  create: async (data: { name: string }): Promise<{ server: Server }> => {
    const response = await apiClient.post<{ server: Server }>('/api/servers', data);
    return response.data;
  },

  /**
   * Get all servers user is a member of
   */
  getAll: async (): Promise<{ servers: Server[] }> => {
    const response = await apiClient.get<{ servers: Server[] }>('/api/servers');
    return response.data;
  },

  /**
   * Get a specific server by ID
   */
  getById: async (id: string): Promise<{ server: ServerWithDetails }> => {
    const response = await apiClient.get<{ server: ServerWithDetails }>(`/api/servers/${id}`);
    return response.data;
  },

  /**
   * Join a server with invite code
   */
  join: async (inviteCode: string): Promise<{ server: Server }> => {
    const response = await apiClient.post<{ server: Server }>('/api/servers/join', { 
      inviteCode 
    });
    return response.data;
  }
};

// ============================================
// CHANNEL API
// ============================================

export const channelApi = {
  /**
   * Create a new channel in a server
   */
  create: async (
    serverId: string, 
    data: { name: string; type?: 'TEXT' | 'VOICE' }
  ): Promise<{ channel: Channel }> => {
    const response = await apiClient.post<{ channel: Channel }>(
      `/api/servers/${serverId}/channels`, 
      data
    );
    return response.data;
  },

  /**
   * Get all channels in a server
   */
  getAll: async (serverId: string): Promise<{ channels: Channel[] }> => {
    const response = await apiClient.get<{ channels: Channel[] }>(
      `/api/servers/${serverId}/channels`
    );
    return response.data;
  }
};

// ============================================
// MESSAGE API
// ============================================

export const messageApi = {
  /**
   * Get messages from a channel
   */
  getMessages: async (
    channelId: string, 
    params?: { limit?: number; before?: string }
  ): Promise<MessageResponse> => {
    const response = await apiClient.get<MessageResponse>(
      `/api/channels/${channelId}/messages`,
      { params }
    );
    return response.data;
  },

  /**
   * Send a message (REST API fallback)
   * Normally use Socket.io for real-time sending
   */
  send: async (
    channelId: string, 
    content: string
  ): Promise<{ message: any }> => {
    const response = await apiClient.post(
      `/api/channels/${channelId}/messages`,
      { content }
    );
    return response.data;
  },

  /**
   * Delete a message
   */
  delete: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/api/messages/${messageId}`);
  }
};

/**
 * LEARNING: How to use these API functions in components:
 * 
 * import { authApi } from './services/api';
 * 
 * const handleLogin = async () => {
 *   try {
 *     const response = await authApi.login({ email, password });
 *     localStorage.setItem('token', response.token);
 *     // Success!
 *   } catch (error) {
 *     // Handle error
 *     console.error(error.response?.data?.error);
 *   }
 * };
 */

