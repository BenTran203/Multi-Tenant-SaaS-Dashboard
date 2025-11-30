/**
 * ============================================================================
 * CHANNEL CONTROLLER
 * ============================================================================
 *
 * CONCEPT: Channels
 * - Channels are where the actual chat happens.
 * - They belong to a Server.
 * - They have a `type` (TEXT, VOICE) and a `position` (for sorting).
 *
 * LOGIC FLOW:
 * - Admins create channels.
 * - Channels are ordered by `position`.
 * - Members can read/write in channels (unless restricted).
 */

import { prisma } from '../config/database.js';

/**
 * Create a new channel in a server
 *
 * LOGIC:
 * 1. Check if user is a member AND an ADMIN (RBAC).
 * 2. Calculate new position (append to end of list).
 * 3. Create channel.
 *
 * POST /api/servers/:serverId/channels
 * Body: { name, type }
 */
export const createChannel = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, type = 'TEXT' } = req.body;
    const userId = req.user.id;

    // 1. Check Permissions (RBAC)
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

    // 2. Calculate Position
    // We want the new channel to be at the bottom of the list.
    // So we find the highest current position and add 1.
    const highestPosition = await prisma.channel.findFirst({
      where: { serverId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const newPosition = (highestPosition?.position ?? -1) + 1;

    // 3. Create Channel
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
 * LOGIC:
 * 1. Check membership.
 * 2. Fetch channels ordered by `position` (ASC).
 * 3. Include message count (useful for UI badges).
 *
 * GET /api/servers/:serverId/channels
 */
export const getServerChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    // 1. Check Membership
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

    // 2. Fetch Channels
    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' }, // 0, 1, 2...
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

