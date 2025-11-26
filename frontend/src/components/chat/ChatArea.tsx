/**
 * 💬 CHAT AREA - Message Display and Input
 * 
 * LEARNING: Real-Time Chat Component
 * - Fetches message history from API
 * - Connects to Socket.io for real-time updates
 * - Displays messages in flat card style
 * - Handles sending new messages
 * - Auto-scrolls to newest messages
 * 
 * FLOW:
 * 1. Component mounts → fetch messages
 * 2. Connect to Socket.io room
 * 3. Listen for new messages
 * 4. Update UI in real-time
 */

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Message } from '../../types';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCard } from './MessageCard';

interface ChatAreaProps {
  channelId: number;
}

/**
 * CHAT AREA COMPONENT
 */
export function ChatArea({ channelId }: ChatAreaProps) {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // LEARNING: useRef for DOM element access
  // - Persists across re-renders (unlike regular variables)
  // - Used to programmatically scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * LEARNING: Fetch Messages on Channel Change
   * 
   * Runs whenever channelId changes
   * - Fetch message history from API
   * - Join Socket.io room for this channel
   */
  useEffect(() => {
    if (!channelId) return;

    fetchMessages();
    joinSocketRoom();

    // LEARNING: Cleanup Function
    // Runs when component unmounts or channelId changes
    // - Leave Socket.io room to avoid duplicate listeners
    return () => {
      socket.emit('leaveChannel', channelId);
    };
  }, [channelId]);

  /**
   * LEARNING: Socket.io Real-Time Listener
   * 
   * Listen for 'newMessage' events from server
   * - Server broadcasts when someone sends a message
   * - All connected clients receive it instantly
   */
  useEffect(() => {
    // Define message handler
    const handleNewMessage = (message: Message) => {
      // Only add if it's for current channel
      if (message.channelId === channelId) {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      }
    };

    // Register listener
    socket.on('newMessage', handleNewMessage);

    // LEARNING: Cleanup - Remove listener
    // Prevents memory leaks and duplicate handlers
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [channelId]);

  /**
   * AUTO-SCROLL TO BOTTOM
   * 
   * LEARNING: Scroll to bottom when new messages arrive
   * - useEffect runs after messages update
   * - scrollIntoView() smooth scrolls to element
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * FETCH MESSAGES FROM API
   */
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/channels/${channelId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * JOIN SOCKET.IO ROOM
   * 
   * LEARNING: Room-Based Communication
   * - Socket.io "rooms" group connections
   * - Only users in a room receive its messages
   * - Backend manages room membership
   */
  const joinSocketRoom = () => {
    if (socket.connected) {
      socket.emit('joinChannel', channelId);
    } else {
      // If not connected, connect first
      socket.connect();
      socket.on('connect', () => {
        socket.emit('joinChannel', channelId);
      });
    }
  };

  /**
   * SEND MESSAGE HANDLER
   * 
   * LEARNING: Optimistic UI Update
   * - Send to backend first
   * - Backend broadcasts to all clients (including sender)
   * - Everyone sees the message in real-time
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);

    try {
      // LEARNING: POST request to send message
      // - Backend saves to database
      // - Backend broadcasts via Socket.io
      // - We receive it via 'newMessage' event (no need to manually add)
      await api.post(`/channels/${channelId}/messages`, {
        content: messageContent
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  /**
   * SCROLL TO BOTTOM HELPER
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce-gentle text-3xl mb-2">💬</div>
          <p className="font-pixel text-sm text-grass-600 dark:text-grass-400">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      
      {/* LEARNING: Message List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        
        {/* LEARNING: Empty State */}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-bounce-gentle">🌱</div>
              <h3 className="font-pixel text-lg text-nature-bark dark:text-nature-cream mb-2">
                No messages yet
              </h3>
              <p className="text-nature-bark/60 dark:text-nature-stone font-sans text-sm">
                Be the first to say something!
              </p>
            </div>
          </div>
        )}

        {/* LEARNING: Message List Rendering */}
        {/* Map over messages array and render MessageCard for each */}
        {messages.map((message) => (
          <MessageCard 
            key={message.id} 
            message={message}
            isOwn={message.userId === user?.id}
          />
        ))}

        {/* LEARNING: Scroll anchor */}
        {/* Empty div at bottom for auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* LEARNING: Message Input Form */}
      <div className="border-t border-nature-stone dark:border-dark-border p-4 bg-white dark:bg-dark-surface">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... 🌿"
            className="input-field flex-1"
            disabled={sending}
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="
              px-6 py-3 bg-grass-500 text-white rounded-2xl
              hover:bg-grass-600 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg hover:shadow-xl
              flex items-center gap-2 font-pixel text-sm
            "
          >
            <Send size={18} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * KEY CONCEPTS:
 * 
 * 1. Real-Time Communication - Socket.io for instant updates
 * 2. Room-Based Chat - Join/leave channel rooms
 * 3. Event Listeners - Listen for server events
 * 4. Auto-Scroll - Programmatic scrolling with useRef
 * 5. Optimistic UI - Clear input immediately for responsiveness
 * 6. Cleanup Functions - Prevent memory leaks
 * 7. Loading States - Show spinners during data fetching
 */

