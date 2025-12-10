/**
 * ============================================================================
 * MESSAGE CONTROLLER
 * ============================================================================
 */

import { prisma } from '../config/database.js';

// Get message 
export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    //Use pagination limit 50 messages
    const { limit = 50, before } = req.query;
    const userId = req.user.id;

    // 1. Validate Channel & Membership
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

    const whereClause = {
      channelId: channelId,
      deleted: false
    };

    if (before) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: before }
      });
      
      if (beforeMessage) {
        whereClause.createdAt = {
          lt: beforeMessage.createdAt 
        };
      }
    }

    // 3. Fetch Data
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
      orderBy: { createdAt: 'desc' }, 
      take: parseInt(limit)
    });
    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
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
 */
export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    //Verify user has access to this channel
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

    //Create the message
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
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isOwner = message.userId === userId;
    const isAdmin = membership?.role === 'ADMIN';
    
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

    const membership = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: message.channel.serverId
        }
      }
    });

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

