/**
 * CHECK EMAIL PAGE
 * Users see this after registration - prompts them to verify their email
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email';
  
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    setResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      await api.post('/auth/resend-verification', { email });
      setResendSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error: any) {
      setResendError(
        error.response?.data?.error || 
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-grass-200 dark:bg-grass-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-oak-200 dark:bg-oak-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Main card */}
      <Card className="w-full max-w-md animate-pop-in relative z-10">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-grass-100 dark:bg-grass-900/30 rounded-full mb-6 animate-bounce-gentle">
            <Mail className="text-grass-600 dark:text-grass-400" size={40} />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-pixel text-gradient-nature mb-3">
            Check Your Email! 📧
          </h1>

          {/* Description */}
          <p className="text-nature-bark dark:text-nature-stone mb-2 font-sans">
            We've sent a verification link to:
          </p>
          <p className="text-grass-600 dark:text-grass-400 font-semibold mb-6 font-sans break-all">
            {email}
          </p>

          {/* Instructions */}
          <div className="bg-nature-50 dark:bg-nature-900/20 border-2 border-nature-200 dark:border-nature-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-nature-bark dark:text-nature-stone mb-3 font-sans">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-nature-bark dark:text-nature-stone space-y-2 font-sans list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be automatically logged in!</li>
            </ol>
          </div>

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-grass-50 dark:bg-grass-900/20 border-2 border-grass-200 dark:border-grass-800 rounded-2xl flex items-center gap-2 animate-pop-in">
              <CheckCircle size={20} className="text-grass-600 dark:text-grass-400 flex-shrink-0" />
              <p className="text-sm text-grass-600 dark:text-grass-400 font-sans">
                Verification email sent! Check your inbox.
              </p>
            </div>
          )}

          {/* Resend Error Message */}
          {resendError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-wiggle">
              <p className="text-sm text-red-600 dark:text-red-400 font-sans">
                {resendError}
              </p>
            </div>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResendVerification}
            variant="secondary"
            className="w-full mb-4"
            disabled={resending || resendSuccess}
          >
            <RefreshCw 
              size={16} 
              className={resending ? 'animate-spin' : ''} 
            />
            {resending 
              ? 'Sending...' 
              : resendSuccess 
                ? 'Email Sent!' 
                : "Didn't receive it? Resend"}
          </Button>

          {/* Back to login link */}
          <p className="text-center text-sm text-nature-bark dark:text-nature-stone font-sans">
            <Link 
              to="/login" 
              className="text-grass-600 dark:text-grass-400 hover:underline font-semibold"
            >
              ← Back to Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
