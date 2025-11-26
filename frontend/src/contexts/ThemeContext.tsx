/**
 * 🌓 THEME CONTEXT - Light/Dark Mode Management
 * 
 * LEARNING: React Context API
 * - Context: Shares data across the entire component tree without passing props
 * - Provider: Wraps components that need access to the context
 * - Hook: useTheme() - easy way to access theme data in any component
 * 
 * WHY?: Instead of passing theme props through every component (prop drilling),
 * we store it in Context and any component can access it directly.
 * 
 * FLOW:
 * 1. User clicks theme toggle button
 * 2. toggleTheme() is called
 * 3. State updates and saves to localStorage
 * 4. HTML class changes ('dark' added/removed)
 * 5. All components re-render with new theme
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our theme context data
interface ThemeContextType {
  theme: 'light' | 'dark';      // Current theme
  toggleTheme: () => void;       // Function to switch themes
}

// Create the context with undefined as default
// (will be provided by ThemeProvider)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * THEME PROVIDER COMPONENT
 * 
 * LEARNING: This component wraps our entire app and provides theme state
 * to all child components through Context.
 * 
 * @param children - All components that need access to theme
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // LEARNING: useState hook
  // - Creates a state variable that persists between re-renders
  // - When state changes, component re-renders
  // - Initial value: check localStorage, default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Try to load saved theme from localStorage
    // WHY?: User's preference should persist between sessions
    const savedTheme = localStorage.getItem('chatwave-theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  /**
   * LEARNING: useEffect hook
   * 
   * Runs side effects when dependencies change.
   * Here, we update the HTML class and localStorage whenever theme changes.
   * 
   * WHY?: Tailwind uses the 'dark' class on <html> to apply dark mode styles
   */
  useEffect(() => {
    // Get the root HTML element
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Add 'dark' class → triggers dark: variants in Tailwind
      root.classList.add('dark');
    } else {
      // Remove 'dark' class → back to light mode
      root.classList.remove('dark');
    }
    
    // Save to localStorage so it persists after page refresh
    localStorage.setItem('chatwave-theme', theme);
    
    // LEARNING: Dependencies array [theme]
    // This effect runs whenever 'theme' changes
  }, [theme]);

  /**
   * TOGGLE THEME FUNCTION
   * 
   * Switches between light and dark mode
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // LEARNING: Provider component
  // - value prop: data available to all children
  // - All descendants can access theme and toggleTheme
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * CUSTOM HOOK: useTheme()
 * 
 * LEARNING: Custom hooks simplify accessing context
 * Instead of: const context = useContext(ThemeContext); if (!context) throw...
 * Just do: const { theme, toggleTheme } = useTheme();
 * 
 * @returns theme and toggleTheme function
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Safety check: ensure hook is used inside ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * HOW TO USE IN COMPONENTS:
 * 
 * import { useTheme } from '../contexts/ThemeContext';
 * 
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 */

