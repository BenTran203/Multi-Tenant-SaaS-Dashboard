/**
 * 🔐 AUTHENTICATION CONTEXT - User State Management
 * 
 * LEARNING: React Context provides a way to share data across components
 * without passing props down manually at every level ("prop drilling")
 * 
 * WHY USE CONTEXT?
 * - User info needed in many components (Navbar, Chat, Profile, etc.)
 * - Auth state needs to be consistent across the app
 * - Centralized authentication logic
 * - One place to handle login/logout
 * 
 * PATTERN:
 * 1. Create Context → 2. Create Provider → 3. Create Hook → 4. Use in components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

/**
 * LEARNING: TypeScript Interface
 * 
 * Defines what data and functions the context provides
 */
interface AuthContextType {
  user: User | null;              // Current logged-in user (null if not logged in)
  loading: boolean;               // True while checking if user is logged in
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  forgotPass: (email: string, newpassword: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;  // NEW: Update user in context
}

/**
 * LEARNING: Create Context
 * 
 * Creates a "container" for our auth data
 * - undefined as default (will be provided by AuthProvider)
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * CUSTOM HOOK: useAuth()
 * 
 * LEARNING: Custom hooks simplify using context
 * Instead of useContext(AuthContext), just call useAuth()
 * 
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * AUTH PROVIDER COMPONENT
 * 
 * LEARNING: This wraps your entire app and provides auth state to all children
 * 
 * @param children - All app components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * LEARNING: useEffect with empty dependency array []
   * 
   * Runs once when component mounts
   * - Check if user is already logged in (token in localStorage)
   * - Restore user session
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('chatwave-token');
      const storedUser = localStorage.getItem('chatwave-user');

      if (storedToken && storedUser) {
        try {
          // Parse stored user
          setUser(JSON.parse(storedUser));
          
          // Initialize Socket.io connection
          initSocket(storedToken);
          
          // Optional: Verify token is still valid
          try {
            const response = await api.get('/api/auth/me');
            setUser(response.data.user);
            localStorage.setItem('chatwave-user', JSON.stringify(response.data.user));
          } catch (verifyError) {
            // Token invalid, will be caught below
            throw verifyError;
          }
        } catch (error) {
          // Token is invalid, clear storage
          console.error('Token validation failed:', error);
          localStorage.removeItem('chatwave-token');
          localStorage.removeItem('chatwave-user');
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * LOGIN FUNCTION
   * 
   * LEARNING: Async function that returns a Promise
   * - Makes POST request to /api/auth/login
   * - Saves token and user to localStorage
   * - Updates state to trigger re-render
   * - Initializes Socket.io
   * 
   * @param email - User's email
   * @param password - User's password
   */
  const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    
    // Save to localStorage (persists between sessions)
    localStorage.setItem('chatwave-token', response.data.token);
    localStorage.setItem('chatwave-user', JSON.stringify(response.data.user));
    
    // Update state (triggers re-render)
    setUser(response.data.user);
    
    // Initialize real-time connection
    initSocket(response.data.token);
  };

  /**
   * FORGOT PASSWORD FUNCTION
   * 
   * LEARNING: Password reset functionality
   * - Makes POST request to /api/auth/forgot-password
   * - Does NOT automatically log in the user
   * - User must login again with new password
   * 
   * @param email - User's email
   * @param newPassword - New password
   * @param confirmPassword - Password confirmation
   */
  const forgotPass = async (email: string, newPassword: string, confirmPassword: string) => {
    // Frontend validation (backend should also validate)
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // TODO: Implement actual password reset endpoint
    // For now, this will throw an error since the endpoint doesn't exist yet
    const response = await api.post('/api/auth/forgot-password', { 
      email, 
      newPassword 
    });
    
    // Note: We do NOT save token or user here
    // User must log in again with their new password
    return response.data;
  };

  /**
   * REGISTER FUNCTION
   * 
   * Similar to login but creates new user account
   * 
   * @param username - Desired username
   * @param email - User's email
   * @param password - User's password
   */
  const register = async (username: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', { 
      username, 
      email, 
      password 
    });
    
    localStorage.setItem('chatwave-token', response.data.token);
    localStorage.setItem('chatwave-user', JSON.stringify(response.data.user));
    
    setUser(response.data.user);
    
    initSocket(response.data.token);
  };

  /**
   * LOGOUT FUNCTION
   * 
   * LEARNING: Cleanup on logout
   * - Clear localStorage
   * - Clear state
   * - Disconnect Socket.io
   * - Redirect happens automatically (via response interceptor)
   */
  const logout = () => {
    localStorage.removeItem('chatwave-token');
    localStorage.removeItem('chatwave-user');
    setUser(null);
    disconnectSocket();
    
    // Redirect to login
    window.location.href = '/login';
  };

  /**
   * UPDATE USER FUNCTION
   * 
   * Updates user data in context and localStorage
   * Used when profile is updated
   * 
   * @param updatedUser - Updated user object
   */
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('chatwave-user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPass, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * LEARNING: How to use this context in components:
 * 
 * import { useAuth } from './contexts/AuthContext';
 * 
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *   
 *   if (!user) {
 *     return <div>Not logged in</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       Welcome, {user.username}!
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */

