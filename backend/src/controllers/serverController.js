/**
 * ============================================================================
 * SERVER CONTROLLER
 * ============================================================================
 *
 * CONCEPT: Servers (Guilds)
 * - A Server is the top-level container for communities.
 * - It contains Channels and Members.
 * - It has an Owner (creator) who has full control.
 *
 * LOGIC FLOW:
 * - Users create servers -> become Owner & Admin.
 * - Users join servers via Invite Code -> become Member.
 * - Users can be members of multiple servers (Many-to-Many).
 */

import { prisma } from "../config/database.js";

/**
 * Create a new server
 *
 * LOGIC:
 * 1. Create the Server entity.
 * 2. Add the creator as the first Member (Role: ADMIN).
 * 3. Create a default "general" Channel.
 *
 * CONCEPT: Database Transactions (ACID)
 * We use `prisma.$transaction` to ensure all 3 steps happen together.
 * If step 3 fails, steps 1 & 2 are rolled back. No "zombie" servers!
 *
 * POST /api/servers
 * Body: { name, icon }
 */
export const createServer = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.user.id;

    const server = await prisma.$transaction(async (tx) => {
      // 1. Create Server
      const newServer = await tx.server.create({
        data: {
          name,
          iconUrl: icon,
          ownerId: userId,
        },
      });

      // 2. Add Owner as Admin
      await tx.serverMember.create({
        data: {
          userId: userId,
          serverId: newServer.id,
          role: "ADMIN",
        },
      });

      // 3. Create Default Channel
      await tx.channel.create({
        data: {
          name: "general",
          type: "TEXT",
          serverId: newServer.id,
          position: 0,
        },
      });

      return newServer;
    });

    res.status(201).json({
      message: "Server created successfully",
      server,
    });
  } catch (error) {
    console.error("Create server error:", error);
    res.status(500).json({
      error: "Failed to create server",
      details: error.message,
    });
  }
};

/**
 * Get all servers the user is a member of
 *
 * LOGIC:
 * - Find all servers where the `members` list contains the current user.
 * - Include the owner's basic info.
 * - Count members and channels for display.
 *
 * GET /api/servers
 */
export const getUserServers = async (req, res) => {
  try {
    const userId = req.user.id;

    const servers = await prisma.server.findMany({
      where: {
        members: {
          some: { userId: userId },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { members: true, channels: true },
        },
      },
    });
    res.json({ servers });
  } catch (error) {
    console.error("Get user servers error:", error);
    res.status(500).json({
      error: "Failed to get servers",
      details: error.message,
    });
  }
};

/**
 * Get a specific server by ID
 *
 * LOGIC:
 * 1. Fetch server with all nested data (channels, members).
 * 2. Security Check: Is the requester a member?
 *    - If yes, return data.
 *    - If no, return 403 Forbidden.
 *
 * GET /api/servers/:id
 */
export const getServerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Fetch Server
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        channels: {
          orderBy: { position: "asc" },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    // 2. Security Check
    const isMember = server.members.some((member) => member.userId === userId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member of this server",
      });
    }

    res.json({ server });
  } catch (error) {
    console.error("Get server error:", error);
    res.status(500).json({
      error: "Failed to get server",
      details: error.message,
    });
  }
};

/**
 *
 * LOGIC:
 * 1. Find server by invite code.
 * 2. Check if user is ALREADY a member (prevent duplicates).
 * 3. Create a new `ServerMember` record.
 *
 * POST /api/servers/join
 * Body: { inviteCode }
 */
export const joinServer = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // 1. Find Server
    const server = await prisma.server.findUnique({
      where: { inviteCode },
    });

    if (!server) {
      return res.status(404).json({
        error: "Invalid invite code",
      });
    }

    // 2. Check for existing membership
    const existingMember = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId: userId,
          serverId: server.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({
        error: "You are already a member of this server",
      });
    }

    // 3. Add Member
    await prisma.serverMember.create({
      data: {
        userId: userId,
        serverId: server.id,
        role: "MEMBER", // Default role
      },
    });

    res.json({
      message: "Successfully joined server",
      server,
    });
  } catch (error) {
    console.error("Join server error:", error);
    res.status(500).json({
      error: "Failed to join server",
      details: error.message,
    });
  }
};

/* 
UPDATE SERVER (check if it's correct)
*/

export const updateServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, theme } = req.body;
    const userId = req.user.id;

    //Check if server exists and user is owner
    const server = await prisma.server.findUnique({
      where: { id: parseInt(id) },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }
    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can update settings",
      });
    }
    const updateServer = await prisma.server.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(icon !== undefined && { icon }),
        ...(theme && { theme }),
      },
    });
    res.json({
      server: updatedServer,
      message: "Server updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* 
DELETE SERVER (check if it's correct)
*/

export const deleteServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, theme } = req.body;
    const userId = req.user.id;

    //Check if server exists and user is owner
    const server = await prisma.server.findUnique({
      where: { id: parseInt(id) },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }
    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can delete",
      });
    }
    const updateServer = await prisma.server.delete({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(icon !== undefined && { icon }),
        ...(theme && { theme }),
      },
    });
    res.json({
      server: updatedServer,
      message: "Server delete successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* 
GET SERVER MEMBER (check if it's correct)
*/
export const getServerMember = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;
    const membership = await prisma.user.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: parseInt(serveId),
        },
      },
    });
    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this server",
      });
    }

    const members = await prisma.user.findMany({
      where: { serverId: parseInt(serverId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            password: false,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });
    res.json({ 
      members,
      count: members.length
    });
  } catch (error) {
    next(errors)
  }
};


exports.kickMember = async (req, res, next) => {
  try {
    const { serverId, memberId } = req.params;
    const userId = req.user.id;

    // LEARNING: Verify user is the server owner
    const server = await prisma.server.findUnique({
      where: { id: parseInt(serverId) }
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({ 
        message: 'Only the server owner can kick members' 
      });
    }

    // LEARNING: Fetch the member to be kicked
    const member = await prisma.serverMember.findUnique({
      where: { id: parseInt(memberId) }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // LEARNING: Cannot kick the server owner
    if (member.userId === server.ownerId) {
      return res.status(400).json({ 
        message: 'Cannot kick the server owner' 
      });
    }

    // LEARNING: Delete the membership
    await prisma.serverMember.delete({
      where: { id: parseInt(memberId) }
    });

    res.json({ 
      message: 'Member got kicked ' 
    });
  } catch (error) {
    next(error);
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
