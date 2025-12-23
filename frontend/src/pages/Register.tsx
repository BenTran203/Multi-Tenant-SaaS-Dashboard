/**
 * 📝 REGISTER PAGE - New User Sign Up
 * 
 * LEARNING: Similar to Login but with more fields
 * - Form validation with multiple fields
 * - Password confirmation matching
 * - User registration flow
 */

import { useState, FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Check, X } from 'lucide-react';

/**
 * REGISTER COMPONENT
 */
export function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  // Register requires more fields than login
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Field-specific errors for better UX
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * LEARNING: Real-time Password Strength Validation
   * Matches backend requirements exactly
   */
  const passwordRequirements = useMemo(() => {
    const password = formData.password;
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  }, [formData.password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(Boolean);
  }, [passwordRequirements]);

  /**
   * LEARNING: Client-Side Validation
   * 
   * @returns true if valid, false if errors
   */
  const validateForm = (): boolean => {
    const errors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Username validation
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    // Email validation (basic)
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation - Match backend requirements
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isPasswordValid) {
      errors.password = 'Please meet all password requirements';
    }

    // Password confirmation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== '');
  };

  /**
   * FORM SUBMIT HANDLER
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await registerUser(
        formData.username,
        formData.email,
        formData.password
      );
      
      // Success! Redirect to check-email page with email in state
      navigate('/check-email', { state: { email: formData.email } });
      
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * INPUT CHANGE HANDLER
   * 
   * LEARNING: Clear field error when user starts typing
   * - Better UX: error disappears as they fix it
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field-specific error
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
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

      {/* Register card */}
      <Card className="w-full max-w-md animate-pop-in relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-oak-100 dark:bg-oak-900/30 rounded-2xl mb-4 animate-bounce-gentle">
            <Leaf className="text-oak-600 dark:text-oak-400" size={32} />
          </div>
          <h1 className="text-2xl font-pixel text-gradient-nature mb-2">
            Join ChatWave
          </h1>
          <p className="text-nature-bark dark:text-nature-stone font-sans">
            Create your account 🌳
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* General error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-wiggle">
              <p className="text-red-600 dark:text-red-400 text-sm font-sans">{error}</p>
            </div>
          )}

          {/* LEARNING: Input with Field-Specific Error */}
          {/* Each input shows its own validation error */}
          <Input
            label="Username"
            type="text"
            name="username"
            placeholder="nature_lover"
            value={formData.username}
            onChange={handleChange}
            error={fieldErrors.username}
            disabled={loading}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="leaf@nature.com"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            disabled={loading}
            required
          />

          {/* Password Strength Indicator */}
          {formData.password && (
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
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            disabled={loading}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? '🌱 Creating account...' : '🌿 Sign Up'}
          </Button>

          <p className="text-center text-sm text-nature-bark dark:text-nature-stone font-sans">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-grass-600 dark:text-grass-400 hover:underline font-semibold"
            >
              Log in here
            </Link>
          </p>
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

/**
 * KEY DIFFERENCES FROM LOGIN:
 * 
 * 1. More Form Fields - username, email, password, confirmPassword
 * 2. Client-Side Validation - validateForm() function
 * 3. Field-Specific Errors - Each input gets its own error message
 * 4. Password Matching - Ensures confirmPassword matches password
 * 5. Real-time Error Clearing - Errors disappear as user types
 * 6. Real-time Password Strength - Live validation matching backend requirements
 */

