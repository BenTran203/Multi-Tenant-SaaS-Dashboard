/**
 * 📝 INPUT COMPONENT - Reusable Text Input with Nature Theme
 * 
 * LEARNING: Controlled vs Uncontrolled Inputs
 * - Controlled: React state controls the value (value + onChange props)
 * - Uncontrolled: DOM controls the value (use ref to access)
 * 
 * This component supports both patterns!
 */

import { InputHTMLAttributes, forwardRef } from 'react';

/**
 * LEARNING: TypeScript Interface for Props
 * 
 * - extends InputHTMLAttributes: Inherit all standard input props
 * - label?: Optional label text
 * - error?: Optional error message to display
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * INPUT COMPONENT
 * 
 * LEARNING: forwardRef
 * - Allows parent components to access the input element via ref
 * - Useful for focus management, form libraries, etc.
 * 
 * @param label - Optional label text above input
 * @param error - Optional error message below input
 * @param className - Additional CSS classes
 * @param ...props - All standard input props (type, value, onChange, etc.)
 * @param ref - Reference to the input element
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {/* LEARNING: Conditional Rendering */}
        {/* Only show label if label prop is provided */}
        {label && (
          <label className="block mb-2 font-pixel text-sm text-nature-bark dark:text-nature-cream">
            {label}
          </label>
        )}
        
        <input
          ref={ref}  // Forward the ref to the actual input element
          className={`
            input-field
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}  // Spread all other props (type, value, onChange, etc.)
        />
        
        {/* LEARNING: Error State Display */}
        {/* Show error message if error prop is provided */}
        {error && (
          <p className="mt-2 text-sm text-red-500 font-sans animate-slide-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

// Display name for debugging (React DevTools)
Input.displayName = 'Input';

/**
 * HOW TO USE:
 * 
 * // Basic usage
 * <Input 
 *   type="text" 
 *   placeholder="Enter your name" 
 * />
 * 
 * // With label
 * <Input 
 *   label="Username" 
 *   type="text" 
 *   placeholder="johndoe" 
 * />
 * 
 * // With error
 * <Input 
 *   label="Email" 
 *   type="email" 
 *   placeholder="you@example.com"
 *   error="Invalid email address"
 * />
 * 
 * // Controlled input with state
 * const [name, setName] = useState('');
 * <Input 
 *   value={name} 
 *   onChange={(e) => setName(e.target.value)} 
 * />
 * 
 * // With ref for focus management
 * const inputRef = useRef<HTMLInputElement>(null);
 * <Input ref={inputRef} />
 * <button onClick={() => inputRef.current?.focus()}>Focus Input</button>
 */

