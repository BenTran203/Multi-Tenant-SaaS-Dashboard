import { prisma } from "../config/database.js";

/**
 * Get Current User Profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Failed to get profile",
      details: error.message,
    });
  }
};

/**
 * Update User Profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, bio, avatarUrl } = req.body;
    const userId = req.user.id;

   
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Check if username is taken (if changing username)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }, 
        },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Username is already taken",
        });
      }
    }

    // Check if email is taken (if changing email)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }, // Exclude current user
        },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Email is already taken",
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Failed to update profile",
      details: error.message,
    });
  }
};

/**
 * Delete User Account
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user owns any servers
    const ownedServers = await prisma.server.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true },
    });

    if (ownedServers.length > 0) {
      return res.status(400).json({
        error: "Cannot delete account while owning servers",
        errorType: "OWNS_SERVERS",
        ownedServers: ownedServers,
        message: "Please transfer ownership or delete your servers before deleting your account",
      });
    }

    //Delete user (messages will remain with userId reference)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error('Unable to delete account:', error);
    res.status(500).json({
      error: "Failed to delete account",
      details: error.message,
    });
  }
};
