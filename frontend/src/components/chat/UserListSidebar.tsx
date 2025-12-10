/**
 * 👥 USER LIST SIDEBAR - Right Panel with Online/Offline Status
 * 
 * LEARNING: Real-time Presence Display Component
 * - Shows all members of current server
 * - Green dot = online, Gray dot = offline
 * - Profile images with fallback to initials
 * - Real-time updates via PresenceContext
 * 
 * DISCORD-STYLE: Right sidebar with user cards
 * 
 * ===================================================
 * OOP-INSPIRED SCROLL ISOLATION PATTERN
 * ===================================================
 * 
 * ENCAPSULATION ANALOGY:
 * Think of each component like a Java/C# class:
 * - ChatArea.scrollContainer = private field (only ChatArea can access)
 * - UserListSidebar.scrollContainer = private field (independent from ChatArea)
 * - Both use the same "interface" (flex + overflow pattern) but operate independently
 * 
 * SCROLL CONTAINMENT PATTERN:
 * Outer div: h-screen overflow-hidden flex flex-col
 *   ├─ Header: h-16 flex-shrink-0 (FIXED HEIGHT - 64px)
 *   └─ Scrollable List: flex-1 overflow-y-auto min-h-0
 * 
 * WHY THIS WORKS:
 * 1. h-screen: Sets total height to 100vh (full viewport)
 * 2. overflow-hidden: Prevents THIS component from adding page scroll
 * 3. flex-shrink-0 on header: Header always stays 64px tall
 * 4. flex-1 on list: List takes remaining space (100vh - 64px)
 * 5. min-h-0: Allows flex child to shrink below content size
 * 6. overflow-y-auto: Creates isolated scroll ONLY in this list
 * 
 * RESULT:
 * UserList scrolls members ≠ ChatArea scrolls messages ≠ Page scrolls nothing
 * Each component has its own "private" scroll behavior!
 */

import { useEffect } from 'react';
import { usePresence } from '../../contexts/PresenceContext';
import { User } from '../../types';

/**
 * TYPESCRIPT INTERFACE: Component Props
 * 
 * Defines what data this component expects from parent
 */
interface UserListSidebarProps {
  serverId: string;    // Current server UUID
  members: User[];     // All server members (from API)
}

/**
 * USER LIST SIDEBAR COMPONENT
 * 
 * Displays all users in current server with online/offline status
 * 
 * @param serverId - Current server being viewed
 * @param members - Array of all users in this server
 */
