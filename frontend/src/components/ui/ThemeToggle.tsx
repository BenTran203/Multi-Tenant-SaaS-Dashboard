/**
 * 🌓 THEME TOGGLE - Switch between Light and Dark Mode
 * 
 * LEARNING: Combining Context with UI Components
 * - Uses useTheme hook to access theme state
 * - Provides visual feedback of current theme
 * - Includes bouncy animation for fun interaction
 */

import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * THEME TOGGLE COMPONENT
 * 
 * Displays a button that shows the current theme and toggles between light/dark
 * 
 * LEARNING: lucide-react
 * - Icon library with React components
 * - Sun icon for light mode, Moon icon for dark mode
 * - Icons are just React components!
 */
export function ThemeToggle() {
  // Access theme context using our custom hook
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        p-3 rounded-2xl
        bg-grass-100 dark:bg-dark-elevated
        text-grass-600 dark:text-grass-400
        hover:bg-grass-200 dark:hover:bg-dark-hover
        transition-all duration-300
        hover-bounce
        shadow-md hover:shadow-lg
        border-2 border-grass-200 dark:border-dark-border
      "
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* LEARNING: Conditional Rendering with Ternary Operator */}
      {/* Show Sun icon in dark mode (to switch to light) */}
      {/* Show Moon icon in light mode (to switch to dark) */}
      {theme === 'light' ? (
        <Moon size={20} className="animate-wiggle" />
      ) : (
        <Sun size={20} className="animate-wiggle" />
      )}
    </button>
  );
}

/**
 * HOW TO USE:
 * 
 * // Usually placed in a navigation bar or header
 * <nav>
 *   <div>Logo</div>
 *   <ThemeToggle />
 * </nav>
 */

