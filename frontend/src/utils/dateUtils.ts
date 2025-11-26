/**
 * 📅 DATE UTILITIES - Helper Functions for Date Formatting
 * 
 * LEARNING: Utility Functions
 * - Reusable helper functions
 * - Keep logic DRY (Don't Repeat Yourself)
 * - Easy to test and maintain
 */

/**
 * FORMAT DISTANCE TO NOW
 * 
 * Converts a date to relative time string
 * - "just now" for < 1 minute
 * - "5 minutes ago"
 * - "2 hours ago"
 * - "3 days ago"
 * 
 * @param date - Date to format
 * @returns Formatted string
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // LEARNING: Conditional logic for different time ranges
  
  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString();
}

/**
 * FORMAT TIME
 * 
 * Formats time as HH:MM (24-hour format)
 * 
 * @param date - Date to format
 * @returns Time string (e.g., "14:30")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * FORMAT DATE
 * 
 * Formats date as "Jan 15, 2024"
 * 
 * @param date - Date to format
 * @returns Date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

