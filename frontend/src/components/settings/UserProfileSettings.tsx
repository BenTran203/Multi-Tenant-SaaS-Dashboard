/**
 * 👤 USER PROFILE SETTINGS COMPONENT
 * 
 * Allows users to update:
 * - Avatar URL
 * - Bio
 * - Username (future)
 */

import { useState } from 'react';
import { Save, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface UserProfileSettingsProps {
  user: User;
}

export function UserProfileSettings({ user }: UserProfileSettingsProps) {
  const { updateUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/users/me', {
        avatarUrl: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      });

      const updatedUser = response.data.user || response.data;
      
      // Update AuthContext with new user data
      updateUser(updatedUser);
      
      setSuccess('Profile updated successfully! 🎉');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-pixel text-gradient-nature mb-2">
          Profile Settings
        </h2>
        <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
          Customize your profile appearance
        </p>
      </div>

      {success && (
        <div className="p-4 bg-grass-50 dark:bg-grass-900/20 border-2 border-grass-200 dark:border-grass-800 rounded-xl animate-pop-in">
          <p className="text-grass-600 dark:text-grass-400 font-pixel text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 font-pixel text-sm">{error}</p>
        </div>
      )}

      {/* AVATAR PREVIEW */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-2xl border-4 border-grass-200 dark:border-grass-800 overflow-hidden bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <UserIcon size={48} className="text-nature-bark/40 dark:text-nature-stone" />
          )}
        </div>
        <div className="flex-1">
          <Input
            label="Avatar URL"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-nature-bark/60 dark:text-nature-stone mt-1">
            Paste a link to your profile picture
          </p>
        </div>
      </div>

      {/* BIO */}
      <div>
        <label className="block text-sm font-pixel text-nature-bark dark:text-nature-cream mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="Tell us about yourself..."
          disabled={saving}
          className="w-full px-4 py-3 rounded-2xl border-2 border-nature-stone dark:border-dark-border bg-white dark:bg-dark-surface text-nature-bark dark:text-nature-cream font-sans resize-none focus:border-grass-500 dark:focus:border-grass-500 focus:outline-none transition-colors"
        />
        <p className="text-xs text-nature-bark/60 dark:text-nature-stone mt-1">
          {bio.length}/200 characters
        </p>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4 border-t border-nature-200 dark:border-nature-800">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
