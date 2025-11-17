/**
 * SOCKET.IO EVENT HANDLERS
 * 
 * LEARNING: This is where the real-time magic happens!
 * 
 * WebSocket vs HTTP:
 * - HTTP: Client asks, server responds (request-response)
 * - WebSocket: Persistent connection, messages flow both ways
 * 
 * SOCKET.IO CONCEPTS:
 * - socket: Represents one client connection
 * - io: Represents the entire Socket.io server
 * - emit: Send a message
 * - on: Listen for a message
 * - room: Group of sockets (like a channel)
 * 
 * DOCUMENTATION: https://socket.io/docs/v4/
 */

import { prisma } from '../config/database.js';
import { verifyToken } from '../config/jwt.js';

/**
 * Setup Socket.io event handlers
 * 
 * @param {SocketIOServer} io - Socket.io server instance
 */
export const setupSocketHandlers = (io) => {
  
  // LEARNING: Middleware to authenticate socket connections
  // This runs before the 'connection' event
  io.use(async (socket, next) => {
    try {
      // LEARNING: Get token from handshake
      // Client sends: io('http://localhost:5000', { auth: { token: 'xxx' } })
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // LEARNING: Verify the token
      const decoded = verifyToken(token);

      // LEARNING: Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true
        }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // LEARNING: Attach user to socket object
      // Now we can access socket.user in all event handlers
      socket.user = user;

      next();

    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // LEARNING: Handle new connections
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    /**
     * JOIN CHANNEL
     * 
     * LEARNING: Rooms are like chat channels
     * When a user joins a channel, add their socket to that room
     * Then we can broadcast messages to everyone in that room
     * 
     * Client emits: socket.emit('join-channel', { channelId: 'xxx' })
     */
    socket.on('join-channel', async ({ channelId }) => {
      try {
        // LEARNING: Verify user has access to this channel
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true }
        });

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Check if user is a member of the server
        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId
            }
          }
        });

        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this server' });
          return;
        }

        // LEARNING: Join the room
        // room name = channel ID
        socket.join(channelId);
        
        console.log(`📥 ${socket.user.username} joined channel: ${channel.name}`);

        // LEARNING: Notify others in the channel (optional)
        socket.to(channelId).emit('user-joined', {
          user: socket.user,
          channelId
        });

      } catch (error) {
        console.error('Join channel error:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    /**
     * LEAVE CHANNEL
     * 
     * Client emits: socket.emit('leave-channel', { channelId: 'xxx' })
     */
    socket.on('leave-channel', ({ channelId }) => {
      socket.leave(channelId);
      console.log(`📤 ${socket.user.username} left channel: ${channelId}`);
    });

    /**
     * SEND MESSAGE
     * 
     * LEARNING: This is the core feature!
     * 1. Client sends message
     * 2. Server saves to database
     * 3. Server broadcasts to everyone in the channel
     * 
     * Client emits: socket.emit('send-message', { channelId: 'xxx', content: 'Hello!' })
     */
    socket.on('send-message', async ({ channelId, content }) => {
      try {
        // TODO (LEARNING): Complete this function
        // 
        // STEPS:
        // 1. Validate that content is not empty
        // 2. Verify user has access to this channel (similar to join-channel)
        // 3. Create message in database using prisma.message.create()
        // 4. Include user info in the response
        // 5. Broadcast to everyone in the room using io.to(channelId).emit()
        // 
        // BROADCASTING OPTIONS:
        // - socket.emit('event') - send to THIS socket only
        // - socket.to(room).emit('event') - send to everyone in room EXCEPT this socket
        // - io.to(room).emit('event') - send to EVERYONE in room INCLUDING this socket
        // - io.emit('event') - send to ALL connected sockets
        //
        // HINT: Use io.to(channelId).emit('new-message', { message })

        // Validation
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Verify channel exists and user has access
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true }
        });

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId
            }
          }
        });

        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this server' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            userId: socket.user.id,
            channelId: channelId
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        });

        // LEARNING: Broadcast to everyone in the channel
        io.to(channelId).emit('new-message', { message });

        console.log(`💬 ${socket.user.username}: ${content.substring(0, 50)}...`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * TYPING INDICATOR
     * 
     * LEARNING: Show "User is typing..." indicator
     * This is NOT saved to database (ephemeral)
     * 
     * Client emits: socket.emit('typing-start', { channelId: 'xxx' })
     */
    socket.on('typing-start', ({ channelId }) => {
      // LEARNING: Broadcast to others (not yourself)
      socket.to(channelId).emit('user-typing', {
        user: socket.user,
        channelId
      });
    });

    socket.on('typing-stop', ({ channelId }) => {
      socket.to(channelId).emit('user-stopped-typing', {
        userId: socket.user.id,
        channelId
      });
    });

    /**
     * DISCONNECT
     * 
     * LEARNING: Clean up when user disconnects
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
      
      // TODO (LEARNING - Phase 2): Update user presence status
      // Mark user as offline in database or Redis
    });
  });
};

/**
 * LEARNING: Socket.io Event Flow
 * 
 * 1. CLIENT CONNECTS:
 *    const socket = io('http://localhost:5000', {
 *      auth: { token: 'jwt-token' }
 *    });
 * 
 * 2. SERVER AUTHENTICATES:
 *    io.use() middleware runs
 *    Verifies token, attaches socket.user
 * 
 * 3. CONNECTION ESTABLISHED:
 *    'connection' event fires
 *    socket.id is assigned
 * 
 * 4. CLIENT JOINS CHANNEL:
 *    socket.emit('join-channel', { channelId: 'abc' });
 *    Server adds socket to room 'abc'
 * 
 * 5. CLIENT SENDS MESSAGE:
 *    socket.emit('send-message', { channelId: 'abc', content: 'Hi!' });
 *    Server saves to DB
 *    Server broadcasts to room 'abc'
 * 
 * 6. ALL CLIENTS IN ROOM RECEIVE:
 *    socket.on('new-message', ({ message }) => {
 *      // Display message in UI
 *    });
 * 
 * 7. CLIENT DISCONNECTS:
 *    User closes tab/browser
 *    'disconnect' event fires
 *    Socket removed from all rooms
 */

