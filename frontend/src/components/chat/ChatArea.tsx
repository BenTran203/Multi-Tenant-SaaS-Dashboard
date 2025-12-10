/**
 * CHAT AREA - Message Display and Input
 * KEY PRINCIPLES:
 * 1. Parent Locks Scroll: h-screen + overflow-hidden
 * 2. Child Handles Scroll: flex-1 + overflow-y-auto + min-h-0
 * 3. Event Scoping: onScroll prop only fires for THIS component
 * 4. No Interference: ChatArea scroll ≠ UserList scroll ≠ Page scroll

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
  const [charCount, setCharCount] = useState(0); // Track character count for 500 char limit
  
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // For auto-resize like Discord 
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef<boolean>(false); 

  /**
   * Fetch Messages on Channel Change
   */
  useEffect(() => {
    if (!channelId) return;

    fetchMessages();
    joinSocketRoom();

    // Runs when component unmounts or channelId changes
    return () => {
      socket.emit('leaveChannel', channelId);
    };
  }, [channelId]);


  useEffect(() => {
    // Define message handler
    const handleNewMessage = (data: { message: Message }) => {
      if (data.message.channelId === channelId) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
        scrollToBottom();
      }
    };

    // Typing indicators
    const handleUserTyping = (data: { userId: string; username: string; channelId: string }) => {
      console.log('Received typing event:', data);
      if (data.channelId === channelId && data.username !== user?.username) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            console.log('Adding typing user:', data.username);
            return [...prev, data.username];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data: { userId: string; username: string; channelId: string }) => {
      console.log('Received stopped typing event:', data);
      if (data.channelId === channelId) {
        setTypingUsers((prev) => {
          console.log('Removing typing user:', data.username); 
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
   * 
   * @param loadMore - If true, append to existing messages (pagination)
   */
  const fetchMessages = async (loadMore = false) => {
    try {
      // If already loading more, don't start another request
      if (loadMore && loadingMore) return;
      
      // Set appropriate loading state
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setMessages([]); // Clear old messages when switching channels
      }

      // For pagination, we need the oldest message's ID as cursor
      let url = `/api/channels/${channelId}/messages?limit=50`;
      
      if (loadMore && messages.length > 0) {
        const oldestMessage = messages[0];
        url += `&before=${oldestMessage.id}`;
      }

      const response = await api.get(url);
      const newMessages = response.data.messages || [];
      
      //Append vs Replace Messages
      if (loadMore) {
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }
      
      // Update hasMore flag from backend response
      setHasMore(response.data.hasMore || false);
      
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /**
   * HANDLE SCROLL FOR INFINITE SCROLL
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // LEARNING: Get scroll info from the event target
    const container = e.currentTarget;
    
    // Check if scrolled near top (within 100px)
    const isNearTop = container.scrollTop < 100;
    
    // Load more if: near top + more messages exist + not already loading
    if (isNearTop && hasMore && !loadingMore) {
      // LEARNING: Save Scroll Position
      // When we prepend old messages, the scroll position would jump
      // Save current position so we can restore it after loading
      const scrollHeightBefore = container.scrollHeight;
      const scrollTopBefore = container.scrollTop;
      
      fetchMessages(true).then(() => {
        // LEARNING: Restore Scroll Position
        // New messages added above increased scroll height
        // Adjust scroll position to maintain visual stability
        requestAnimationFrame(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight;
            const scrollDiff = scrollHeightAfter - scrollHeightBefore;
            // Move scroll down by the amount content grew
            container.scrollTop = scrollTopBefore + scrollDiff;
          }
        });
      });
    }
  };

  /**
   * ATTACH SCROLL LISTENER
   * 
   * LEARNING: We DON'T use addEventListener here anymore
   * Instead, we use React's onScroll prop directly on the div
   * This prevents conflicts with page scroll and other components
   */
  // Removed - using onScroll prop instead
   /* 
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
    } else {
      if (isTypingRef.current) {
        socket.emit('typing-stop', { channelId });
        isTypingRef.current = false;
      }
    }
  };

  /**
   * SEND MESSAGE HANDLER
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    socket.emit('typing-stop', { channelId });
    isTypingRef.current = false; 
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
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
    // LEARNING: Full Height Container with No Overflow
    // - h-full = Takes 100% of parent's height
    // - flex flex-col = Stacks children vertically
    // - overflow-hidden = Prevents this container from scrolling
    // - Only the messages div inside will scroll
    <div className="h-full flex flex-col ">
      
      {/* LEARNING: Scrollable Messages Container */}
      {/* 
        - flex-1 = Takes remaining space (between top indicators and bottom input)
        - overflow-y-auto = Only THIS div scrolls (not the page)
        - overflow-x-hidden = Prevents horizontal scroll (word-break handles long text)
        - min-h-0 = Critical! Allows flex item to shrink below content size
        - onScroll only triggers when THIS specific div is scrolled
      */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-6 space-y-3"
      >
        
        {/* LEARNING: Loading More Indicator at Top */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-grass-600 dark:text-grass-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-grass-600 border-t-transparent"></div>
              <span className="font-pixel text-xs">Loading older messages...</span>
            </div>
          </div>
        )}
        
        {/* LEARNING: "No More Messages" Indicator */}
        {!hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="px-4 py-2 bg-nature-sand dark:bg-dark-elevated rounded-full">
              <span className="font-pixel text-xs text-nature-bark/60 dark:text-nature-stone/60">
                🌱 This is the beginning of the channel
              </span>
            </div>
          </div>
        )}
        
        {/* LEARNING: Empty State */}
        {messages.length === 0 && !loading && (
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

      {/* TYPING INDICATOR SECTION */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 px-6 py-3 bg-nature-100 dark:bg-nature-900/30 border-t border-nature-200 dark:border-nature-800">
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
      {/* Discord-style: Textarea expands automatically with content */}
      <div className="flex-shrink-0 border-t border-nature-stone dark:border-dark-border p-4 bg-white dark:bg-dark-surface overflow-x-hidden">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="flex gap-3 items-end">
            {/* Discord-style auto-expanding textarea */}
            {/* - Grows from 1 line to max 200px (~10 lines) based on content */}
            {/* - Enables scroll if content exceeds max height */}
            {/* - 500 character limit with counter */}
            {/* - Resets to 1 line after sending */}
            <textarea
              ref={textareaRef}
              value={newMessage}
              maxLength={500}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setNewMessage(value);
                  setCharCount(value.length);
                  handleInputChange(e as any);
                  
                  // Discord-style auto-resize: Expand textarea based on content
                  const textarea = e.target;
                  textarea.style.height = 'auto'; // Reset height
                  const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px (~10 lines)
                  textarea.style.height = `${newHeight}px`;
                  
                  // Enable scroll if content exceeds max height
                  if (textarea.scrollHeight > 200) {
                    textarea.style.overflowY = 'auto';
                  } else {
                    textarea.style.overflowY = 'hidden';
                  }
                }
              }}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                  
                  // Reset textarea height and char count after sending
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.overflowY = 'hidden';
                  }
                  setCharCount(0);
                }
              }}
              placeholder="Type a message... 🌿"
              className="input-field flex-1 font-pixel resize-none overflow-x-hidden break-words"
              style={{ minHeight: '48px', maxHeight: '200px', overflowY: 'hidden' }} // Start at 48px, max 200px with scroll
              disabled={sending}
              autoFocus
              rows={1}
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
          </div>
          {/* Character counter - shows remaining characters */}
          <div className="flex justify-end">
            <span className={`text-xs font-pixel ${
              charCount > 450 
                ? 'text-red-500' // Warning when close to limit
                : 'text-nature-bark/50 dark:text-nature-stone/50'
            }`}>
              {charCount}/500
            </span>
          </div>
        </form>
      </div>    
      </div>
  );
}
 
