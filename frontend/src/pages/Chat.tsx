
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useServerTheme } from "../contexts/ServerThemeContext";
import { ServerSidebar } from "../components/chat/ServerSidebar";
import { ChannelSidebar } from "../components/chat/ChannelSidebar";
import { UserListSidebar } from "../components/chat/UserListSidebar";
import { ChatArea } from "../components/chat/ChatArea";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { api } from "../services/api";
import { Server, Channel, User } from "../types";

/**
 * CHAT COMPONENT
 *
 * Main container for the entire chat interface
 */
export function Chat() {
  const { user, logout } = useAuth();
  const { applyTheme } = useServerTheme();

  // LEARNING: State Management for Chat
  // - servers: List of servers user belongs to
  // - selectedServerId: Currently selected server (UUID string)
  // - selectedChannelId: Currently selected channel (UUID string)
  // - channels: Channels in the selected server

  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverMembers, setServerMembers] = useState<User[]>([]);


  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServerId) {
      fetchChannels(selectedServerId);
      
      // Apply theme for selected server
      const currentServer = servers.find(s => s.id === selectedServerId);
      applyTheme(currentServer || null);
    }
  }, [selectedServerId, servers, applyTheme]);

  // Fetch server members for presence sidebar
  useEffect(() => {
    if (selectedServerId) {
      api
        .get(`/api/servers/${selectedServerId}/members`)
        .then((res) => {
          // Extract user objects from ServerMember structure AND preserve joinedAt
          const users = res.data.members.map((member: any) => ({
            ...member.user,
            joinedAt: member.joinedAt, // Add joinedAt from ServerMember to User object
          }));
          setServerMembers(users);
        })
        .catch((err) => console.error("Failed to fetch members:", err));
    }
  }, [selectedServerId]);

  /**
   * FETCH SERVERS
   */
  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/servers");
      const serverList = response.data.servers;
      setServers(serverList);

      // Auto-select first server if available
      if (serverList.length > 0) {
        setSelectedServerId(serverList[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH CHANNELS
   * @param serverId - UUID of server to fetch channels for
   */
  const fetchChannels = async (serverId: string) => {
    try {
      const response = await api.get(`/api/servers/${serverId}/channels`);
      const channelList = response.data.channels;
      setChannels(channelList);

      // Auto-select first channel
      if (channelList.length > 0 && !selectedChannelId) {
        setSelectedChannelId(channelList[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  // Fetch server members for presence sidebar

  /**
   * LEARNING: Event Handlers
   */
  const handleServerSelect = (serverId: string) => {
    setSelectedServerId(serverId);
    setSelectedChannelId(null);
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  /**
   * LEARNING: Callback Function Pattern
   */
  const handleServerCreated = (newServer: Server) => {
    setServers([...servers, newServer]);
    setSelectedServerId(newServer.id);
  };

  /**
   * Show loading spinner while fetching data
   */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-theme-bg dark:bg-theme-dark-bg">
        <div className="text-center">
          <div className="animate-bounce-gentle text-4xl mb-4">🌿</div>
          <p className="font-pixel text-grass-600 dark:text-grass-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-theme-bg dark:bg-theme-dark-bg">
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
          servers={servers}
          selectedServerId={selectedServerId}
          onChannelSelect={handleChannelSelect}
          onChannelCreated={(newChannel) =>
            setChannels([...channels, newChannel])
          }
          user={user}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-16 flex-shrink-0 border-b border-theme-primary/20 dark:border-theme-primary/30 bg-theme-surface dark:bg-theme-dark-surface px-6 flex items-center justify-between">
          <div>
            {selectedChannelId && (
              <h2 className="font-pixel text-lg text-grass-600 dark:text-grass-400">
                # {channels.find((c) => c.id === selectedChannelId)?.name}
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
      {selectedServerId && (
        <UserListSidebar serverId={selectedServerId} members={serverMembers} />
      )}{" "}
    </div>
  );
}
