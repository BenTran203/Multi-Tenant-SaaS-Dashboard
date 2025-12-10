/**
 * ⚙️ SERVER GENERAL SETTINGS COMPONENT
 * 
 * LEARNING: Server Configuration
 * - Update server name
 * - Change server avatar (emoji picker)
 * - Select theme colors
 * 
 * THREE THEME OPTIONS:
 * - Nature (default green theme)
 * - Ocean (blue theme)
 * - Sunset (orange/red theme)
 */

import { useState } from 'react';
import { Save, Copy, Check, RefreshCw } from 'lucide-react';
import { Server } from '../../types';
import { api } from '../../services/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ServerGeneralSettingsProps {
  server: Server;
  onUpdate: (server: Server) => void;
}

// Emoji options for server avatar
const EMOJI_OPTIONS = [
  '🌿', '🌱', '🍃', '🌲', '🌳', '🌴', '🌵', '🌾', '🌺', '🌻',
  '🌼', '🌷', '🌹', '🥀', '🏵️', '🌸', '💐', '🍄', '🪴', '🌰',
  '🍀', '🪷', '🌈', '⭐', '✨', '🔥', '💧', '🌊', '⚡', '☀️'
];

// Theme color options
const THEME_OPTIONS = [
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿',
    description: 'Green forest vibes',
    colors: { primary: '#10b981', secondary: '#059669', accent: '#047857' }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    description: 'Blue wave aesthetics',
    colors: { primary: '#3b82f6', secondary: '#2563eb', accent: '#1d4ed8' }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    description: 'Warm orange glow',
    colors: { primary: '#f97316', secondary: '#ea580c', accent: '#c2410c' }
  }
];

/**
 * SERVER GENERAL SETTINGS COMPONENT
 */
