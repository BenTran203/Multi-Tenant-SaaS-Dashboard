/**
 * 👤 USER PROFILE CARD COMPONENT
 * 
 * Displays on hover over user in member list
 * Shows: Avatar, Username, Bio, Join Date
 */

import { User } from '../../types';
import { Calendar, Mail } from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  nickname?: string;
  bio?: string;
  joinedAt?: string;
  position: { x: number; y: number };
}

export function UserProfileCard({ user, nickname, joinedAt, position }: UserProfileCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div
      className="fixed z-50 w-80 bg-white dark:bg-dark-surface border-2 border-nature-200 dark:border-dark-border rounded-2xl shadow-2xl p-4 animate-pop-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* HEADER WITH AVATAR */}
      <div className="flex items-start gap-4 mb-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-grass-200 dark:border-grass-800"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-grass-400 to-grass-600 flex items-center justify-center border-4 border-grass-200 dark:border-grass-800">
            <span className="text-3xl font-pixel text-white">
              {user.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-pixel text-lg text-nature-bark dark:text-nature-cream truncate">
            {nickname || user.username}
          </h3>
          {nickname && (
            <p className="text-sm text-nature-bark/60 dark:text-nature-stone truncate">
              @{user.username}
            </p>
          )}
        </div>
      </div>

      {/* BIO */}
      {user.bio && (
        <div className="mb-4 p-3 bg-nature-100 dark:bg-nature-900/30 rounded-xl">
          <p className="text-sm text-nature-bark dark:text-nature-cream">
            {user.bio}
          </p>
        </div>
      )}

      {/* USER INFO */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-nature-bark/60 dark:text-nature-stone">
          <Mail size={16} />
          <span className="truncate">{user.email}</span>
        </div>
        
        {joinedAt && (
          <div className="flex items-center gap-2 text-nature-bark/60 dark:text-nature-stone">
            <Calendar size={16} />
            <span>Joined {formatDate(joinedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
