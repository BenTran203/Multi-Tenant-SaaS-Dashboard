/**
 * 👥 PRESENCE CONTEXT - User Online/Offline Status (main branch - Server-Specific)
 * 
 * LEARNING: React Context for Global Presence State
 * - Tracks which users are online in the CURRENT server
 * - Uses Socket.io for real-time updates
 * - Explicit join-server event when switching servers
 * 
 * PATTERN: Context + Socket.io Listeners
 * 1. Create Context → 2. Create Provider → 3. Use Hook in Components
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socket } from '../services/socket';

/**
 * TYPESCRIPT INTERFACE: Online User Data
 * 
 * Stores minimal info about online users
 */
export interface OnlineUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

/**
 * TYPESCRIPT INTERFACE: Context Value Shape
 * 
 * Defines what data and functions this context provides
 */
interface PresenceContextType {
  onlineUsers: Map<string, OnlineUser>; // Fast lookup: Map<userId, OnlineUser>
  isUserOnline: (userId: string) => boolean; // Check if user is online
  joinServer: (serverId: string) => void; // Manually join server presence (UUID)
  leaveServer: (serverId: string) => void; // Optional: leave server presence (UUID)
}

/**
 * CREATE CONTEXT
 * 
 * HOOK: createContext()
 * - Creates a container for global state
 * - Initial value is undefined (will be set by Provider)
 */
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

/**
 * CUSTOM HOOK: usePresence()
 * 
 * HOOK: useContext()
 * - Reads value from nearest PresenceContext.Provider ancestor
 * - Simplifies usage: usePresence() instead of useContext(PresenceContext)
 * 
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
 * 
 * Wraps app and provides presence state to all children
 * 
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
   * 
   * WHY MAP?: Faster than Array.find() for checking online status
   */
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());

  /**
   * EFFECT: Socket.io Event Listeners
   * 
   * HOOK: useEffect()
   * - Runs after component renders (side effect)
   * - Sets up Socket.io listeners for presence events
   * - Cleanup function removes listeners on unmount
   * - Empty deps [] = runs once on mount
   * 
   * EVENTS HANDLED:
   * - presence-update: Initial list of online users (on join-server)
   * - user-online: Someone came online
   * - user-offline: Someone went offline
   */
  useEffect(() => {
    /**
     * EVENT: presence-update
     * Received when joining a server (full list of online users)
     */
    socket.on('presence-update', ({ onlineUsers: userIds }: { onlineUsers: string[] }) => {
      console.log('📋 Presence update - Online users:', userIds.length);
      // Note: We'll populate full user details from user-online events
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
        const updated = new Map(prev); // Create new Map (immutable update)
        updated.set(user.userId, user); // Add/update user
        return updated; // React detects new reference, triggers re-render
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
     * 
     * Runs before component unmounts or before effect re-runs
     * 
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
   * HOOK: useCallback()
   * - Memoizes function to prevent re-creating on every render
   * - Returns same function reference unless deps change
   * - Prevents unnecessary child component re-renders
   * 
   * @param serverId - Server UUID to join presence for
   * 
   * WHY USECALLBACK?: If we pass this to child components,
   * they won't re-render unless the function actually changes
   */
  const joinServer = useCallback((serverId: string) => {
    console.log(`📥 Joining server presence: ${serverId}`);
    socket.emit('join-server', { serverId });
  }, []); // No deps = function never changes

  /**
   * FUNCTION: Leave Server Presence (Optional)
   * 
   * Currently unused - users stay in presence until disconnect
   * Could emit 'leave-server' event if you implement it in backend
   */
  const leaveServer = useCallback((serverId: string) => {
    console.log(`📤 Leaving server presence: ${serverId}`);
    // Optional: socket.emit('leave-server', { serverId });
  }, []);

  /**
   * FUNCTION: Check if User is Online
   * 
   * Fast O(1) lookup using Map.has()
   * 
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
   * 
   * VALUE: Object with all context data/functions
   * - Any child can access via usePresence() hook
   * - Re-renders children when value changes
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

/**
 * 🎓 KEY LEARNING POINTS:
 * 
 * 1. **useState**: Manages onlineUsers Map, triggers re-renders
 * 2. **useEffect**: Sets up Socket.io listeners, cleans up on unmount
 * 3. **useContext**: Reads context value in child components
 * 4. **useCallback**: Memoizes functions to prevent re-renders
 * 5. **Map vs Array**: Map is faster for checking online status
 * 6. **Immutable Updates**: new Map(prev) creates new reference
 * 7. **Cleanup**: socket.off() prevents memory leaks
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * function UserList() {
 *   const { isUserOnline, joinServer } = usePresence();
 *   
 *   useEffect(() => {
 *     joinServer(123); // Join server presence on mount
 *   }, []);
 *   
 *   return (
 *     <div>
 *       User is {isUserOnline('user-id') ? 'online' : 'offline'}
 *     </div>
 *   );
 * }
 * ```
 */
