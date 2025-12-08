/**
 * ========================================
 * SOCKET.IO EVENT HANDLERS
 * ========================================
 *
 * Real-time WebSocket communication for:
 * - Instant messaging
 * - Typing indicators
 * - User presence
 * - Channel management
 *
 * Documentation: https://socket.io/docs/v4/
 */

import { prisma } from "../config/database.js";
import { verifyToken } from "../config/jwt.js";

const onlineUsersByServer = new Map();

function addUserPresence(serverId, userId) {
  if (!onlineUsersByServer.has(serverId)) {
    onlineUsersByServer.set(serverId, new Set());
  }
  onlineUsersByServer.get(serverId).add(userId);
}

function removeUserPresence(serverId, userId) {
  const users = onlineUsersByServer.get(serverId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) {
      onlineUsersByServer.delete(serverId);
    }
  }
}

function getOnlineUsers(serverId) {
  return Array.from(onlineUsersByServer.get(serverId) || []);
}

export const setupSocketHandlers = (io) => {
  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket for access in all handlers
      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ============================================
  // CONNECTION HANDLER
  // ============================================

  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // --------------------------------------------
    // JOIN SERVER
    // --------------------------------------------
    socket.on("join-server", async ({ serverId }) => {
      try {
        // Verify user is a member of the server
        const member = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: serverId,
            },
          },
        });

        if (!member) {
          socket.emit("error", { message: "Not a member of this server" });
          return;
        }

        // Join the Socket.io room for this server
        socket.join(`server-${serverId}`);
        addUserPresence(serverId, socket.user.id);

        // Send current online users to the joining user
        const onlineUsers = getOnlineUsers(serverId);
        socket.emit("presence-update", { serverId, onlineUsers });

        // Notify others in the server that this user came online
        socket.to(`server-${serverId}`).emit("user-online", {
          userId: socket.user.id,
          username: socket.user.username,
          avatarUrl: socket.user.avatarUrl,
        });

        console.log(`🟢 ${socket.user.username} joined server ${serverId}`);
      } catch (error) {
        console.error("join-server error:", error);
        socket.emit("error", { message: "Failed to join server" });
      }
    });

    // --------------------------------------------
    // JOIN CHANNEL
    // --------------------------------------------
    socket.on("join-channel", async ({ channelId }) => {
      try {
        // Verify channel exists
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true },
        });

        if (!channel) {
          socket.emit("error", { message: "Channel not found" });
          return;
        }

        // Verify user is a server member
        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId,
            },
          },
        });

        if (!isMember) {
          socket.emit("error", { message: "Not a member of this server" });
          return;
        }

        // Join the Socket.io room (room name = channelId)
        socket.join(channelId);
        console.log(
          `📥 ${socket.user.username} joined channel: ${channel.name}`
        );

        // Notify others in the channel
        socket.to(channelId).emit("user-joined", {
          user: socket.user,
          channelId,
        });
      } catch (error) {
        console.error("Join channel error:", error);
        socket.emit("error", { message: "Failed to join channel" });
      }
    });

    // --------------------------------------------
    // LEAVE CHANNEL
    // --------------------------------------------
    socket.on("leave-channel", ({ channelId }) => {
      socket.leave(channelId);
      console.log(`📤 ${socket.user.username} left channel: ${channelId}`);
    });

    // --------------------------------------------
    // SEND MESSAGE
    // --------------------------------------------
    socket.on("send-message", async ({ channelId, content }) => {
      try {
        // 🔨 TODO: Add message length limits and content validation

        // Validation
        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message cannot be empty" });
          return;
        }

        // Verify channel exists and user has access
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true },
        });

        if (!channel) {
          socket.emit("error", { message: "Channel not found" });
          return;
        }

        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId,
            },
          },
        });

        if (!isMember) {
          socket.emit("error", { message: "Not a member of this server" });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            userId: socket.user.id,
            channelId: channelId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        });

        socket.on("typing-start", async ({ channelId }) => {
          try {
            //Verify user has access to channel
            //prisma.channel might be prisma.Channel
            const channel = await prisma.channel.findUnique({
              where: { id: channelId },
              include: { server: true },
            });

            if (!channel) return;
            const isMember = await prisma.serverMember.findUnique({
              where: {
                userId_serverId: {
                  userId: socket.user.id,
                  serverId: channel.serverId,
                },
              },
            });
            if (!isMember) return;
            socket.to(channelId).emit("user-typing", {
              userId: socket.user.id,
              username: socket.user.username,
              channelId,
            });
          } catch (error) {
            console.error("Typing start error:", error);
          }
        });
        // --------------------------------------------
        // STOP TYPING INDICATORS
        // --------------------------------------------

        socket.on("typing-stop", async ({ channelId }) => {
          try {
            //Verify user has access to channel
            //prisma.channel might be prisma.Channel
            const channel = await prisma.channel.findUnique({
              where: { id: channelId },
              include: { server: true },
            });

            if (!channel) return;
            const isMember = await prisma.serverMember.findUnique({
              where: {
                userId_serverId: {
                  userId: socket.user.id,
                  serverId: channel.serverId,
                },
              },
            });
            if (!isMember) return;
            socket.to(channelId).emit("user-stopped-typing", {
              userId: socket.user.id,
              username: socket.user.username,
              channelId,
            });
          } catch (error) {
            console.error("Typing stop error:", error);
          }
        });
        // Broadcast to everyone in the channel (including sender)
        io.to(channelId).emit("new-message", { message });

        console.log(
          `💬 ${socket.user.username}: ${content.substring(0, 50)}...`
        );
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // --------------------------------------------
    // TYPING INDICATORS
    // --------------------------------------------
    socket.on("typing-start", async ({ channelId }) => {
      try {
        // Verify channel exists and user has access
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true },
        });

        if (!channel) return;

        // Verify membership
        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId,
            },
          },
        });

        if (!isMember) return;

        // Broadcast to everyone in the channel EXCEPT the sender
        socket.to(channelId).emit("user-typing", {
          userId: socket.user.id,
          username: socket.user.username,
          channelId,
        });

        console.log(`${socket.user.username} is typing in ${channel.name}`);
      } catch (error) {
        console.error("Typing start error:", error);
      }
    });

    socket.on("typing-stop", async ({ channelId }) => {
      try {
        // Verify channel exists and user has access
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true },
        });

        if (!channel) return;

        const isMember = await prisma.serverMember.findUnique({
          where: {
            userId_serverId: {
              userId: socket.user.id,
              serverId: channel.serverId,
            },
          },
        });

        if (!isMember) return;

        // Broadcast to everyone in the channel
        socket.to(channelId).emit("user-stopped-typing", {
          userId: socket.user.id,
          channelId,
        });

        console.log(
          `${socket.user.username} stopped typing in ${channel.name}`
        );
      } catch (error) {
        console.error("Typing stop error:", error);
      }
    });

    // --------------------------------------------
    // DISCONNECT
    // --------------------------------------------
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Remove user from all servers they were in
      onlineUsersByServer.forEach((users, serverId) => {
        if (users.has(socket.user.id)) {
          removeUserPresence(serverId, socket.user.id);
          io.to(`server-${serverId}`).emit("user-offline", {
            userId: socket.user.id,
          });
          console.log(`🔴 ${socket.user.username} left server ${serverId}`);
        }
      });
    });
  });
};

