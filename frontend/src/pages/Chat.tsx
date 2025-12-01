/**
 * 💬 CHAT PAGE - Main Application Interface
 * 
 * LEARNING: Complex Layout with Multiple Components
 * - Slack-style 3-column layout
 * - Server sidebar (left) → Channel list (middle) → Chat area (right)
 * - Real-time message updates with Socket.io
 * - State management across multiple components
 * 
 * LAYOUT STRUCTURE:
 * ┌──────┬─────────┬────────────────┐
 * │Server│Channels │  Chat Messages │
 * │List  │  List   │  + Input       │
 * │      │         │                │
 * └──────┴─────────┴────────────────┘
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ServerSidebar } from '../components/chat/ServerSidebar';
import { ChannelSidebar } from '../components/chat/ChannelSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { api } from '../services/api';
import { Server, Channel } from '../types';

/**
 * CHAT COMPONENT
 * 
 * Main container for the entire chat interface
 */
export function Chat() {
  const { user, logout } = useAuth();

  // LEARNING: State Management for Chat
  // - servers: List of servers user belongs to
  // - selectedServerId: Currently selected server
  // - selectedChannelId: Currently selected channel
  // - channels: Channels in the selected server
  
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * LEARNING: Data Fetching on Mount
   * 
   * useEffect with empty dependency array runs once on component mount
   * - Fetch user's servers from API
   * - Select first server by default
   */
  useEffect(() => {
    fetchServers();
  }, []);

  /**
   * LEARNING: Dependent Data Fetching
   * 
   * When selectedServerId changes, fetch channels for that server
   * - useEffect with [selectedServerId] dependency
   * - Runs whenever selectedServerId updates
   */
  useEffect(() => {
    if (selectedServerId) {
      fetchChannels(selectedServerId);
    }
  }, [selectedServerId]);

  /**
   * FETCH SERVERS
   * 
   * LEARNING: API Call Pattern
   * - GET request to backend
   * - Update state with response
   * - Handle errors gracefully
   */
  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/servers');
      const serverList = response.data.servers;
      setServers(serverList);

      // Auto-select first server if available
      if (serverList.length > 0) {
        setSelectedServerId(serverList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH CHANNELS
   * 
   * Get all channels for a specific server
   * 
   * @param serverId - ID of server to fetch channels for
   */
  const fetchChannels = async (serverId: number) => {
    try {
      const response = await api.get(`/servers/${serverId}/channels`);
      const channelList = response.data;
      setChannels(channelList);

      // Auto-select first channel
      if (channelList.length > 0 && !selectedChannelId) {
        setSelectedChannelId(channelList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  /**
   * LEARNING: Event Handlers
   * 
   * Functions passed as props to child components
   * - Child components call these to update parent state
   * - This is called "lifting state up"
   */
  const handleServerSelect = (serverId: number) => {
    setSelectedServerId(serverId);
    setSelectedChannelId(null); 
  };

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannelId(channelId);
  };

  /**
   * LEARNING: Callback Function Pattern
   * 
   * When a new server is created, add it to the list
   * Passed to ServerSidebar component
   */
  const handleServerCreated = (newServer: Server) => {
    setServers([...servers, newServer]);
    setSelectedServerId(newServer.id);
  };

  /**
   * LEARNING: Loading State
   * 
   * Show loading spinner while fetching data
   */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-nature-cream dark:bg-dark-bg">
        <div className="text-center">
          <div className="animate-bounce-gentle text-4xl mb-4">🌿</div>
          <p className="font-pixel text-grass-600 dark:text-grass-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-nature-cream dark:bg-dark-bg">
      

      
      {/* 1️⃣ LEFT SIDEBAR: Server List (narrow) */}
      <ServerSidebar
        servers={servers}
        selectedServerId={selectedServerId}
        onServerSelect={handleServerSelect}
        onServerCreated={handleServerCreated}
        user={user}
      />

      {/* 2️⃣ MIDDLE SIDEBAR: Channel List */}
      {selectedServerId && (
        <ChannelSidebar
          serverId={selectedServerId}
          channels={channels}
          selectedChannelId={selectedChannelId}
          onChannelSelect={handleChannelSelect}
          onChannelCreated={(newChannel) => setChannels([...channels, newChannel])}
        />
      )}

      {/* 3️⃣ RIGHT AREA: Chat Messages + Input */}
      <div className="flex-1 flex flex-col relative">
        {/* Header with theme toggle and logout */}
        <div className="h-16 border-b border-nature-stone dark:border-dark-border bg-white dark:bg-dark-surface px-6 flex items-center justify-between">
          <div>
            {selectedChannelId && (
              <h2 className="font-pixel text-lg text-grass-600 dark:text-grass-400">
                # {channels.find(c => c.id === selectedChannelId)?.name}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-pixel text-oak-600 dark:text-oak-400 hover:bg-oak-50 dark:hover:bg-oak-900/20 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Chat area with messages */}
        {selectedChannelId ? (
          <ChatArea channelId={selectedChannelId} />
        ) : (
          // LEARNING: Empty State
          // Show friendly message when no channel is selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce-gentle">🌳</div>
              <h3 className="font-pixel text-xl text-nature-bark dark:text-nature-cream mb-2">
                Welcome to ChatWave!
              </h3>
              <p className="text-nature-bark/60 dark:text-nature-stone font-sans">
                Select a channel to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * KEY CONCEPTS:
 * 
 * 1. State Management - Multiple related states (servers, channels, selection)
 * 2. Data Fetching - useEffect for API calls
 * 3. Parent-Child Communication - Props and callbacks
 * 4. Lifting State Up - Parent manages state, children update it
 * 5. Conditional Rendering - Show/hide based on state
 * 6. Layout with Flexbox - 3-column responsive layout
 * 7. Empty States - Friendly UI when no data
 */

