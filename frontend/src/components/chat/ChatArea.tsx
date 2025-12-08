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
  channelId: string;  // UUID of the channel
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
  const [typingUsers, setTypingUsers] = useState<string[]>([]); // Store typing usernames

  // LEARNING: useRef for DOM element access
  // - Persists across re-renders (unlike regular variables)
  // - Used to programmatically scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef<boolean>(false); // Track if user is currently in "typing" state

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
    const handleNewMessage = (data: { message: Message }) => {
      // Only add if it's for current channel
      if (data.message.channelId === channelId) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
        scrollToBottom();
      }
    };

    // Typing indicators
    const handleUserTyping = (data: { userId: string; username: string; channelId: string }) => {
      console.log('Received typing event:', data); // DEBUG
      if (data.channelId === channelId && data.username !== user?.username) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            console.log('Adding typing user:', data.username); // DEBUG
            return [...prev, data.username];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data: { userId: string; username: string; channelId: string }) => {
      console.log('Received stopped typing event:', data); // DEBUG
      if (data.channelId === channelId) {
        setTypingUsers((prev) => {
          console.log('Removing typing user:', data.username); // DEBUG
          return prev.filter((username) => username !== data.username);
        });
      }
    };

    // Register listeners
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);

    return () => {
      if (isTypingRef.current) {
        socket.emit('typing-stop', { channelId });
        isTypingRef.current = false;
      }
      
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId, user]);

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
      socket.emit('join-channel', { channelId });
    } else {
      // If not connected, connect first
      socket.connect();
      socket.on('connect', () => {
        socket.emit('join-channel', { channelId });
      });
    }
  };

  /**
   * HANDLE TYPING
   * 
   * LEARNING: Debounced Typing Indicator
   * - Emit 'typing-start' when user starts typing
   * - After 2 seconds of no input, emit 'typing-stop'
   * - This prevents spamming the server
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only emit if user is actually typing something
    if (value.trim()) {
      // Only emit typing-start if not already typing (prevents spam)
      if (!isTypingRef.current) {
        socket.emit('typing-start', { channelId });
        isTypingRef.current = true;
      }

      // Keep timeout running - don't auto-stop while user is typing
      // Typing will only stop when: 1) User clears input, 2) User sends message, 3) User disconnects
    } else {
      // REQUIREMENT: Stop typing ONLY when input is completely cleared
      if (isTypingRef.current) {
        socket.emit('typing-stop', { channelId });
        isTypingRef.current = false;
      }
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

    // Stop typing indicator when sending
    socket.emit('typing-stop', { channelId });
    isTypingRef.current = false; 
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // LEARNING: Socket.io for real-time messages
      socket.emit('send-message', {
        channelId,
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

        {/* Empty div at bottom for auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* TYPING INDICATOR SECTION - Discord Style */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-3 bg-nature-100 dark:bg-nature-900/30 border-t border-nature-200 dark:border-nature-800">
          <div className="flex items-center gap-2">
            {/* Animated bouncing dots */}
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-grass-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-grass-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-grass-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            {/* Typing text */}
            <span className="text-sm font-sans text-nature-700 dark:text-nature-300">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : `${typingUsers.slice(0, 2).join(', ')} and ${typingUsers.length - 2} others are typing...`
              }
            </span>
          </div>
        </div>
      )}

      {/* LEARNING: Message Input Form */}
      <div className="border-t border-nature-stone dark:border-dark-border p-4 bg-white dark:bg-dark-surface">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message... 🌿"
            className="input-field flex-1 font-pixel"
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

