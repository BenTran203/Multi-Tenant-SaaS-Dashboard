/**
 * 🎴 CARD COMPONENT - Container with Nature Theme
 * 
 * LEARNING: Layout Components
 * Cards are versatile containers used throughout apps for:
 * - Grouping related content
 * - Creating visual hierarchy
 * - Adding elevation/depth to the UI
 */

import { HTMLAttributes } from 'react';

/**
 * LEARNING: Component Props Interface
 * 
 * - hover?: Enable hover animation effect
 * - children: Content inside the card
 * - className?: Additional custom classes
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * CARD COMPONENT
 * 
 * A flexible container with rounded corners, shadows, and optional hover effect
 * 
 * @param hover - Enable hover lift animation
 * @param children - Card content
 * @param className - Additional CSS classes
 * @param ...props - All other div props (onClick, etc.)
 */
export function Card({ 
  hover = false, 
  children, 
  className = '', 
  ...props 
}: CardProps) {
  return (
    <div
      className={`
        card
        ${hover ? 'card-hover' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * HOW TO USE:
 * 
 * // Basic card
 * <Card>
 *   <h2>Welcome!</h2>
 *   <p>This is a nature-themed card.</p>
 * </Card>
 * 
 * // Card with hover effect
 * <Card hover onClick={() => alert('Clicked!')}>
 *   <h2>Clickable Card</h2>
 *   <p>Hover over me!</p>
 * </Card>
 * 
 * // Card with custom classes
 * <Card className="max-w-md mx-auto mt-8">
 *   <h2>Centered Card</h2>
 * </Card>
 */

