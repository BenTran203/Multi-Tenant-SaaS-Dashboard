/**
 * CHANNEL CONTROLLER
 * 
 * LEARNING: Handles channel operations within servers
 * - Creating channels
 * - Getting channels in a server
 * - Updating/deleting channels
 */

import { prisma } from '../config/database.js';

/**
 * Create a new channel in a server
 * 
 * LEARNING: Only server admins can create channels
 * 
 * POST /api/servers/:serverId/channels
 * Body: { name, type }
 */
export const createChannel = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, type = 'TEXT' } = req.body;
    const userId = req.user.id;

    // LEARNING: Check if user is an admin of this server
    const membership = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: serverId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ 
        error: 'You are not a member of this server' 
      });
    }

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can create channels' 
      });
    }

    // LEARNING: Get the highest position for ordering
    const highestPosition = await prisma.channel.findFirst({
      where: { serverId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const newPosition = (highestPosition?.position ?? -1) + 1;

    // LEARNING: Create the channel
    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        serverId,
        position: newPosition
      }
    });

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });

  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ 
      error: 'Failed to create channel',
      details: error.message 
    });
  }
};

/**
 * Get all channels in a server
 * 
 * LEARNING: Returns channels ordered by position
 * 
 * GET /api/servers/:serverId/channels
 */
export const getServerChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    // LEARNING: Check if user is a member
    const isMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: serverId
        }
      }
    });

    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this server' 
      });
    }

    // LEARNING: Get all channels, ordered by position
    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    res.json({ channels });

  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ 
      error: 'Failed to get channels',
      details: error.message 
    });
  }
};

/**
 * TODO (LEARNING): Implement delete channel
 * 
 * deleteChannel(req, res)
 * - Check if user is admin
 * - Don't allow deleting the last channel
 * - Delete channel (cascade will delete messages)
 * 
 * DELETE /api/channels/:id
 * 
 * HINT: Count channels in server first
 */

