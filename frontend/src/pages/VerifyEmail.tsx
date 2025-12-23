/**
 * EMAIL VERIFICATION PAGE
 * Users land here after clicking the verification link in their email
 * LEARNING: After successful verification, auto-login and redirect to chat
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { initSocket } from '../services/socket';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Verify the email (backend now returns token + user on success)
        const verifyResponse = await api.post('/api/auth/verify-email', { token });
        
        if (verifyResponse.data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(verifyResponse.data.message);
        } else {
          setStatus('success');
          setMessage(verifyResponse.data.message);

          // Step 2: Auto-login - Save token and user to localStorage
          const { token: authToken, user } = verifyResponse.data;
          
          localStorage.setItem('chatwave-token', authToken);
          localStorage.setItem('chatwave-user', JSON.stringify(user));

          // Step 3: Initialize Socket.io connection
          initSocket(authToken);

          // Step 4: Redirect to chat after 2 seconds
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
        }
        
        setLoading(false);

      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-surface rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Logo */}
            <h1 className="text-4xl font-bold text-white mb-2">
              🌊 ChatWave
            </h1>

            {/* Status Icon */}
            <div className="my-8">
              {loading && status === 'verifying' && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
                </div>
              )}

              {status === 'success' && (
                <div className="text-6xl">✅</div>
              )}

              {status === 'already-verified' && (
                <div className="text-6xl">✓</div>
              )}

              {status === 'error' && (
                <div className="text-6xl">❌</div>
              )}
            </div>

            {/* Status Message */}
            <h2 className={`text-2xl font-bold mb-4 ${
              status === 'error' ? 'text-red-400' : 'text-green-400'
            }`}>
              {loading ? 'Verifying your email...' : 
               status === 'success' ? 'Email Verified!' :
               status === 'already-verified' ? 'Already Verified!' :
               'Verification Failed'}
            </h2>

            <p className="text-gray-400 mb-6">
              {message}
            </p>

            {/* Actions */}
            {status === 'error' && (
              <div className="space-y-3">
                <Link
                  to="/resend-verification"
                  className="block w-full py-3 px-4 bg-primary-500 text-white font-semibold rounded-lg 
                           hover:bg-primary-600 transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  to="/login"
                  className="block text-primary-400 hover:text-primary-300"
                >
                  Back to Login
                </Link>
              </div>
            )}

            {(status === 'success' || status === 'already-verified') && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  {status === 'success' 
                    ? 'Logging you in and redirecting to chat...' 
                    : 'Redirecting to login in 3 seconds...'}
                </p>
                {status === 'success' ? (
                  <div className="inline-block py-3 px-6 bg-primary-500 text-white font-semibold rounded-lg">
                    Redirecting to Log In page
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="inline-block py-3 px-6 bg-primary-500 text-white font-semibold rounded-lg 
                             hover:bg-primary-600 transition-colors"
                  >
                    Go to Login Now
                  </Link>
                )}
              </div>
            )}
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
