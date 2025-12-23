

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

/* TypeScript Interface*/
interface AuthContextType {
  user: User | null;              
  loading: boolean;             
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  forgotPass: (email: string, newpassword: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
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
 * @param children - All app components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
   * @param email - User's email
   * @param newPassword - New password
   * @param confirmPassword - Password confirmation
   */
  const forgotPass = async (email: string, newPassword: string, confirmPassword: string) => {
    // Frontend validation (backend should also validate)
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await api.post('/api/auth/forgot-password', { 
      email, 
      newPassword 
    });
    

    return response.data;
  };

  /**
   * REGISTER FUNCTION
   * LEARNING: After registration, DON'T auto-login - user must verify email first
   * 
   * @param username - Desired username
   * @param email - User's email
   * @param password - User's password
   * @returns Response data with requiresVerification flag
   */
  const register = async (username: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', { 
      username, 
      email, 
      password 
    });
    
    // DON'T save token or initialize socket yet - email needs to be verified
    // Registration page will redirect to CheckEmail page
    return response.data;
  };

  /**
   * LOGOUT FUNCTION
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



