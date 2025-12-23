import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Check, X } from 'lucide-react';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Real-time Password Strength Validation
   * Matches backend requirements exactly
   */
  const passwordRequirements = useMemo(() => {
    const password = newPassword;
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  }, [newPassword]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(Boolean);
  }, [passwordRequirements]);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-pixel text-grass-600 mb-2">
            Password Reset Successful!
          </h2>
          <p>Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-pixel text-gradient-nature mb-6">
          Create New Password
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading || !token}
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="p-4 bg-nature-50 dark:bg-nature-900/20 border-2 border-nature-200 dark:border-nature-800 rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-nature-bark dark:text-nature-stone mb-2">
                Password Requirements:
              </p>
              <PasswordRequirement 
                met={passwordRequirements.minLength}
                text="At least 8 characters"
              />
              <PasswordRequirement 
                met={passwordRequirements.hasUppercase}
                text="One uppercase letter (A-Z)"
              />
              <PasswordRequirement 
                met={passwordRequirements.hasLowercase}
                text="One lowercase letter (a-z)"
              />
              <PasswordRequirement 
                met={passwordRequirements.hasNumber}
                text="One number (0-9)"
              />
              <PasswordRequirement 
                met={passwordRequirements.hasSpecial}
                text="One special character (!@#$%^&*)"
              />
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || !token}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading || !token}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

/**
 * PASSWORD REQUIREMENT COMPONENT
 * Shows checkmark or X based on whether requirement is met
 */
interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check size={16} className="text-grass-600 dark:text-grass-400 flex-shrink-0" />
      ) : (
        <X size={16} className="text-nature-400 dark:text-nature-600 flex-shrink-0" />
      )}
      <span className={`text-sm ${
        met 
          ? 'text-grass-600 dark:text-grass-400 font-semibold' 
          : 'text-nature-500 dark:text-nature-500'
      }`}>
        {text}
      </span>
    </div>
  );
}