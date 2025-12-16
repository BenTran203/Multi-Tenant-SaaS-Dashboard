

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, LogOut, UserCheck, Search } from 'lucide-react';
import { Server } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ServerDangerZoneProps {
  server: Server;
  isOwner: boolean;
  currentUserId: string;
   onNavigateBack: () => void;
}

/**
 * SERVER DANGER ZONE COMPONENT
 */
export function ServerDangerZone({ server, isOwner, currentUserId }: ServerDangerZoneProps) {
  const navigate = useNavigate();

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * FETCH SERVER MEMBERS
   */
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/servers/${server.id}/members`);
      const memberData = response.data.members || [];
      // Filter out current user
      setMembers(memberData.filter((m: any) => m.user.id !== currentUserId));
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE LEAVE SERVER
   */
  const handleLeaveServer = async () => {
    setLoading(true);
    setError('');

    try {
      await api.delete(`/api/servers/${server.id}/leave`);
      navigate('/chat');
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // If owner tries to leave
      if (errorData?.isOwner) {
        setShowLeaveModal(false);
        if (errorData.hasOtherMembers) {
          // Show transfer ownership modal
          await fetchMembers();
          setShowTransferModal(true);
        } else {
          // No other members - show delete modal
          alert('You are the only member. Please delete the server instead.');
          setShowDeleteModal(true);
        }
      } else {
        setError(errorData?.message || 'Failed to leave server');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE TRANSFER OWNERSHIP
   */
  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!confirm('Are you sure you want to transfer ownership? You will no longer be the owner.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/api/servers/${server.id}/transfer-ownership`, {
        newOwnerId
      });
      
      // After transfer, user can leave
      await api.delete(`/api/servers/${server.id}/leave`);
      navigate('/chat');
    } catch (err: any) {
      console.error('Failed to transfer ownership:', err);
      setError(err.response?.data?.message || 'Failed to transfer ownership');
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE DELETE SERVER
   */
  const handleDeleteServer = async () => {
    if (!confirm(`Are you sure you want to delete "${server.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.delete(`/api/servers/${server.id}`);
      navigate('/chat');
    } catch (err: any) {
      console.error('Failed to delete server:', err);
      setError(err.response?.data?.message || 'Failed to delete server');
    } finally {
      setLoading(false);
    }
  };

  // Filter members by search query
  const filteredMembers = members.filter(m => 
    m.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card p-6 space-y-6 border-2 border-red-200 dark:border-red-800">
      <div>
        <h2 className="text-xl font-pixel text-red-600 dark:text-red-400 mb-2">
          ⚠️ Danger Zone
        </h2>
        <p className="text-sm text-nature-bark/60 dark:text-nature-stone">
          Irreversible and destructive actions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 font-pixel text-sm">{error}</p>
        </div>
      )}

      {/* LEAVE SERVER */}
      <div className="p-4 bg-nature-50 dark:bg-nature-900/20 rounded-xl border border-nature-200 dark:border-nature-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-pixel text-sm text-nature-bark dark:text-nature-cream mb-1">
              Leave Server
            </h3>
            <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
              {isOwner 
                ? 'As the owner, you must transfer ownership or delete the server before leaving.'
                : 'Remove yourself from this server. You can rejoin with the server code.'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} />
            Leave
          </Button>
        </div>
      </div>

      {/* DELETE SERVER (Owner only) */}
      {isOwner && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-pixel text-sm text-red-600 dark:text-red-400 mb-1">
                Delete Server
              </h3>
              <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
                Permanently delete this server and all its data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 border-red-500 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <Trash2 size={18} />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* LEAVE CONFIRMATION MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-md w-full m-4">
            <h2 className="text-xl font-pixel text-gradient-nature mb-4">
              Leave Server?
            </h2>
            <p className="text-nature-bark dark:text-nature-cream mb-6">
              Are you sure you want to leave <strong>{server.name}</strong>?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLeaveModal(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLeaveServer}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {loading ? 'Leaving...' : 'Leave Server'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-md w-full m-4">
            <h2 className="text-xl font-pixel text-red-600 dark:text-red-400 mb-4">
              Delete Server?
            </h2>
            <p className="text-nature-bark dark:text-nature-cream mb-2">
              Are you sure you want to permanently delete <strong>{server.name}</strong>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              This will delete all channels, messages, and member data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteServer}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
          <div className="card max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-pixel text-gradient-nature mb-4">
              Transfer Ownership
            </h2>
            <p className="text-nature-bark dark:text-nature-cream mb-6">
              Choose a new owner for <strong>{server.name}</strong>. You will be downgraded to a regular member.
            </p>

            {/* Search */}
            <div className="mb-4 relative">
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-nature-bark/60 dark:text-nature-stone"
              />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Member List */}
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-center text-nature-bark/60 dark:text-nature-stone py-4">
                  Loading members...
                </p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center text-nature-bark/60 dark:text-nature-stone py-4">
                  No members found
                </p>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-3 bg-nature-100 dark:bg-nature-900/30 rounded-xl hover:bg-nature-200 dark:hover:bg-nature-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-grass-100 dark:bg-grass-900/30 flex items-center justify-center text-grass-600 dark:text-grass-400 font-pixel text-sm">
                        {member.user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-pixel text-sm text-nature-bark dark:text-nature-cream">
                          {member.user.username}
                        </p>
                        <p className="text-xs text-nature-bark/60 dark:text-nature-stone">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleTransferOwnership(member.user.id)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <UserCheck size={16} />
                      Transfer
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowTransferModal(false)}
              disabled={loading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

