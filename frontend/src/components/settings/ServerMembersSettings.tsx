/**
 * 👥 SERVER MEMBERS SETTINGS COMPONENT
 * 
 * LEARNING: Member Management
 * - Display all server members
 * - Kick members (owner only)
 * - Change member nicknames (owner only)
 * - Shows member roles (Owner vs Member)
 */

import { useState, useEffect } from 'react';
import { Crown, UserX, Edit2, Check, X } from 'lucide-react';
import { api } from '../../services/api';
interface ServerMember {
  id: string;
  userId: string;
  serverId: string;
  nickname: string | null;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ServerMembersSettingsProps {
  serverId: string;
}

/**
 * SERVER MEMBERS SETTINGS COMPONENT
 */
export function ServerMembersSettings({ serverId }: ServerMembersSettingsProps) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track which member is being edited
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');

  /**
   * FETCH MEMBERS ON MOUNT
   */
  useEffect(() => {
    fetchMembers();
    fetchServerOwner();
  }, [serverId]);

  /**
   * FETCH SERVER MEMBERS
   * Backend endpoint: GET /api/servers/:serverId/members
   */
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/servers/${serverId}/members`);
      setMembers(response.data.members || response.data);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH SERVER OWNER ID
   * Backend endpoint: GET /api/servers/:serverId
   */
  const fetchServerOwner = async () => {
    try {
      const response = await api.get(`/api/servers/${serverId}`);
      const serverData = response.data.server || response.data;
      setOwnerId(serverData.ownerId);
    } catch (err) {
      console.error('Failed to fetch server owner:', err);
    }
  };

  /**
   * KICK MEMBER
   * Backend endpoint: DELETE /api/servers/:serverId/members/:memberId
   */
  const handleKickMember = async (memberId: string, username: string) => {
    if (!confirm(`Are you sure you want to kick ${username} from the server?`)) {
      return;
    }

    try {
      await api.delete(`/api/servers/${serverId}/members/${memberId}`);
      
      // Remove from local state
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      console.error('Failed to kick member:', err);
      alert(err.response?.data?.message || 'Failed to kick member');
    }
  };

  /**
   * START EDITING NICKNAME
   */
  const startEditNickname = (member: ServerMember) => {
    setEditingMemberId(member.id);
    setEditNickname(member.nickname || member.user.username);
  };

  /**
   * SAVE NICKNAME
   * Backend endpoint: PATCH /api/servers/:serverId/members/:memberId/nickname
   */
  const handleSaveNickname = async (memberId: string) => {
    try {
      const response = await api.patch(
        `/api/servers/${serverId}/members/${memberId}/nickname`,
        { nickname: editNickname.trim() || null }
      );

      const updatedMember = response.data.member || response.data;
      
      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? updatedMember : m))
      );

      // Reset edit state
      setEditingMemberId(null);
      setEditNickname('');
    } catch (err: any) {
      console.error('Failed to update nickname:', err);
      alert(err.response?.data?.message || 'Failed to update nickname');
    }
  };

  /**
   * CANCEL EDITING
   */
  const cancelEditNickname = () => {
    setEditingMemberId(null);
    setEditNickname('');
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <div className="animate-bounce-gentle text-4xl mb-2">👥</div>
          <p className="font-pixel text-sm text-grass-600 dark:text-grass-400">
            Loading members...
          </p>
        </div>
      </div>
    );
  }

  /**
   * ERROR STATE
   */
  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-600 dark:text-red-400 font-pixel text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-pixel text-gradient-nature mb-2">
          Member Management
        </h2>
        <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
          {members.length} {members.length === 1 ? 'member' : 'members'} in this server
        </p>
      </div>

      {/* MEMBERS LIST */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-nature-bark/60 dark:text-nature-stone">
              No members found
            </p>
          </div>
        ) : (
          members.map((member) => {
            const isOwner = member.userId === ownerId;
            const isEditing = editingMemberId === member.id;
            const displayName = member.nickname || member.user.username;

            return (
              <div
                key={member.id}
                className="p-4 bg-nature-100 dark:bg-nature-900/30 rounded-2xl hover:bg-nature-200 dark:hover:bg-nature-900/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* MEMBER INFO */}
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-sm">
                      {member.user.username.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name & Role */}
                    <div className="flex-1">
                      {isEditing ? (
                        // EDITING NICKNAME
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="input-field flex-1"
                            placeholder={member.user.username}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNickname(member.id)}
                            className="p-2 bg-grass-500 text-white rounded-xl hover:bg-grass-600 transition-colors"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditNickname}
                            className="p-2 bg-nature-300 dark:bg-nature-700 text-nature-bark dark:text-nature-cream rounded-xl hover:bg-nature-400 dark:hover:bg-nature-600 transition-colors"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <h3 className="font-pixel text-sm text-nature-bark dark:text-nature-cream">
                              {displayName}
                            </h3>
                            {isOwner && (
                              <span title="Server Owner">
                                <Crown size={16} className="text-grass-600 dark:text-grass-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
                            @{member.user.username}
                            {member.nickname && ' (Custom nickname)'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS (only show for non-owners) */}
                  {!isOwner && !isEditing && (
                    <div className="flex items-center gap-2">
                      {/* EDIT NICKNAME */}
                      <button
                        onClick={() => startEditNickname(member)}
                        className="p-2 bg-oak-100 dark:bg-oak-900/30 text-oak-700 dark:text-oak-300 rounded-xl hover:bg-oak-200 dark:hover:bg-oak-900/50 transition-colors"
                        title="Edit Nickname"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* KICK MEMBER */}
                      <button
                        onClick={() => handleKickMember(member.id, displayName)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Kick Member"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

