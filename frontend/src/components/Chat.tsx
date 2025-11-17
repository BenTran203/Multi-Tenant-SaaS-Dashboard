/**
 * CHAT COMPONENT - Main application interface
 * 
 * LEARNING: This is the main chat interface with Discord-style layout:
 * [Server List] [Channel List] [Message Area]
 * 
 * This component demonstrates:
 * - Complex layout with multiple sections
 * - Real-time message handling with Socket.io
 * - State management with useState
 * - Side effects with useEffect
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { serverApi, channelApi, messageApi } from '../services/api';
import { getSocket } from '../services/socket';
import type { Server, Channel, Message } from '../types';
import { LogOut, Plus, Send, Hash, Users } from 'lucide-react';

export const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  
  // LEARNING: State management with useState
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // LEARNING: useRef for DOM reference (auto-scroll to bottom)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * LEARNING: Load servers when component mounts
   */
  useEffect(() => {
    loadServers();
  }, []);

  /**
   * LEARNING: Load channels when server changes
   */
  useEffect(() => {
    if (selectedServer) {
      loadChannels(selectedServer.id);
    }
  }, [selectedServer]);

  /**
   * LEARNING: Handle socket events for real-time messages
   */
  useEffect(() => {
    if (!selectedChannel) return;

    const socket = getSocket();
    if (!socket) return;

    // Join the channel room
    socket.emit('join-channel', { channelId: selectedChannel.id });

    // Listen for new messages
    const handleNewMessage = (data: { message: Message }) => {
      // Only add if it's for the current channel
      if (data.message.channelId === selectedChannel.id) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    socket.on('new-message', handleNewMessage);

    // Load existing messages
    loadMessages(selectedChannel.id);

    // Cleanup
    return () => {
      socket.emit('leave-channel', { channelId: selectedChannel.id });
      socket.off('new-message', handleNewMessage);
    };
  }, [selectedChannel]);

  /**
   * LEARNING: Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadServers = async () => {
    try {
      const { servers } = await serverApi.getAll();
      setServers(servers);
      if (servers.length > 0) {
        setSelectedServer(servers[0]);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (serverId: string) => {
    try {
      const { channels } = await channelApi.getAll(serverId);
      setChannels(channels);
      if (channels.length > 0) {
        setSelectedChannel(channels[0]);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const { messages } = await messageApi.getMessages(channelId);
      setMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChannel) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send-message', {
        channelId: selectedChannel.id,
        content: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  const handleCreateServer = async () => {
    const name = prompt('Enter server name:');
    if (!name) return;

    try {
      await serverApi.create({ name });
      loadServers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create server');
    }
  };

  const handleJoinServer = async () => {
    const inviteCode = prompt('Enter invite code:');
    if (!inviteCode) return;

    try {
      await serverApi.join(inviteCode);
      loadServers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join server');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No servers yet!</h2>
          <p className="text-gray-400 mb-6">Create your first server or join one with an invite code</p>
          <div className="space-x-4">
            <button
              onClick={handleCreateServer}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Create Server
            </button>
            <button
              onClick={handleJoinServer}
              className="px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600"
            >
              Join Server
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Server List (Left Sidebar) */}
      <div className="w-20 bg-dark-bg flex flex-col items-center py-4 space-y-2 border-r border-dark-border">
        {servers.map(server => (
          <button
            key={server.id}
            onClick={() => setSelectedServer(server)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white
                     transition-all duration-200 hover:rounded-xl
                     ${selectedServer?.id === server.id 
                       ? 'bg-primary-500 rounded-xl' 
                       : 'bg-dark-surface hover:bg-primary-500/20'}`}
            title={server.name}
          >
            {server.name.charAt(0).toUpperCase()}
          </button>
        ))}
        
        {/* Add Server Button */}
        <button
          onClick={handleCreateServer}
          className="w-12 h-12 rounded-2xl bg-dark-surface flex items-center justify-center
                   hover:bg-green-500 hover:rounded-xl transition-all duration-200"
          title="Create Server"
        >
          <Plus size={20} className="text-green-400" />
        </button>
        
        {/* Join Server Button */}
        <button
          onClick={handleJoinServer}
          className="w-12 h-12 rounded-2xl bg-dark-surface flex items-center justify-center
                   hover:bg-blue-500 hover:rounded-xl transition-all duration-200"
          title="Join Server"
        >
          <Users size={20} className="text-blue-400" />
        </button>
      </div>

      {/* Channel List */}
      <div className="w-60 bg-dark-surface flex flex-col">
        {/* Server Name Header */}
        <div className="h-16 px-4 flex items-center border-b border-dark-border">
          <h2 className="text-white font-semibold truncate">{selectedServer?.name}</h2>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase">
            Text Channels
          </div>
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full px-2 py-2 rounded-lg flex items-center space-x-2 text-left
                       transition-colors
                       ${selectedChannel?.id === channel.id
                         ? 'bg-dark-hover text-white'
                         : 'text-gray-400 hover:bg-dark-hover hover:text-white'}`}
            >
              <Hash size={18} />
              <span>{channel.name}</span>
            </button>
          ))}
        </div>

        {/* User Info Footer */}
        <div className="h-16 px-4 flex items-center justify-between bg-dark-elevated">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white font-medium truncate max-w-[100px]">
              {user?.username}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-16 px-6 flex items-center border-b border-dark-border bg-dark-surface">
          <Hash size={20} className="text-gray-400 mr-2" />
          <h3 className="text-white font-semibold">{selectedChannel?.name}</h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className="flex space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {message.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-white">{message.user.username}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-center space-x-3 bg-dark-surface rounded-lg px-4 py-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${selectedChannel?.name || 'channel'}`}
                className="flex-1 bg-transparent text-white placeholder-gray-500 
                         focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-primary-500 rounded-lg hover:bg-primary-600 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * TODO (LEARNING): Add these features yourself!
 * 
 * 1. Typing indicators
 * 2. Message timestamps
 * 3. Message reactions (emojis)
 * 4. Edit/delete messages
 * 5. User online status
 * 6. Unread message indicators
 * 7. Message search
 * 8. File uploads
 */

