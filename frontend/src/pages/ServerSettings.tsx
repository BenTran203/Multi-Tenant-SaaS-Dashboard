/**
 * ⚙️ SERVER SETTINGS PAGE
 * 
 * LEARNING: Settings Dashboard Pattern
 * - Tab-based navigation for different settings sections
 * - Only server owners can access this page
 * - General settings (name, avatar, theme)
 * - Member management (kick, nickname changes)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Users, AlertTriangle } from 'lucide-react';
import { Server } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ServerGeneralSettings } from '../components/settings/ServerGeneralSettings';
import { ServerMembersSettings } from '../components/settings/ServerMembersSettings';
import { ServerDangerZone } from '../components/settings/ServerDangerZone';

type SettingsTab = 'general' | 'members' | 'danger';

/**
 * SERVER SETTINGS PAGE COMPONENT
 */
export function ServerSettings() {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [server, setServer] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * FETCH SERVER DATA
   */
  useEffect(() => {
    if (!serverId) return;
    fetchServerData();
  }, [serverId]);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/servers/${serverId}`);
      const serverData = response.data.server || response.data;
      
      // Check if user is the owner
      if (serverData.ownerId !== user?.id) {
        setError('Only the server owner can access settings');
        return;
      }

      setServer(serverData);
    } catch (err: any) {
      console.error('Failed to fetch server:', err);
      setError(err.response?.data?.message || 'Failed to load server settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-nature-cream dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce-gentle">⚙️</div>
          <p className="font-pixel text-sm text-grass-600 dark:text-grass-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  /**
   * ERROR STATE
   */
  if (error || !server) {
    return (
      <div className="min-h-screen bg-nature-cream dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-pixel text-gradient-nature mb-2">
            Access Denied
          </h2>
          <p className="text-nature-bark/60 dark:text-nature-stone mb-4">
            {error || 'Server not found'}
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="btn-primary"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-cream dark:bg-dark-bg">
      {/* HEADER */}
      <div className="bg-white dark:bg-dark-surface border-b border-nature-stone dark:border-dark-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-nature-100 dark:hover:bg-nature-900/30 rounded-xl transition-colors"
              title="Back to Chat"
            >
              <ArrowLeft size={24} className="text-nature-bark dark:text-nature-cream" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{server.icon || '🌿'}</div>
              <div>
                <h1 className="text-2xl font-pixel text-gradient-nature">
                  Server Settings
                </h1>
                <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
                  {server.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS CONTENT */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* SIDEBAR - Tab Navigation */}
          <div className="md:col-span-1">
            <div className="card p-4 space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-pixel text-sm
                  transition-all duration-200
                  ${activeTab === 'general'
                    ? 'bg-theme-primary text-white shadow-lg'
                    : 'bg-nature-100 dark:bg-nature-900/30 text-nature-bark dark:text-nature-cream hover:bg-nature-200 dark:hover:bg-nature-900/50'
                  }
                `}
              >
                <Settings size={18} />
                <span>General</span>
              </button>

              <button
                onClick={() => setActiveTab('members')}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-pixel text-sm
                  transition-all duration-200
                  ${activeTab === 'members'
                    ? 'bg-theme-primary text-white shadow-lg'
                    : 'bg-nature-100 dark:bg-nature-900/30 text-nature-bark dark:text-nature-cream hover:bg-nature-200 dark:hover:bg-nature-900/50'
                  }
                `}
              >
                <Users size={18} />
                <span>Members</span>
              </button>

              <button
                onClick={() => setActiveTab('danger')}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-pixel text-sm
                  transition-all duration-200
                  ${activeTab === 'danger'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-nature-100 dark:bg-nature-900/30 text-nature-bark dark:text-nature-cream hover:bg-nature-200 dark:hover:bg-nature-900/50'
                  }
                `}
              >
                <AlertTriangle size={18} />
                <span>Danger Zone</span>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="md:col-span-3">
            {activeTab === 'general' && (
              <ServerGeneralSettings 
                server={server} 
                onUpdate={(updatedServer) => setServer(updatedServer)}
              />
            )}
            {activeTab === 'members' && (
              <ServerMembersSettings serverId={server.id} />
            )}
            {activeTab === 'danger' && (
              <ServerDangerZone 
                server={server}
                isOwner={server.ownerId === user?.id}
                currentUserId={user?.id || ''}
                onNavigateBack={() => navigate('/chat')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * KEY CONCEPTS:
 * 
 * 1. Owner-Only Access - Security check on load
 * 2. Tab Navigation - Switch between settings sections
 * 3. Component Composition - Separate components for each tab
 * 4. State Management - Parent manages server state
 * 5. Error Handling - Graceful error and loading states
 */
