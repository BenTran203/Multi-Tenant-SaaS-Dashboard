/**
 * SOCKET.IO SERVICE
 * 
 * LEARNING: This manages the WebSocket connection for real-time features
 * 
 * WHY SEPARATE FROM API?
 * - HTTP (REST): Request-response, one-time communication
 * - WebSocket: Persistent connection, bidirectional, real-time
 * 
 * WHEN TO USE SOCKET.IO VS REST API?
 * - Socket.io: Real-time messages, typing indicators, presence
 * - REST API: Initial data loading, user management, server CRUD
 */

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

// LEARNING: Type-safe socket
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

/**
 * Initialize Socket.io connection
 * 
 * LEARNING: This should be called after user logs in
 * The token is required for authentication
 */
export const initializeSocket = (token: string): TypedSocket => {
  // LEARNING: If socket already exists, return it
  if (socket && socket.connected) {
    return socket;
  }

  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // LEARNING: Connect to Socket.io server with authentication
  socket = io(SOCKET_URL, {
    auth: {
      token // This is sent to the server for authentication
    },
    autoConnect: true // Automatically connect on creation
  });

  // LEARNING: Connection event listeners
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    
    // LEARNING: Try to reconnect if disconnected unexpectedly
    if (reason === 'io server disconnect') {
      // Server disconnected, manually reconnect
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = (): TypedSocket | null => {
  return socket;
};

/**
 * Disconnect socket
 * 
 * LEARNING: Call this when user logs out
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * TODO (LEARNING): Create a custom hook for socket events
 * 
 * CHALLENGE: Create a React hook that listens to socket events
 * 
 * EXAMPLE USAGE:
 * const useSocketEvent = (event: string, callback: Function) => {
 *   useEffect(() => {
 *     const socket = getSocket();
 *     if (socket) {
 *       socket.on(event, callback);
 *       return () => {
 *         socket.off(event, callback);
 *       };
 *     }
 *   }, [event, callback]);
 * };
 * 
 * // In component:
 * useSocketEvent('new-message', (data) => {
 *   console.log('New message:', data);
 * });
 */

/**
 * LEARNING: Socket.io usage example in a React component:
 * 
 * import { useEffect } from 'react';
 * import { initializeSocket, getSocket } from './services/socket';
 * 
 * function ChatComponent({ channelId }) {
 *   useEffect(() => {
 *     const token = localStorage.getItem('token');
 *     if (!token) return;
 *     
 *     // Initialize socket
 *     const socket = initializeSocket(token);
 *     
 *     // Join channel
 *     socket.emit('join-channel', { channelId });
 *     
 *     // Listen for new messages
 *     const handleNewMessage = (data) => {
 *       console.log('New message:', data.message);
 *       // Update state to show message
 *     };
 *     
 *     socket.on('new-message', handleNewMessage);
 *     
 *     // Cleanup
 *     return () => {
 *       socket.emit('leave-channel', { channelId });
 *       socket.off('new-message', handleNewMessage);
 *     };
 *   }, [channelId]);
 *   
 *   // Send message
 *   const sendMessage = (content) => {
 *     const socket = getSocket();
 *     if (socket) {
 *       socket.emit('send-message', { channelId, content });
 *     }
 *   };
 *   
 *   return <div>...</div>;
 * }
 */

