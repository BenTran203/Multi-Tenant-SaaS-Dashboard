import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Sprout, ArrowLeft, Mail } from 'lucide-react';
import { api } from '../services/api';



//Call Forgot-password api, asking user to submit Email to recieve reset URL token.
export function ForgotPass() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-grass-100 dark:bg-grass-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-grass-600 dark:text-grass-400" />
          </div>
          
          <h2 className="text-2xl font-pixel text-grass-800 dark:text-grass-100 mb-2">
            Check Your Email
          </h2>
          
          <p className="text-nature-600 dark:text-nature-300 mb-6">
            We've sent a password reset link to <strong>{email}</strong>.
          </p>

          <div className="bg-nature-100 dark:bg-nature-800 p-4 rounded-lg text-sm text-nature-600 dark:text-nature-400 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </div>

          <Link to="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-grass-100 dark:bg-grass-900/50 rounded-xl">
            <Sprout className="w-8 h-8 text-grass-600 dark:text-grass-400" />
          </div>
          <h1 className="text-3xl font-pixel text-grass-800 dark:text-grass-100">
            ChatWave
          </h1>
        </div>
        <p className="text-nature-600 dark:text-nature-400">
          Reset your password
        </p>
      </div>

      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-nature-500 dark:text-nature-400">
              We'll send you a link to reset your password.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-nature-600 dark:text-nature-400 hover:text-grass-600 dark:hover:text-grass-400 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

