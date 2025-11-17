/**
 * MESSAGE CONTROLLER
 * 
 * LEARNING: Handles message operations
 * - Getting messages from a channel (with pagination)
 * - Creating messages (but real-time sending uses Socket.io)
 * - Deleting messages
 */

import { prisma } from '../config/database.js';

/**
 * Get messages from a channel (with pagination)
 * 
 * LEARNING: Pagination is important for performance
 * Don't load 10,000 messages at once!
 * 
 * GET /api/channels/:channelId/messages?limit=50&before=messageId
 * 
 * QUERY PARAMS:
 * - limit: How many messages to get (default 50)
 * - before: Get messages before this message ID (for scrolling up)
 */
export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.id;

    // LEARNING: Get the channel and its server
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // LEARNING: Check if user is a member of the server
    const isMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: channel.serverId
        }
      }
    });

    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this server' 
      });
    }

    // LEARNING: Build query with pagination
    const whereClause = {
      channelId: channelId,
      deleted: false // Don't show deleted messages
    };

    // If "before" is provided, only get messages before that message's timestamp
    if (before) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: before }
      });
      
      if (beforeMessage) {
        whereClause.createdAt = {
          lt: beforeMessage.createdAt // lt = less than
        };
      }
    }

    // LEARNING: Get messages with user info
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // Newest first
      take: parseInt(limit)
    });

    // LEARNING: Reverse the array so oldest message is first
    // Why? We fetched newest first for pagination, but want to display oldest first
    const messagesInOrder = messages.reverse();

    res.json({ 
      messages: messagesInOrder,
      hasMore: messages.length === parseInt(limit) // Are there more messages?
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      error: 'Failed to get messages',
      details: error.message 
    });
  }
};

/**
 * Create a message (REST API)
 * 
 * LEARNING: This is a backup for when Socket.io isn't available
 * Normally, messages are sent via Socket.io for real-time delivery
 * 
 * POST /api/channels/:channelId/messages
 * Body: { content }
 */
export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // LEARNING: Verify user has access to this channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const isMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: channel.serverId
        }
      }
    });

    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this server' 
      });
    }

    // LEARNING: Create the message
    const message = await prisma.message.create({
      data: {
        content,
        userId,
        channelId
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

    res.status(201).json({ message });

  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ 
      error: 'Failed to create message',
      details: error.message 
    });
  }
};

/**
 * Delete a message (soft delete)
 * 
 * LEARNING: Soft delete = mark as deleted instead of removing from database
 * WHY? Keep message history, prevent broken references
 * 
 * DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // LEARNING: Find the message
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        channel: {
          include: { server: true }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // LEARNING: Check if user owns the message OR is a server admin
    const isOwner = message.userId === userId;
    
    const membership = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: message.channel.serverId
        }
      }
    });

    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'You can only delete your own messages' 
      });
    }

    // LEARNING: Soft delete (mark as deleted)
    await prisma.message.update({
      where: { id },
      data: { 
        deleted: true,
        content: '[deleted]' // Optional: replace content
      }
    });

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      error: 'Failed to delete message',
      details: error.message 
    });
  }
};

/**
 * LEARNING: Why use pagination?
 * 
 * WITHOUT PAGINATION:
 * - Load all 10,000 messages at once
 * - Slow query (database has to fetch everything)
 * - Huge response size (10,000 messages = 10+ MB)
 * - Browser freezes rendering 10,000 messages
 * 
 * WITH PAGINATION:
 * - Load 50 messages at a time
 * - Fast query
 * - Small response size
 * - Smooth user experience
 * - Load more when user scrolls up ("infinite scroll")
 * 
 * COMMON PAGINATION STRATEGIES:
 * 1. Offset-based: ?limit=50&offset=100 (skip 100, take 50)
 *    - Simple but slow for large offsets
 * 2. Cursor-based: ?limit=50&before=messageId (before this message)
 *    - Faster, more reliable (we use this!)
 * 3. Timestamp-based: ?limit=50&before=2024-01-01T00:00:00Z
 *    - Works well for time-series data
 */