export function ServerGeneralSettings({ server, onUpdate }: ServerGeneralSettingsProps) {
  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState(server.icon || '\ud83c\udf3f');
  const [theme, setTheme] = useState(server.theme || 'nature'); // Get theme from server
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false); // For copy button feedback
  const [regenerating, setRegenerating] = useState(false); // For code regeneration

  /**
   * HANDLE SAVE
   * 
   * LEARNING: PUT request to update server
   * Backend endpoint: PUT /api/servers/:id
   */
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Server name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/api/servers/${server.id}`, {
        name: name.trim(),
        icon,
        theme
      });

      const updatedServer = response.data.server || response.data;
      onUpdate(updatedServer);
      setSuccess('Settings saved successfully! 🎉');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update server:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  /**
   * COPY SERVER CODE
   * 
   * Copies 8-character server code to clipboard
   */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(server.serverCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * REGENERATE SERVER CODE
   * 
   * Manually regenerate server code (owner only)
   */
  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure you want to regenerate the server code? The old code will no longer work.')) {
      return;
    }

    setRegenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/api/servers/${server.id}/regenerate-code`);
      const updatedServer = response.data.server;
      onUpdate(updatedServer);
      setSuccess('Server code regenerated successfully! 🔄');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to regenerate code:', err);
      setError(err.response?.data?.message || 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-pixel text-gradient-nature mb-2">
          General Settings
        </h2>
        <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
          Customize your server's appearance and identity
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="p-4 bg-grass-50 dark:bg-grass-900/20 border-2 border-grass-200 dark:border-grass-800 rounded-xl animate-pop-in">
          <p className="text-grass-600 dark:text-grass-400 font-pixel text-sm">{success}</p>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 font-pixel text-sm">{error}</p>
        </div>
      )}

      {/* SERVER NAME */}
      <div>
        <Input
          label="Server Name"
          type="text"
          placeholder="My Awesome Server"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </div>

      {/* SERVER CODE SECTION */}
      <div>
        <label className="block text-sm font-pixel text-nature-bark dark:text-nature-cream mb-2">
          Server Code
        </label>
        <div className="flex items-center gap-3">
          {/* Code Display */}
          <div className="flex-1 p-4 bg-nature-100 dark:bg-nature-900/30 rounded-2xl border-2 border-nature-200 dark:border-nature-800">
            <div className="flex items-center justify-between">
              <code className="text-2xl font-pixel text-grass-600 dark:text-grass-400 tracking-wider">
                {server.serverCode || 'N/A'}
              </code>
              <div className="flex gap-2">
                {/* Copy Button */}
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-grass-100 dark:bg-grass-900/30 hover:bg-grass-200 dark:hover:bg-grass-900/50 transition-all duration-200 hover:scale-110"
                  title="Copy code"
                >
                  {copied ? (
                    <Check size={18} className="text-grass-600 dark:text-grass-400" />
                  ) : (
                    <Copy size={18} className="text-grass-600 dark:text-grass-400" />
                  )}
                </button>
                {/* Regenerate Button */}
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="p-2 rounded-xl bg-oak-100 dark:bg-oak-900/30 hover:bg-oak-200 dark:hover:bg-oak-900/50 transition-all duration-200 hover:scale-110 disabled:opacity-50"
                  title="Regenerate code"
                >
                  <RefreshCw 
                    size={18} 
                    className={`text-oak-600 dark:text-oak-400 ${regenerating ? 'animate-spin' : ''}`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-nature-bark/60 dark:text-nature-stone mt-2">
          Share this code with others to invite them to your server. Code regenerates automatically every hour.
        </p>
      </div>

      {/* SERVER AVATAR (EMOJI PICKER) */}
      <div>
        <label className="block text-sm font-pixel text-nature-bark dark:text-nature-cream mb-2">
          Server Avatar
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-16 h-16 text-4xl bg-nature-100 dark:bg-nature-900/30 rounded-2xl hover:bg-nature-200 dark:hover:bg-nature-900/50 transition-all duration-200 hover:scale-105 flex items-center justify-center"
          >
            {icon}
          </button>
          <div className="flex-1">
            <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
              Click to change your server's emoji avatar
            </p>
          </div>
        </div>

        {/* EMOJI PICKER GRID */}
        {showEmojiPicker && (
          <div className="mt-4 p-4 bg-nature-100 dark:bg-nature-900/30 rounded-2xl animate-pop-in">
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setIcon(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className={`
                    w-10 h-10 text-2xl rounded-xl hover:bg-white dark:hover:bg-dark-surface
                    transition-all duration-200 hover:scale-110
                    ${emoji === icon ? 'bg-grass-500 scale-110' : 'bg-white/50 dark:bg-dark-surface/50'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* THEME SELECTION */}
      <div>
        <label className="block text-sm font-pixel text-nature-bark dark:text-nature-cream mb-3">
          Server Theme
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEME_OPTIONS.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`
                p-4 rounded-2xl border-2 transition-all duration-200
                ${theme === themeOption.id
                  ? 'border-grass-500 bg-grass-50 dark:bg-grass-900/20 shadow-lg scale-105'
                  : 'border-nature-200 dark:border-nature-800 bg-white dark:bg-dark-surface hover:border-nature-300 dark:hover:border-nature-700'
                }
              `}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{themeOption.icon}</div>
                <h3 className="font-pixel text-sm text-nature-bark dark:text-nature-cream mb-1">
                  {themeOption.name}
                </h3>
                <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
                  {themeOption.description}
                </p>
                
                {/* COLOR PREVIEW */}
                <div className="flex justify-center gap-2 mt-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-border shadow-sm"
                    style={{ backgroundColor: themeOption.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-border shadow-sm"
                    style={{ backgroundColor: themeOption.colors.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-border shadow-sm"
                    style={{ backgroundColor: themeOption.colors.accent }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
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

/**
 * KEY FEATURES:
 * 
 * 1. Server Name Editing - Text input with validation
 * 2. Emoji Avatar Picker - Grid of emoji options
 * 3. Theme Selection - Three pre-defined color schemes
 * 4. Real-time Preview - See changes before saving
 * 5. Success/Error Feedback - User-friendly messages
 */
