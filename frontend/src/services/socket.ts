/**
 * 🔌 SOCKET.IO SERVICE - Real-Time Communication
 * 
 * LEARNING: This manages the WebSocket connection for real-time features
 * 
 * HTTP vs WebSocket:
 * - HTTP (REST): Request → Response (one-time)
 * - WebSocket: Persistent connection (two-way, real-time)
 * 
 * WHEN TO USE SOCKET.IO VS REST API?
 * - Socket.io: Real-time messages, typing indicators, user presence
 * - REST API: Initial data loading, user management, server/channel CRUD
 * 
 * FLOW:
 * 1. User logs in → Create socket connection with JWT token
 * 2. User joins channel → Emit 'joinChannel' event
 * 3. User sends message → Backend broadcasts to all in channel
 * 4. Other users receive message instantly via 'newMessage' event
 */

import { io, Socket } from 'socket.io-client';

/**
 * LEARNING: Socket.io Instance
 * 
 * - Initialized when user logs in
 * - Stays connected throughout session
 * - Auto-reconnects if connection drops
 */
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// LEARNING: Create socket instance
// - Don't auto-connect (we'll connect manually after login)
// - This is exported so components can use it directly
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false  // Wait for explicit .connect() call
});

/**
 * INITIALIZE SOCKET CONNECTION
 * 
 * Called after user logs in with their JWT token
 * 
 * @param token - JWT token for authentication
 */
export const initSocket = (token: string): void => {
  // Set auth token
  socket.auth = { token };
  
  // Connect if not already connected
  if (!socket.connected) {
    socket.connect();
  }

  // LEARNING: Event Listeners for Connection Status
  socket.on('connect', () => {
    console.log('🌿 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket error:', error.message);
  });
};

/**
 * DISCONNECT SOCKET
 * 
 * Called when user logs out
 */
export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect();
  }
};

/**
 * HOW TO USE IN COMPONENTS:
 * 
 * EXAMPLE: Chat Component with Real-Time Messages
 * ```typescript
 * import { useEffect, useState } from 'react';
 * import { socket } from '../services/socket';
 * 
 * function ChatComponent({ channelId }) {
 *   const [messages, setMessages] = useState([]);
 * 
 *   useEffect(() => {
 *     // Join the channel room
 *     socket.emit('joinChannel', channelId);
 * 
 *     // Listen for new messages
 *     const handleNewMessage = (message) => {
 *       setMessages(prev => [...prev, message]);
 *     };
 * 
 *     socket.on('newMessage', handleNewMessage);
 * 
 *     // Cleanup: Leave room and remove listener
 *     return () => {
 *       socket.emit('leaveChannel', channelId);
 *       socket.off('newMessage', handleNewMessage);
 *     };
 *   }, [channelId]);
 * 
 *   return <div>  //Render message
//  </div>;
//  * }
//  * ```
//  * 
//  * KEY SOCKET EVENTS (based on your backend):
//  * - 'joinChannel': Join a channel room
//  * - 'leaveChannel': Leave a channel room
//  * - 'newMessage': Receive new message (broadcast from server)
//  * - 'typing': User started typing
//  * - 'stopTyping': User stopped typing
//  */

