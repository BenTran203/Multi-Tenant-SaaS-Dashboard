/**
 * 📋 CHANNEL SIDEBAR - Middle Panel
 */

import { useState } from "react";
import { Hash, Plus, Settings } from "lucide-react";
import { Channel } from "../../types";
import { api } from "../../services/api";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { Server, User } from "../../types";

interface ChannelSidebarProps {
  serverId: string;
  channels: Channel[];
  selectedChannelId: string | null;
  servers: Server[];
  selectedServerId: string | null;
  onChannelSelect: (channelId: string) => void;
  onChannelCreated: (channel: Channel) => void;
  user: User | null;
}

/**
 * CHANNEL SIDEBAR COMPONENT
 */
export function ChannelSidebar({
  serverId,
  channels,
  selectedChannelId,
  servers,
  selectedServerId,
  onChannelSelect,
  onChannelCreated,
  user,
}: ChannelSidebarProps) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  /**
   * CREATE CHANNEL HANDLER
   */
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await api.post(`/api/servers/${serverId}/channels`, {
        name: channelName,
        type: "text",
      });

      onChannelCreated(response.data.channel);
      setChannelName("");
      setShowCreateModal(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to create channel. You might not have permission."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="w-64 bg-theme-surface dark:bg-theme-dark-surface border-r border-theme-primary/20 dark:border-theme-primary/30 flex flex-col">
        {/* Header with server name */}
        <div className="h-16 border-b border-theme-primary/20 dark:border-theme-primary/30 px-4 flex items-center justify-between">
          <h2 className="font-pixel text-sm text-nature-bark dark:text-nature-cream truncate">
            {channels[0]?.server?.name || "Server"}
          </h2>

          {selectedServerId &&
            servers.find((s) => s.id === selectedServerId)?.ownerId ===
              user?.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/server/${selectedServerId}/settings`);
                }}
                className="p-2 hover:bg-nature-stone dark:hover:bg-dark-hover rounded-xl transition-colors"
                title="Server Settings"
              >
                <Settings size={14} />
              </button>
            )}
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Channels header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-pixel text-nature-bark dark:text-nature-stone uppercase tracking-wider">
              Channels
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1 hover:bg-nature-stone dark:hover:bg-dark-hover rounded-lg transition-colors"
              title="Create Channel"
            >
              <Plus size={14} className="text-grass-600 dark:text-grass-400" />
            </button>
          </div>

          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`
                  w-full px-3 py-2 rounded-xl text-left font-sans text-sm
                  flex items-center gap-2 transition-all duration-200
                  ${
                    selectedChannelId === channel.id
                      ? "bg-theme-primary text-white shadow-md hover:bg-theme-secondary"
                      : "text-nature-bark dark:text-nature-cream hover:bg-nature-stone dark:hover:bg-dark-hover"
                  }
                `}
              >
                <Hash
                  size={16}
                  className={
                    selectedChannelId === channel.id
                      ? "text-white"
                      : "text-theme-primary dark:text-theme-accent"
                  }
                />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>

          {channels.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-sm text-nature-bark/60 dark:text-nature-stone font-sans">
                No channels yet
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs font-pixel text-grass-600 dark:text-grass-400 hover:underline"
              >
                Create one!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-md w-full m-4">
            <h2 className="text-xl font-pixel text-gradient-nature mb-4">
              Create Channel 💬
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <Input
                label="Channel Name"
                type="text"
                placeholder="general-chat"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                disabled={creating}
                autoFocus
              />

              <div className="text-xs text-nature-bark/60 dark:text-nature-stone font-sans">
                💡 Tip: Use lowercase letters and hyphens (e.g., "nature-pics")
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setChannelName("");
                    setError("");
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
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
