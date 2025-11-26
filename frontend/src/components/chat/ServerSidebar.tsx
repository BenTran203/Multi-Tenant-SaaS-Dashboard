/**
 * 🏢 SERVER SIDEBAR - Left Navigation Bar
 * 
 * LEARNING: Sidebar Component Pattern
 * - Displays list of servers user belongs to
 * - Allows creating new servers
 * - Handles server selection
 * 
 * SLACK-STYLE: Compact vertical list with icons
 */

import { useState } from 'react';
import { Plus, Hash } from 'lucide-react';
import { Server, User } from '../../types';
import { api } from '../../services/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ServerSidebarProps {
  servers: Server[];
  selectedServerId: number | null;
  onServerSelect: (serverId: number) => void;
  onServerCreated: (server: Server) => void;
  user: User | null;
}

/**
 * SERVER SIDEBAR COMPONENT
 */
export function ServerSidebar({
  servers,
  selectedServerId,
  onServerSelect,
  onServerCreated,
  user
}: ServerSidebarProps) {
  
  // Modal state for creating new server
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  /**
   * CREATE SERVER HANDLER
   * 
   * LEARNING: POST request to create new server
   * - User becomes owner of the server
   * - Server gets a unique invite code
   */
  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName.trim()) {
      setError('Server name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await api.post('/api/servers', {
        name: serverName,
        icon: '🌿' // Default icon
      });

      // Notify parent component
      onServerCreated(response.data);

      // Reset and close modal
      setServerName('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* LEARNING: Fixed Width Sidebar */}
      <div className="w-20 bg-white dark:bg-dark-surface border-r border-nature-stone dark:border-dark-border flex flex-col items-center py-4 gap-3">
        
        {/* User avatar at top */}
        <div className="w-12 h-12 rounded-2xl bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-xs hover-bounce">
          {user?.username.slice(0, 2).toUpperCase()}
        </div>

        <div className="w-10 h-0.5 bg-nature-stone dark:bg-dark-border rounded-full"></div>

        {/* LEARNING: Scrollable Server List */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 px-2">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => onServerSelect(server.id)}
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                transition-all duration-200 hover:scale-110
                ${selectedServerId === server.id 
                  ? 'bg-grass-500 shadow-lg scale-110' 
                  : 'bg-oak-100 dark:bg-oak-900/30 hover:bg-oak-200 dark:hover:bg-oak-900/50'
                }
              `}
              title={server.name}
            >
              {server.icon || <Hash size={24} />}
            </button>
          ))}
        </div>

        {/* Add server button at bottom */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-2xl bg-grass-100 dark:bg-grass-900/30 hover:bg-grass-200 dark:hover:bg-grass-900/50 flex items-center justify-center text-grass-600 dark:text-grass-400 transition-all duration-200 hover:scale-110 hover-bounce"
          title="Create Server"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* LEARNING: Modal for Creating Server */}
      {/* Conditionally rendered based on showCreateModal state */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-md w-full m-4">
            <h2 className="text-xl font-pixel text-gradient-nature mb-4">
              Create Server 🌿
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateServer} className="space-y-4">
              <Input
                label="Server Name"
                type="text"
                placeholder="Nature Lovers"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                disabled={creating}
                autoFocus
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setServerName('');
                    setError('');
                  }}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * KEY FEATURES:
 * 
 * 1. Server List Display - Vertical icon list
 * 2. Active State - Highlights selected server
 * 3. Create Server Modal - Popup form
 * 4. Scroll Support - Handles many servers
 * 5. Hover Effects - Bouncy animations
 */

