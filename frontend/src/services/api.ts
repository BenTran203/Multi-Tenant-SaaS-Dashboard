/**
 * 🌐 API SERVICE - HTTP Client Configuration
 * 
 * LEARNING: This file handles all HTTP requests to the backend
 * Using Axios for HTTP client (similar to fetch but with more features)
 * 
 * WHY A SEPARATE SERVICE?
 * - Single source of truth for API calls
 * - Automatic token attachment to requests
 * - Centralized error handling
 * - Easy to mock for testing
 * - Base URL configuration in one place
 */

import axios from 'axios';

// LEARNING: Environment Variables
// - VITE_API_URL comes from .env file
// - Falls back to localhost:5000 for development
// - In production, set VITE_API_URL=https://your-api.com
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * LEARNING: Axios Instance
 * 
 * Create a configured axios instance instead of using axios directly
 * - Sets base URL for all requests
 * - Adds default headers
 * - Allows adding interceptors
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * LEARNING: Request Interceptor
 * 
 * Interceptors run before/after every request
 * - request interceptor: Runs BEFORE sending request
 * - response interceptor: Runs AFTER receiving response
 * 
 * WHY?: Automatically add JWT token to all requests
 * - Token stored in localStorage after login
 * - Interceptor reads token and adds to Authorization header
 * - Backend checks this header to authenticate user
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatwave-token');
    if (token) {
      // LEARNING: Authorization header format: "Bearer <token>"
      // "Bearer" is the auth scheme, token is the actual JWT
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * LEARNING: Response Interceptor
 * 
 * Handles common HTTP errors globally
 * - 401 Unauthorized: Token expired or invalid
 * - 403 Forbidden: No permission
 * - 500 Server Error: Backend issues
 */
api.interceptors.response.use(
  (response) => response,  // Success - pass through
  (error) => {
    // LEARNING: Handle 401 Unauthorized
    // If token is invalid/expired, log user out
    if (error.response?.status === 401) {
      localStorage.removeItem('chatwave-token');
      localStorage.removeItem('chatwave-user');
      
      // Only redirect if not already on login/register
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * HOW TO USE IN COMPONENTS:
 * 
 * EXAMPLE 1: GET request
 * ```typescript
 * import { api } from '../services/api';
 * 
 * const fetchServers = async () => {
 *   try {
 *     const response = await api.get('/api/servers');
 *     console.log(response.data);
 *   } catch (error) {
 *     console.error('Error:', error);
 *   }
 * };
 * ```
 * 
 * EXAMPLE 2: POST request
 * ```typescript
 * const createServer = async (name: string) => {
 *   try {
 *     const response = await api.post('/api/servers', { name });
 *     return response.data;
 *   } catch (error) {
 *     throw error;
 *   }
 * };
 * ```
 * 
 * EXAMPLE 3: With authentication
 * ```typescript
 * const login = async (email: string, password: string) => {
 *   const response = await api.post('/api/auth/login', { email, password });
 *   
 *   // Save token for future requests
 *   localStorage.setItem('chatwave-token', response.data.token);
 *   
 *   return response.data.user;
 * };
 * ```
 */

