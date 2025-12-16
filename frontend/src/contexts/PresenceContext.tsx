/**
 * 👥 PRESENCE CONTEXT - User Online/Offline Status (production branch - Global Presence)
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

/**
 * TYPESCRIPT INTERFACE: Online User Data
 */
export interface OnlineUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}


interface PresenceContextType {
  onlineUsers: Map<string, OnlineUser>;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

/**
 * CUSTOM HOOK: usePresence()
 */
export function usePresence() {
  const context = useContext(PresenceContext);
  
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  
  return context;
}

/**
 * PRESENCE PROVIDER COMPONENT - Global Presence Version
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());

  useEffect(() => {
    // ============================================
    // ADD CURRENT USER TO ONLINE USERS ON CONNECT
    // ============================================
    const handleConnect = () => {
      if (user) {
        console.log('🟢 Adding self to online users:', user.username);
        
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(user.id, {
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
          });
          return updated;
        });
      }
    };

    // Listen for socket connection/reconnection
    socket.on('connect', handleConnect);
    
    // If already connected and user exists, add self immediately
    if (socket.connected && user) {
      handleConnect();
    }

    socket.on('user-online', (onlineUser: OnlineUser) => {
      console.log('🟢 User came online globally:', onlineUser.username);
      
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.set(onlineUser.userId, onlineUser);
        return updated;
      });
    });

    socket.on('user-offline', ({ userId }: { userId: string }) => {
      console.log('🔴 User went offline globally:', userId);
      
      setOnlineUsers(prev => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });
    });

    /**
     * CLEANUP FUNCTION
     * Same importance as main branch - prevents memory leaks
     */
    return () => {
      socket.off('connect', handleConnect);
      socket.off('user-online');
      socket.off('user-offline');
      console.log('🧹 Cleaned up global presence listeners');
    };
  }, [user]); // Re-run when user changes

  /**
   * FUNCTION: Check if User is Online
   */
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  /**
   * CONTEXT PROVIDER

   */
  return (
    <PresenceContext.Provider 
      value={{ 
        onlineUsers, 
        isUserOnline,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

/**
 * 🎓 KEY DIFFERENCES FROM MAIN BRANCH:
 * 
 * MAIN BRANCH:
 * ✅ Explicit joinServer(serverId) call
 * ✅ User online only in viewed server
 * ✅ Lower resource usage
 * ✅ Simpler to understand
 * 
 * PRODUCTION BRANCH (This File):
 * ✅ Automatic presence in all servers
 * ✅ Better UX (Discord-like)
 * ✅ More realistic for production apps
 * ✅ No manual presence management
 * 
 * BACKEND REQUIREMENTS:
 * - Auto-join all server rooms on connection
 * - Broadcast to ALL rooms on connect/disconnect
 * - No 'join-server' event handler needed
 * 
 * USAGE IN COMPONENT:
 * ```typescript
 * function UserList() {
 *   const { isUserOnline } = usePresence();
 *   
 *   // No useEffect to join server needed!
 *   // User is automatically online in all servers
 *   
 *   return (
 *     <div>
 *       User is {isUserOnline('user-id') ? 'online' : 'offline'}
 *     </div>
 *   );
 * }
 * ```
 * 
 * COMPONENT CHANGES:
 * - UserListSidebar: Remove joinServer() useEffect
 * - Just render based on isUserOnline() checks
 */
