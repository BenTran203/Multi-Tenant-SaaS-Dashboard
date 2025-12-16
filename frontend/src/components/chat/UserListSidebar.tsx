
import { useState } from "react";
import { usePresence } from "../../contexts/PresenceContext";
import { User } from "../../types";
import { UserProfileCard } from "../ui/UserProfileCard";

interface UserListSidebarProps {
  serverId: string; // Current server UUID (kept for future use)
  members: User[]; // All server members (from API)
}

/**
 * USER LIST SIDEBAR COMPONENT
 * @param serverId - Current server being viewed
 * @param members - Array of all users in this server
 */
export function UserListSidebar({ serverId, members }: UserListSidebarProps) {
  const { isUserOnline } = usePresence();

  // SAFETY: Ensure members is always an array
  const safeMembers = members || [];

  // STATE: Hover profile card
  const [hoveredUser, setHoveredUser] = useState<{
    user: User;
    position: { x: number; y: number };
  } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, user: User) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredUser({
      user,
      position: {
        x: rect.left - 320,
        y: rect.top,
      },
    });
  };

  const handleMouseLeave = () => {
    setHoveredUser(null);
  };

  // ✅ GLOBAL PRESENCE: No need to manually join server
  // User is automatically online in all their servers (Discord-style)

  return (
    <div className="w-64 h-screen bg-theme-surface dark:bg-theme-dark-surface border-l border-theme-primary/20 dark:border-theme-primary/30 flex flex-col overflow-hidden">
      {/* ========================================
          HEADER SECTION
          ======================================== 
      */}
      <div className="h-16 flex-shrink-0 border-b border-nature-stone dark:border-dark-border px-4 flex items-center">
        <h2 className="font-pixel text-sm text-nature-bark dark:text-nature-cream">
          Members — {safeMembers.length}
        </h2>
      </div>

      {/* ========================================
          USER LIST SECTION - SCROLLABLE
          ======================================== */}

      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        {safeMembers.map((member) => {
          const online = isUserOnline(member.id.toString());

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-nature-sand dark:hover:bg-dark-elevated transition-colors cursor-pointer"
              title={`${member.username} - ${online ? "Online" : "Offline"}`}
              onMouseEnter={(e) => handleMouseEnter(e, member)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative">
                {member.avatarUrl ? (
                  // Profile image
                  <img
                    src={member.avatarUrl}
                    alt={member.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  // Fallback: Initials in colored circle
                  <div className="w-10 h-10 rounded-full bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-xs">
                    {member.username?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}

                {/**
                 * STATUS DOT - Absolute Positioning

                 */}
                <div
                  className={`
                    absolute bottom-0 right-0 
                    w-3 h-3 rounded-full 
                    border-2 border-white dark:border-dark-surface
                    ${online ? "bg-green-500" : "bg-gray-400"}
                  `}
                  title={online ? "Online" : "Offline"}
                />
              </div>

              {/* ========================================
                  USERNAME AND STATUS TEXT
                  ======================================== */}
              <div className="flex-1 min-w-0">
                <p
                  className={`
                  text-sm font-sans truncate
                  ${
                    online
                      ? "text-nature-bark dark:text-nature-cream font-medium"
                      : "text-nature-bark/60 dark:text-nature-stone"
                  }
                `}
                >
                  {member.username}
                </p>

                <p className="text-xs text-nature-bark/40 dark:text-nature-stone/60">
                  {online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          );
        })}

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

      {/* HOVER PROFILE CARD */}
      {hoveredUser && (
        <UserProfileCard
          user={hoveredUser.user}
          joinedAt={hoveredUser.user.joinedAt}
          position={hoveredUser.position}
        />
      )}
    </div>
  );
}
