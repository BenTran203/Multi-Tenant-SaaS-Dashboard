/**
 * ============================================================================
 * SERVER CONTROLLER
 * ============================================================================
 *
 */
import { prisma } from "../config/database.js";
import { generateUniqueServerCode } from "../utils/serverCodeGenerator.js";

// Create Server
export const createServer = async (req, res) => {
  try {
    const { name, icon, theme } = req.body;
    const userId = req.user.id;

    const serverCode = await generateUniqueServerCode();

    const server = await prisma.server.create({
      data: {
        name,
        iconUrl: icon,
        ownerId: userId,
        theme: theme || "nature",
        serverCode,
        codeGeneratedAt: new Date(),
        members: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
        channels: {
          create: {
            name: "general",
            type: "TEXT",
            position: 0,
          },
        },
      },
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

// Get server users
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

// Get servert Id
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

// Join server by code (NEW: uses serverCode instead of inviteCode)
export const joinServer = async (req, res, next) => {
  try {
    const { serverCode } = req.body;
    const userId = req.user.id;

    // Validate server code format
    if (!serverCode || serverCode.trim().length !== 8) {
      return res.status(400).json({
        message: "Server code must be exactly 8 characters",
      });
    }

    // 1. Find Server by code
    const server = await prisma.server.findUnique({
      where: { serverCode: serverCode.toUpperCase() },
    });

    if (!server) {
      return res.status(404).json({
        message: "Server not found with this code",
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
        message: "You are already a member of this server",
      });
    }

    // 3. Add Member
    const membership = await prisma.serverMember.create({
      data: {
        userId: userId,
        serverId: server.id,
        role: "MEMBER",
      },
    });

    res.json({
      message: "Successfully joined server",
      server,
      membership,
    });
  } catch (error) {
    next(error);
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

// Get a members of a server
export const getServerMember = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id;

    //Find 1 member
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

    //Find All members
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
      count: members.length,
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
      where: { id: serverId },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can kick members",
      });
    }

    const member = await prisma.serverMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (member.userId === server.ownerId) {
      return res.status(400).json({
        message: "Cannot kick the server owner",
      });
    }

    await prisma.serverMember.delete({
      where: { id: memberId },
    });

    res.json({
      message: "Member kicked successfully",
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
      where: { id: serverId },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner can change nicknames",
      });
    }

    const updatedMember = await prisma.serverMember.update({
      where: { id: memberId },
      data: {
        nickname: nickname?.trim() || null,
      },
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
    });

    res.json({
      member: updatedMember,
      message: "Nickname updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

//Leave server
export const leaveServer = async (req, res, next) => {
  try {
    const { id: serverId } = req.params;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { members: true },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    if (server.ownerId === userId) {
      return res.status(400).json({
        message: "Cannot leave server: you are the owner",
        isOwner: true,
        hasOtherMembers: server.members.length > 1,
      });
    }

    await prisma.serverMember.delete({
      where: {
        userId_serverId: { userId, serverId },
      },
    });

    res.json({ message: "Successfully left the server" });
  } catch (error) {
    next(error);
  }
};

//Transfer ownership
export const transferOwnership = async (req, res, next) => {
  try {
    const { id: serverId } = req.params;
    const { newOwnerId } = req.body;
    const userId = req.user.id;
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({
        message: "Only the server owner is allowed to transfer ownership",
      });
    }

    const newOwnerMemberShip = await prisma.serverMember.findUnique({
      where: {
        userId_serverId: { userId: newOwnerId, serverId },
      },
    });

    if (!newOwnerMemberShip) {
      return res
        .status(400)
        .json({ message: "New owner must be a member of this server" });
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: { ownerId: newOwnerId },
    });
    res.json({
      server: updatedServer,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    next(error);
  }
};

//Regenerate server code
export const regenerateServerCode = async (req, res, next) => {
  try {
    const { id: serverId } = req.params;
    const userId = req.user.id;

    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.ownerId !== userId) {
      return res.status(403).json({ message: 'Only the server owner can regenerate the code' });
    }

    const newCode = await generateUniqueServerCode();

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        serverCode: newCode,
        codeGeneratedAt: new Date()
      }
    });

    res.json({ 
      server: updatedServer,
      serverCode: newCode
    });
  } catch (error) {
    next(error);
  }
};