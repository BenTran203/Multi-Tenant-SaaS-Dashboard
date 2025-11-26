/**
 * 🔐 LOGIN PAGE - User Authentication
 * 
 * LEARNING: Form Handling in React
 * - useState for form data management
 * - Event handlers for user input
 * - API calls with axios
 * - Error handling and loading states
 * - Navigation with React Router
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { Sprout } from 'lucide-react';

/**
 * LOGIN COMPONENT
 * 
 * Allows users to sign in to their account
 */
export function Login() {
  // LEARNING: React Router navigation hook
  // - Programmatically navigate to different pages
  // - Used after successful login to redirect to chat
  const navigate = useNavigate();
  
  // LEARNING: Context hook for authentication
  // - login: Function from AuthContext that makes API call
  const { login } = useAuth();

  // LEARNING: Form State Management
  // - Store form data in component state
  // - Update as user types
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // LEARNING: UI State Management
  // - loading: Show spinner during API call
  // - error: Display error messages to user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * LEARNING: Form Submit Handler
   * 
   * Runs when user submits the form
   * - Prevents default form submission (page reload)
   * - Validates input
   * - Makes API call
   * - Handles success/error
   * 
   * @param e - Form submit event
   */
  const handleSubmit = async (e: FormEvent) => {
    // Prevent page reload (default form behavior)
    e.preventDefault();
    
    // Clear any previous errors
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Set loading state (show spinner, disable button)
    setLoading(true);

    try {
      // LEARNING: API Call with Context
      // - login() is from AuthContext
      // - Makes POST request to backend
      // - Stores JWT token if successful
      await login(formData.email, formData.password);
      
      // Success! Navigate to chat page
      navigate('/chat');
      
    } catch (err: any) {
      // LEARNING: Error Handling
      // - Display error message from backend
      // - Falls back to generic message
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      // LEARNING: finally block
      // - Always runs (success or error)
      // - Stop loading spinner
      setLoading(false);
    }
  };

  /**
   * LEARNING: Input Change Handler
   * 
   * Updates form state as user types
   * - Uses computed property name [e.target.name]
   * - Preserves other form fields with spread ...formData
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,  // Keep existing fields
      [e.target.name]: e.target.value  // Update changed field
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-grass-200 dark:bg-grass-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-oak-200 dark:bg-oak-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Theme toggle in top right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Login card */}
      <Card className="w-full max-w-md animate-pop-in relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-grass-100 dark:bg-grass-900/30 rounded-2xl mb-4 animate-bounce-gentle">
            <Sprout className="text-grass-600 dark:text-grass-400" size={32} />
          </div>
          <h1 className="text-2xl font-pixel text-gradient-nature mb-2">
            ChatWave
          </h1>
          <p className="text-nature-bark dark:text-nature-stone font-sans">
            Welcome back! 🌿
          </p>
        </div>

        {/* LEARNING: Form Element */}
        {/* onSubmit triggers handleSubmit when user presses Enter or clicks button */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* LEARNING: Error Display */}
          {/* Conditionally render error message if it exists */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-wiggle">
              <p className="text-red-600 dark:text-red-400 text-sm font-sans">{error}</p>
            </div>
          )}

          {/* Email input */}
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="leaf@nature.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {/* Password input */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {/* LEARNING: Conditional rendering based on loading state */}
            {loading ? '🌱 Logging in...' : '🌿 Log In'}
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-nature-bark dark:text-nature-stone font-sans">
            Don't have an account?{' '}
            {/* LEARNING: React Router Link component */}
            {/* Like <a> but without page reload (SPA navigation) */}
            <Link 
              to="/register" 
              className="text-grass-600 dark:text-grass-400 hover:underline font-semibold"
            >
              Sign up here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

/**
 * KEY CONCEPTS DEMONSTRATED:
 * 
 * 1. Form State Management - useState for form data
 * 2. Event Handling - onChange, onSubmit
 * 3. API Integration - Async/await, try/catch
 * 4. Loading States - Disable inputs during submission
 * 5. Error Handling - Display user-friendly messages
 * 6. Navigation - Redirect after successful login
 * 7. Validation - Check required fields
 * 8. Context Usage - useAuth hook
 */

