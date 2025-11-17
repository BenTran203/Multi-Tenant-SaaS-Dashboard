/**
 * AUTHENTICATION CONTEXT
 * 
 * LEARNING: React Context provides a way to share data across components
 * without passing props down manually at every level ("prop drilling")
 * 
 * WHY USE CONTEXT?
 * - User info needed in many components (Navbar, Chat, Profile, etc.)
 * - Auth state needs to be consistent across the app
 * - Centralized authentication logic
 * 
 * LEARNING RESOURCES:
 * - https://react.dev/learn/passing-data-deeply-with-context
 * - https://react.dev/reference/react/useContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

/**
 * LEARNING: Define the shape of our context data
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * LEARNING: Create the context
 * The "undefined!" is a TypeScript trick to avoid null checks everywhere
 * We'll always wrap our app in AuthProvider, so context will always exist
 */
const AuthContext = createContext<AuthContextType>(undefined!);

/**
 * LEARNING: Custom hook to use auth context
 * This is a common pattern - provides better error messages
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * AuthProvider component
 * 
 * LEARNING: This wraps your app and provides auth state to all children
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * LEARNING: useEffect runs after component mounts
   * This checks if user is already logged in (token in localStorage)
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // LEARNING: Initialize Socket.io connection
          initializeSocket(storedToken);
          
          // Optional: Verify token is still valid
          const { user: currentUser } = await authApi.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          // Token is invalid, clear storage
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login function
   * 
   * LEARNING: This is called from the login form
   * It makes an API call, saves the token, and updates state
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // LEARNING: Save to localStorage (persists across browser sessions)
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // LEARNING: Update state (triggers re-render)
      setToken(response.token);
      setUser(response.user);
      
      // LEARNING: Initialize Socket.io connection
      initializeSocket(response.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  /**
   * Register function
   */
  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await authApi.register({ email, username, password });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);
      
      initializeSocket(response.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    // LEARNING: Clear everything
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    // LEARNING: Disconnect Socket.io
    disconnectSocket();
  };

  /**
   * LEARNING: The value object contains all data/functions we want to share
   */
  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout
  };

  /**
   * LEARNING: Provider wraps children and provides the value
   */
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

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

