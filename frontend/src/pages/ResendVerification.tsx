/**
 * RESEND VERIFICATION PAGE
 * Users can request a new verification email
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {api} from '../services/api';

export const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    setSuccess(false);

    try {
      const response = await api.post('/auth/resend-verification', { email });
      setMessage(response.data.message);
      setSuccess(true);
      setEmail(''); // Clear the input
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-surface rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🌊 ChatWave
            </h1>
            <p className="text-gray-400">Resend Verification Email</p>
          </div>

          {/* Success message */}
          {success && message && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg p-3 mb-4">
              {message}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
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
              <p className="text-xs text-gray-500 mt-2">
                We'll send a new verification link to this email address.
              </p>
            </div>

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
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Already verified?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Log In
              </Link>
            </p>
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact support@chatwave.com
        </p>
      </div>
    </div>
  );
};
