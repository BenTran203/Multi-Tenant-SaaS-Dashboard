/**
 * SERVER CONTROLLER
 * 
 * LEARNING: This handles all server-related operations
 * - Creating servers (like Discord servers/guilds)
 * - Getting user's servers
 * - Joining servers with invite codes
 * - Managing server members
 */

import { prisma } from '../config/database.js';

/**
 * Create a new server
 * 
 * LEARNING: When a user creates a server:
 * 1. Create the server
 * 2. Make the creator the owner
 * 3. Add creator as an ADMIN member
 * 4. Create a default "general" channel
 * 
 * POST /api/servers
 * Body: { name }
 */
export const createServer = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // From authenticate middleware

    // LEARNING: Prisma transaction - all or nothing!
    // If any operation fails, everything is rolled back
    // WHY? We don't want a server without a channel, or a member without a server
    const server = await prisma.$transaction(async (tx) => {
      // 1. Create the server
      const newServer = await tx.server.create({
        data: {
          name,
          ownerId: userId,
          // inviteCode is automatically generated (see schema.prisma)
        }
      });

      // 2. Add creator as ADMIN member
      await tx.serverMember.create({
        data: {
          userId: userId,
          serverId: newServer.id,
          role: 'ADMIN'
        }
      });

      // 3. Create default "general" channel
      await tx.channel.create({
        data: {
          name: 'general',
          type: 'TEXT',
          serverId: newServer.id,
          position: 0
        }
      });

      return newServer;
    });

    res.status(201).json({
      message: 'Server created successfully',
      server
    });

  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ 
      error: 'Failed to create server',
      details: error.message 
    });
  }
};

/**
 * Get all servers the user is a member of
 * 
 * LEARNING: This finds all servers where the user is a member
 * Includes server details, channel count, member count
 * 
 * GET /api/servers
 */
export const getUserServers = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO (LEARNING): Complete this query
    // GOAL: Get all servers where user is a member
    // 
    // HINT: Use prisma.server.findMany() with where clause
    // HINT: Check ServerMember table for user's memberships
    // HINT: Include owner details, member count, channel count
    // 
    // DOCS: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries
    //
    // SOLUTION OUTLINE:
    // const servers = await prisma.server.findMany({
    //   where: {
    //     members: {
    //       some: { userId: userId }  // Server has this user as a member
    //     }
    //   },
    //   include: {
    //     owner: {
    //       select: { id: true, username: true, avatarUrl: true }
    //     },
    //     _count: {
    //       select: { members: true, channels: true }
    //     }
    //   }
    // });

    const servers = []; // TODO: Replace with actual query

    res.json({ servers });

  } catch (error) {
    console.error('Get user servers error:', error);
    res.status(500).json({ 
      error: 'Failed to get servers',
      details: error.message 
    });
  }
};

/**
 * Get a specific server by ID
 * 
 * LEARNING: Returns detailed server info including channels and members
 * 
 * GET /api/servers/:id
 */
export const getServerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // LEARNING: Find server with all related data
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        channels: {
          orderBy: { position: 'asc' }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // LEARNING: Check if user is a member of this server
    const isMember = server.members.some(member => member.userId === userId);
    
    if (!isMember) {
      return res.status(403).json({ 
        error: 'You are not a member of this server' 
      });
    }

    res.json({ server });

  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ 
      error: 'Failed to get server',
      details: error.message 
    });
  }
};

/**
 * Join a server with invite code
 * 
 * LEARNING: Anyone with an invite code can join a server
 * 
 * POST /api/servers/join
 * Body: { inviteCode }
 */
export const joinServer = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // LEARNING: Find server by invite code
    const server = await prisma.server.findUnique({
      where: { inviteCode }
    });

    if (!server) {
      return res.status(404).json({ 
        error: 'Invalid invite code' 
      });
    }

    // LEARNING: Check if user is already a member
    const existingMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: server.id
        }
      }
    });

    if (existingMember) {
      return res.status(409).json({ 
        error: 'You are already a member of this server' 
      });
    }

    // LEARNING: Add user as a member
    await prisma.serverMember.create({
      data: {
        userId: userId,
        serverId: server.id,
        role: 'MEMBER' // Default role
      }
    });

    res.json({
      message: 'Successfully joined server',
      server
    });

  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ 
      error: 'Failed to join server',
      details: error.message 
    });
  }
};

/**
 * CHALLENGE: Implement these functions yourself!
 * 
 * TODO (LEARNING): Update server
 * updateServer(req, res)
 * - Check if user is server owner
 * - Update server name/icon
 * PUT /api/servers/:id
 * 
 * TODO (LEARNING): Delete server
 * deleteServer(req, res)
 * - Check if user is server owner
 * - Delete server (cascade will delete members, channels, messages)
 * DELETE /api/servers/:id
 * 
 * TODO (LEARNING): Generate new invite code
 * regenerateInviteCode(req, res)
 * - Check if user is admin
 * - Generate new UUID for inviteCode
 * POST /api/servers/:id/invite
 * 
 * TODO (LEARNING): Kick member from server
 * kickMember(req, res)
 * - Check if user is admin
 * - Remove member from ServerMember table
 * - Can't kick the owner
 * DELETE /api/servers/:serverId/members/:userId
 */

