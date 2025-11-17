/**
 * LOGIN COMPONENT
 * 
 * LEARNING: This is a React component using hooks
 * - useState: Manages local state (form inputs, errors)
 * - useNavigate: Navigate to different routes
 * - useAuth: Custom hook for authentication
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  // LEARNING: useState hook for managing form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // LEARNING: Custom hooks
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * LEARNING: Event handler for form submission
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // LEARNING: Prevent default form submission (page reload)
    e.preventDefault();
    
    setError('');
    setLoading(true);

    try {
      // LEARNING: Call login function from AuthContext
      await login(email, password);
      
      // LEARNING: Navigate to home page after successful login
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-dark-surface rounded-lg shadow-xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🌊 ChatWave
            </h1>
            <p className="text-gray-400">Welcome back!</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg 
                         text-white placeholder-gray-500 
                         focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                         transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg 
                         text-white placeholder-gray-500 
                         focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                         transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-secondary-500 to-primary-500 
                       text-white font-semibold rounded-lg 
                       hover:from-secondary-600 hover:to-primary-600 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                       focus:ring-offset-dark-surface
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Register
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          A learning project by you! 🚀
        </p>
      </div>
    </div>
  );
};

/**
 * TODO (LEARNING): Add form validation
 * 
 * CHALLENGE: Add client-side validation before submitting
 * - Email format validation
 * - Password minimum length
 * - Show validation errors below each field
 * 
 * HINT: Create a validateForm() function
 */