export function UserListSidebar({ serverId, members }: UserListSidebarProps) {
  /**
   * HOOK: usePresence()
   * 
   * Accesses global presence state from PresenceContext
   * 
   * WHAT WE GET:
   * - onlineUsers: Map of currently online users
   * - isUserOnline(): Function to check if user is online
   * - joinServer(): Function to join server presence
   * 
   * HOW IT WORKS:
   * - usePresence() calls useContext(PresenceContext)
   * - Returns value from nearest PresenceProvider ancestor
   * - Component re-renders when presence state changes
   */
  const { onlineUsers, isUserOnline, joinServer } = usePresence();

  // SAFETY: Ensure members is always an array
  const safeMembers = members || [];

  /**
   * EFFECT: Join Server Presence on Mount
   * 
   * HOOK: useEffect()
   * - Runs after component renders
   * - Emits 'join-server' event to backend
   * - Backend adds user to presence map and broadcasts status
   * 
   * DEPENDENCIES: [serverId, joinServer]
   * - Re-runs when serverId changes (user switches servers)
   * - joinServer is memoized with useCallback, so stable reference
   * 
   * WHY THIS PATTERN?
   * - Automatically join presence when component mounts
   * - Automatically switch presence when serverId changes
   * - No manual join button needed
   */
  useEffect(() => {
    console.log(`🔌 Joining presence for server ${serverId}`);
    joinServer(serverId);
    
    // Optional: Add cleanup to leave presence
    // return () => leaveServer(serverId);
  }, [serverId, joinServer]);

  /**
   * RENDER: Sidebar UI
   * 
   * LAYOUT:
   * 1. Header with member count
   * 2. Scrollable user list
   * 3. Each user card shows: avatar, name, status
   */
  return (
    // LEARNING: Full Height Container with Isolated Scroll
    // - h-screen = Full viewport height
    // - overflow-hidden = Prevents this component from causing page scroll
    // - flex flex-col = Stacks header and scrollable list vertically
    <div className="w-64 h-screen bg-white dark:bg-dark-surface border-l border-nature-stone dark:border-dark-border flex flex-col overflow-hidden">
      
      {/* ========================================
          HEADER SECTION
          ======================================== */}
      {/* 
        LEARNING: Fixed Height Header
        - h-16 = Fixed height
        - flex-shrink-0 = Prevents shrinking
      */}
      <div className="h-16 flex-shrink-0 border-b border-nature-stone dark:border-dark-border px-4 flex items-center">
        <h2 className="font-pixel text-sm text-nature-bark dark:text-nature-cream">
          Members — {safeMembers.length}
        </h2>
      </div>

      {/* ========================================
          USER LIST SECTION - SCROLLABLE
          ======================================== */}
      {/* 
        LEARNING: Scrollable Members List
        - flex-1 = Takes remaining height after header
        - overflow-y-auto = Only THIS div scrolls (isolated scroll)
        - min-h-0 = Allows flex item to shrink below content size
        - Scroll only affects user list, not page or chat
      */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        
        {/**
         * ARRAY.MAP: Render Each Member
         * 
         * Loops through members array and creates a card for each user
         * 
         * KEY PROP: Helps React identify which items changed
         * - Use unique ID, not array index
         * - Prevents bugs when list order changes
         */}
        {safeMembers.map(member => {
          /**
           * CHECK ONLINE STATUS
           * 
           * isUserOnline() looks up user in onlineUsers Map
           * - O(1) constant time lookup (fast!)
           * - Returns true/false
           * 
           * WHY .toString()?
           * - member.id might be number from database
           * - onlineUsers Map uses string keys
           * - Ensures type consistency
           */
          const online = isUserOnline(member.id.toString());
          
          return (
            <div 
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-nature-sand dark:hover:bg-dark-elevated transition-colors cursor-pointer"
              title={`${member.username} - ${online ? 'Online' : 'Offline'}`}
            >
              
              {/* ========================================
                  AVATAR WITH STATUS DOT
                  ======================================== */}
              <div className="relative">
                
                {/**
                 * CONDITIONAL RENDERING: Image vs Initials
                 * 
                 * TERNARY OPERATOR: condition ? ifTrue : ifFalse
                 * - If avatarUrl exists, show image
                 * - Otherwise, show initials fallback
                 */}
                {member.avatarUrl ? (
                  // Profile image
                  <img 
                    src={member.avatarUrl} 
                    alt={member.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  // Fallback: Initials in colored circle
                  <div className="w-10 h-10 rounded-full bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-xs">
                    {member.username?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                )}
                
                {/**
                 * STATUS DOT - Absolute Positioning
                 * 
                 * CSS CONCEPTS:
                 * - relative on parent, absolute on child
                 * - bottom-0 right-0 = bottom-right corner
                 * - Conditional color: green (online) or gray (offline)
                 * 
                 * WHY BORDER?
                 * - White border creates separation from avatar
                 * - Makes dot stand out against background
                 */}
                <div 
                  className={`
                    absolute bottom-0 right-0 
                    w-3 h-3 rounded-full 
                    border-2 border-white dark:border-dark-surface
                    ${online ? 'bg-green-500' : 'bg-gray-400'}
                  `}
                  title={online ? 'Online' : 'Offline'}
                />
              </div>

              {/* ========================================
                  USERNAME AND STATUS TEXT
                  ======================================== */}
              <div className="flex-1 min-w-0">
                {/**
                 * USERNAME
                 * 
                 * CONDITIONAL STYLING:
                 * - Online: Bold, full color
                 * - Offline: Semi-transparent, lighter
                 * 
                 * TRUNCATE CLASS:
                 * - Adds ellipsis (...) for long names
                 * - Prevents layout breaking
                 * - min-w-0 allows flex item to shrink below content width
                 */}
                <p className={`
                  text-sm font-sans truncate
                  ${online 
                    ? 'text-nature-bark dark:text-nature-cream font-medium' 
                    : 'text-nature-bark/60 dark:text-nature-stone'
                  }
                `}>
                  {member.username}
                </p>
                
                {/**
                 * STATUS TEXT
                 * 
                 * Shows "Online" or "Offline" below username
                 * - Smaller text (text-xs)
                 * - More transparent than username
                 */}
                <p className="text-xs text-nature-bark/40 dark:text-nature-stone/60">
                  {online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })}

        {/**
         * EMPTY STATE
         * 
         * Shown when members array is empty
         * - Prevents blank screen confusion
         * - Guides user on what to do
         */}
        {safeMembers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm text-nature-bark/60 dark:text-nature-stone font-sans">
              No members yet
            </p>
            <p className="text-xs text-nature-bark/40 dark:text-nature-stone/60 mt-1">
              Invite people to this server!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🎓 KEY LEARNING POINTS:
 * 
 * 1. **useEffect with deps**: Runs when serverId changes
 * 2. **usePresence hook**: Accesses global presence state
 * 3. **Array.map**: Renders list of components
 * 4. **Conditional rendering**: ? : operator for if/else
 * 5. **CSS absolute positioning**: Status dot on avatar
 * 6. **Template literals**: Dynamic classNames with ${}
 * 7. **Key prop**: Helps React identify list items
 * 
 * HOW REAL-TIME WORKS:
 * 1. Component mounts → joinServer(serverId) emitted
 * 2. Backend adds user to presence map
 * 3. Backend broadcasts "user-online" to all in server
 * 4. PresenceContext receives event → updates onlineUsers state
 * 5. This component re-renders (isUserOnline() returns new value)
 * 6. Green/gray dot updates instantly!
 * 
 * PERFORMANCE NOTES:
 * - Map.has() is O(1) - fast lookups
 * - useCallback prevents unnecessary re-renders
 * - React.memo could optimize if needed
 * 
 * USAGE IN PARENT COMPONENT:
 * ```typescript
 * <UserListSidebar 
 *   serverId={selectedServerId} 
 *   members={serverMembers}
 * />
 * ```
 */
