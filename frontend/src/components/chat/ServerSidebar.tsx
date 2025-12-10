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
import { useNavigate } from 'react-router-dom';
import { Plus, Hash } from 'lucide-react';
import { Server, User } from '../../types';
import { api } from '../../services/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ServerSidebarProps {
  servers: Server[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string) => void;
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
  
  const navigate = useNavigate();
  
  // Modal state for creating/joining server
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create'); // Toggle between create and join
  const [serverName, setServerName] = useState('');
  const [serverCode, setServerCode] = useState(''); // For joining server
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * CREATE SERVER HANDLER
   * 
   * LEARNING: POST request to create new server
   * - User becomes owner of the server
   * - Server gets a unique 8-character code
   */
  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName.trim()) {
      setError('Server name is required');
      return;
    }

    setCreating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/api/servers', {
        name: serverName,
        icon: '🌿' // Default icon
      });

      // Notify parent component
      onServerCreated(response.data.server || response.data);

      // Reset and close modal
      setServerName('');
      setShowModal(false);
      setSuccessMessage('Server created successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  /**
   * JOIN SERVER HANDLER
   * 
   * LEARNING: POST request to join server by code
   * - Uses 8-character server code
   * - Adds user as member
   */
  const handleJoinServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverCode.trim() || serverCode.trim().length !== 8) {
      setError('Server code must be 8 characters');
      return;
    }

    setJoining(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/api/servers/join', {
        serverCode: serverCode.toUpperCase()
      });

      // Notify parent component
      onServerCreated(response.data.server);

      // Reset and close modal
      setServerCode('');
      setShowModal(false);
      setSuccessMessage(`Joined ${response.data.server.name}!`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join server');
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      {/* LEARNING: Fixed Width Sidebar */}
      <div className="w-20 bg-white dark:bg-dark-surface border-r border-nature-stone dark:border-dark-border flex flex-col items-center py-4 gap-3">
        
        {/* User avatar at top - Click to go to profile */}
        <button
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-2xl bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-xs hover-bounce hover:scale-110 transition-transform"
          title="My Profile"
        >
          {user?.username.slice(0, 2).toUpperCase()}
        </button>

        <div className="w-10 h-0.5 bg-nature-stone dark:bg-dark-border rounded-full"></div>

        {/* LEARNING: Scrollable Server List */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 px-2">
          {servers.map((server) => (
            <div key={server.id} className="relative group">
              <button
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
              
              {/* Settings Icon - Only show for selected server and if user is owner */}

            </div>
          ))}
        </div>

        {/* Add server button at bottom */}
        <button
          onClick={() => {
            setShowModal(true);
            setModalMode('create'); // Default to create mode
          }}
          className="w-12 h-12 rounded-2xl bg-grass-100 dark:bg-grass-900/30 hover:bg-grass-200 dark:hover:bg-grass-900/50 flex items-center justify-center text-grass-600 dark:text-grass-400 transition-all duration-200 hover:scale-110 hover-bounce"
          title="Create or Join Server"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* LEARNING: Modal for Creating/Joining Server */}
      {/* Toggle between Create and Join modes */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-md w-full m-4">
            {/* Header with mode */}
            <h2 className="text-xl font-pixel text-gradient-nature mb-4">
              {modalMode === 'create' ? 'Create Server 🌿' : 'Join Server 🚪'}
            </h2>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-grass-50 dark:bg-grass-900/20 border-2 border-grass-200 dark:border-grass-800 rounded-xl">
                <p className="text-grass-600 dark:text-grass-400 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* CREATE MODE */}
            {modalMode === 'create' && (
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
                      setShowModal(false);
                      setServerName('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={creating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalMode('join');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={creating}
                    className="flex-1"
                  >
                    Join
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
            )}

            {/* JOIN MODE */}
            {modalMode === 'join' && (
              <form onSubmit={handleJoinServer} className="space-y-4">
                <Input
                  label="Server Code"
                  type="text"
                  placeholder="A3K9M2P7"
                  value={serverCode}
                  onChange={(e) => setServerCode(e.target.value.toUpperCase())}
                  disabled={joining}
                  maxLength={8}
                  autoFocus
                />
                <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
                  Enter the 8-character code to join a server
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setServerCode('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={joining}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalMode('create');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={joining}
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={joining || serverCode.length !== 8}
                    className="flex-1"
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </form>
            )}
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