// ============================================
// PRESENCE HANDLERS (Online/Offline Status)
// ============================================
// 🔨 TODO: Implement full presence tracking
//   - Broadcast user online status to channel members
//   - Track last seen timestamp
//   - Handle reconnection logic
export const setupPresenceHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ ${socket.user.username} is online`);

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.user.username} is offline`);
      // 🔨 TODO: Broadcast offline status to relevant channels
    });
  });
};

// ============================================
// LEARNING NOTES
// ============================================
/**
//  * SOCKET.IO EVENT FLOW:
//  * 
//  * 1. CLIENT CONNECTS
//  *    const socket = io('http://localhost:5000', { auth: { token: 'jwt' } });
//  * 
//  * 2. SERVER AUTHENTICATES
//  *    io.use() middleware verifies token, attaches socket.user
//  * 
//  * 3. CONNECTION ESTABLISHED
//  *    'connection' event fires, socket.id assigned
//  * 
//  * 4. CLIENT JOINS CHANNEL
//  *    socket.emit('join-channel', { channelId: 'abc' });
//  *    Server adds socket to room 'abc'
//  * 
//  * 5. CLIENT SENDS MESSAGE
//  *    socket.emit('send-message', { channelId: 'abc', content: 'Hi!' });
//  *    Server saves to DB and broadcasts to room 'abc'
//  * 
//  * 6. ALL CLIENTS IN ROOM RECEIVE
//    socket.on('new-message', ({ message }) => { /* Display in UI */
//  *
//  * 7. CLIENT DISCONNECTS
//  *    'disconnect' event fires, socket removed from all rooms
//  *
//  * BROADCASTING PATTERNS:
//  * - socket.emit('event', data)          → THIS socket only
//  * - socket.to(room).emit('event', data) → Everyone in room EXCEPT this socket
//  * - io.to(room).emit('event', data)     → EVERYONE in room INCLUDING this socket
//  * - socket.broadcast.emit('event', data)→ Everyone EXCEPT this socket (all rooms)
//  * - io.emit('event', data)              → ALL connected sockets (broadcast to all)
//  *
//  * ROOMS VS SOCKET:
//  * - io.on('connection')      → Server-level event (NEW connection)
//  * - socket.on('disconnect')  → Socket-level event (THIS connection ends)
//  * - socket.on('custom-event')→ Listen to client events (inside connection handler)
//  */
