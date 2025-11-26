/**
 * 💬 MESSAGE CARD - Individual Message Display
 * 
 * LEARNING: Message Component
 * - Flat card style (Discord-inspired, not bubbles)
 * - Shows username, timestamp, and content
 * - Different styling for own messages
 * - Hover effects for interactivity
 */

import { Message } from '../../types';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface MessageCardProps {
  message: Message;
  isOwn: boolean;  // Is this message from current user?
}

/**
 * MESSAGE CARD COMPONENT
 * 
 * LEARNING: Conditional Styling
 * - Different colors for own vs others' messages
 * - Subtle visual distinction without speech bubbles
 */
export function MessageCard({ message, isOwn }: MessageCardProps) {
  
  return (
    <div
      className={`
        message-card group
        ${isOwn 
          ? 'border-oak-500 bg-oak-50 dark:bg-oak-900/20' 
          : 'border-grass-500'
        }
      `}
    >
      {/* LEARNING: Message Header (Username + Time) */}
      <div className="flex items-baseline gap-3 mb-2">
        
        {/* Username with avatar initial */}
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-xl flex items-center justify-center text-xs font-pixel
            ${isOwn 
              ? 'bg-oak-200 text-oak-700 dark:bg-oak-800 dark:text-oak-300' 
              : 'bg-grass-200 text-grass-700 dark:bg-grass-800 dark:text-grass-300'
            }
          `}>
            {message.user?.username.slice(0, 2).toUpperCase()}
          </div>
          
          <span className={`
            font-pixel text-sm
            ${isOwn 
              ? 'text-oak-700 dark:text-oak-400' 
              : 'text-grass-700 dark:text-grass-400'
            }
          `}>
            {message.user?.username}
          </span>
        </div>

        {/* LEARNING: Timestamp */}
        {/* formatDistanceToNow converts date to "2 minutes ago" */}
        <span className="text-xs text-nature-bark/50 dark:text-nature-stone font-sans">
          {formatDistanceToNow(new Date(message.createdAt))}
        </span>
      </div>

      {/* LEARNING: Message Content */}
      <div className="pl-10">
        <p className="text-nature-soil dark:text-nature-cream font-sans leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}

/**
 * KEY FEATURES:
 * 
 * 1. Flat Card Style - No speech bubbles, Discord-like
 * 2. User Avatar - Shows initials in colored circle
 * 3. Username Display - Bold, colored text
 * 4. Relative Timestamps - "5 minutes ago" format
 * 5. Own Message Highlight - Oak color for your messages
 * 6. Border Accent - Left border for visual separation
 * 7. Hover Effect - Subtle elevation on hover (from message-card class)
 */

