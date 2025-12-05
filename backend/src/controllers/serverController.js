/**
 * ============================================================================
 * SERVER CONTROLLER
 * ============================================================================
 * 
 */


import { prisma } from "../config/database.js";


/**
 * Create a new server
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
 * Join server function
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

// Update server settings (name, icon, theme) - Owner only
export const updateServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, theme } = req.body;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can update settings",
      });
    }
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon && { iconUrl: icon }),
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

// Delete server - Owner only
export const deleteServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }
    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can delete",
      });
    }
    await prisma.server.delete({
      where: { id },
    });

    res.json({
      message: "Server deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all members of a server
export const getServerMember = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this server",
      });
    }

    const members = await prisma.serverMember.findMany({
      where: { serverId },
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
    next(error);
  }
};

// Kick a member from server - Owner only
export const kickMember = async (req, res, next) => {
  try {
    const { serverId, memberId } = req.params;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({ 
        message: 'Only the server owner can kick members' 
      });
    }

    const member = await prisma.serverMember.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.userId === server.ownerId) {
      return res.status(400).json({ 
        message: 'Cannot kick the server owner' 
      });
    }

    await prisma.serverMember.delete({
      where: { id: memberId }
    });

    res.json({ 
      message: 'Member kicked successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Update member nickname - Owner only
export const updateMemberNickname = async (req, res, next) => {
  try {
    const { serverId, memberId } = req.params;
    const { nickname } = req.body;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({ 
        message: 'Only the server owner can change nicknames' 
      });
    }

    const updatedMember = await prisma.serverMember.update({
      where: { id: memberId },
      data: { 
        nickname: nickname?.trim() || null 
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            password: false
          }
        }
      }
    });

    res.json({ 
      member: updatedMember,
      message: 'Nickname updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
