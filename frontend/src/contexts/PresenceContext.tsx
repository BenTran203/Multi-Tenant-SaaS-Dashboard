/**
 * 👥 PRESENCE CONTEXT - User Online/Offline Status (main branch - Server-Specific)
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socket } from '../services/socket';
export interface OnlineUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

/**
 * TYPESCRIPT INTERFACE: Context Value Shape
 */
interface PresenceContextType {
  onlineUsers: Map<string, OnlineUser>; 
  isUserOnline: (userId: string) => boolean;
  joinServer: (serverId: string) => void; 
  leaveServer: (serverId: string) => void; 
}

/**
 * CREATE CONTEXT
 */
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

/**
 * @returns Presence context value (onlineUsers, isUserOnline, etc.)
 * @throws Error if used outside PresenceProvider
 */
export function usePresence() {
  const context = useContext(PresenceContext);
  
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  
  return context;
}

/**
 * PRESENCE PROVIDER COMPONENT
 * @param children - All app components that need presence access
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  /**
   * STATE: Online Users Map
   * 
   * HOOK: useState()
   * - Creates state variable that persists between renders
   * - Map<userId, OnlineUser> for O(1) lookup performance
   * - setOnlineUsers() triggers re-render when presence changes
   */
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());

  /**
   * EFFECT: Socket.io Event Listeners
   */
  useEffect(() => {
    socket.on('presence-update', ({ onlineUsers: userIds }: { onlineUsers: string[] }) => {
      console.log('📋 Presence update - Online users:', userIds);
      
      // Clear existing online users and populate with current list
      setOnlineUsers(() => {
        const updated = new Map<string, OnlineUser>();
        userIds.forEach(userId => {
          // Add user ID (username will be empty until user-online event)
          updated.set(userId, { 
            userId, 
            username: userId, // Fallback to userId until we get username
            avatarUrl: undefined 
          });
        });
        console.log(`✅ Populated ${updated.size} online users`);
        return updated;
      });
    });

    /**
     * EVENT: user-online
     * Someone connected to the server
     * 
     * HOOK: useState setter with function
     * - prev => newValue pattern ensures we have latest state
     * - Creates new Map (immutability) to trigger re-render
     */
    socket.on('user-online', (user: OnlineUser) => {
      console.log('🟢 User came online:', user.username);
      
      setOnlineUsers(prev => {
        const updated = new Map(prev); 
        updated.set(user.userId, user); 
        return updated; 
      });
    });

    /**
     * EVENT: user-offline
     * Someone disconnected from the server
     */
    socket.on('user-offline', ({ userId }: { userId: string }) => {
      console.log('🔴 User went offline:', userId);
      
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.delete(userId); // Remove user
        return updated;
      });
    });

    /**
     * CLEANUP FUNCTION
     * WHY CLEANUP?: Prevents memory leaks
     * - Without cleanup, listeners stack up on re-renders
     * - One message = 10 copies received!
     */
    return () => {
      socket.off('presence-update');
      socket.off('user-online');
      socket.off('user-offline');
      console.log('🧹 Cleaned up presence listeners');
    };
  }, []); // Empty deps = run once on mount, cleanup on unmount

  /**
   * FUNCTION: Join Server Presence
   * 
   * @param serverId - Server UUID to join presence for
   */
  const joinServer = useCallback((serverId: string) => {
    console.log(`📥 Joining server presence: ${serverId}`);
    socket.emit('join-server', { serverId });
  }, []); // No deps = function never changes

  /**
   * FUNCTION: Leave Server Presence (Optional)
   */
  const leaveServer = useCallback((serverId: string) => {
    console.log(`📤 Leaving server presence: ${serverId}`);
    // Optional: socket.emit('leave-server', { serverId });
  }, []);

  /**
   * @param userId - User ID to check
   * @returns true if user is in onlineUsers Map
   */
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]); // Re-create when onlineUsers changes

  /**
   * CONTEXT PROVIDER
   * 
   * Makes presence state available to all children
   */
  return (
    <PresenceContext.Provider 
      value={{ 
        onlineUsers, 
        isUserOnline, 
        joinServer, 
        leaveServer 
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
