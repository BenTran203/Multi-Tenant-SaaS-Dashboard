/**
 * 🎨 BUTTON COMPONENT - Reusable Button with Nature Theme
 * 
 * LEARNING: Reusable Components
 * - Accept props to customize behavior
 * - Use TypeScript interfaces to define prop types
 * - Combine className props with default styles
 * 
 * WHY?: Instead of repeating button code everywhere, create one
 * component that can be customized and reused throughout the app.
 */

import { ButtonHTMLAttributes } from 'react';

/**
 * LEARNING: TypeScript Interface
 * Defines the shape of props this component accepts
 * 
 * - extends ButtonHTMLAttributes: Inherits all standard button props
 *   (onClick, disabled, type, etc.)
 * - variant: Custom prop for different button styles
 * - children: Content inside the button (text, icons, etc.)
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  children: React.ReactNode;
  className?: string;
}

/**
 * BUTTON COMPONENT
 * 
 * @param variant - Button style (primary, secondary, outline, ghost)
 * @param children - Button content
 * @param className - Additional CSS classes
 * @param ...props - All other button props (onClick, disabled, etc.)
 */
export function Button({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  
  /**
   * LEARNING: Dynamic className Generation
   * 
   * Base classes: Always applied to every button
   * Variant classes: Applied based on the variant prop
   * Custom classes: From className prop (optional)
   * 
   * WHY?: This pattern allows flexible, reusable styling
   */
  const baseClasses = 'font-pixel text-sm px-6 py-3 rounded-2xl transition-all duration-200 active:scale-95';
  
  // Different styles for each variant (NOW THEME-AWARE! 🎨)
  const variantClasses = {
    primary: 'bg-theme-primary text-white hover:bg-theme-secondary shadow-lg hover:shadow-xl',
    secondary: 'bg-oak-600 text-white hover:bg-oak-700 shadow-lg hover:shadow-xl',
    outline: 'bg-transparent border-2 border-theme-primary hover:bg-theme-light transition-colors',
    ghost: 'bg-transparent hover:bg-theme-light transition-colors'
  };

  return (
    <button
      // LEARNING: Template literals for combining classes
      // Joins base + variant + custom classes into one string
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}  // Spread remaining props (onClick, disabled, etc.)
    >
      {children}
    </button>
  );
}

/**
 * HOW TO USE:
 * 
 * <Button variant="primary" onClick={() => alert('Clicked!')}>
 *   Click Me! 🌿
 * </Button>
 * 
 * <Button variant="outline" disabled>
 *   Disabled Button
 * </Button>
 * 
 * <Button variant="ghost" className="w-full">
 *   Full Width Button
 * </Button>
 */

