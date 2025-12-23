import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ArrowLeft, User, Mail, Calendar, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load user profile on mount
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // LEARNING: Call the backend profile update endpoint
      // Only send fields that have values (partial update)
      const updateData: any = {};
      if (username && username !== user?.username) updateData.username = username;
      if (email && email !== user?.email) updateData.email = email;
      if (bio !== (user?.bio || '')) updateData.bio = bio;
      if (avatarUrl !== (user?.avatarUrl || '')) updateData.avatarUrl = avatarUrl;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save');
        setSaving(false);
        return;
      }

      const response = await api.put('/api/users/me', updateData);
      
      // LEARNING: Update the user in AuthContext state + localStorage
      updateUser(response.data.user);
      
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      // LEARNING: Handle validation errors from backend
      if (err.response?.data?.errors) {
        // express-validator errors
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        setError(errorMessages);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');

    try {
      await api.delete('/api/users/me');
      
      // Account deleted successfully - logout and redirect
      logout();
      navigate('/register', { 
        state: { 
          message: 'Account deleted successfully. You can create a new account.' 
        } 
      });
    } catch (err: any) {
      if (err.response?.data?.errorType === 'OWNS_SERVERS') {
        setDeleteError(
          err.response.data.message + '. Servers: ' + 
          err.response.data.ownedServers.map((s: any) => s.name).join(', ')
        );
      } else {
        setDeleteError(
          err.response?.data?.error || 'Failed to delete account. Please try again.'
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-50 dark:bg-nature-900 transition-colors duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-dark-surface border-b border-nature-stone dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-nature-600 dark:text-nature-400 hover:text-grass-600 dark:hover:text-grass-400 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-pixel">Back to Chat</span>
          </button>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={logout}
              className="font-pixel"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Banner */}
        <Card className="relative overflow-hidden">
          {/* Banner Background */}
          <div className="h-32 bg-gradient-to-r from-grass-400 to-grass-600 dark:from-grass-600 dark:to-grass-800"></div>
          
          {/* Avatar Section */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-white dark:bg-dark-surface border-4 border-white dark:border-dark-surface flex items-center justify-center text-4xl font-pixel text-grass-600 dark:text-grass-400 shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    user?.username.slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 mt-4">
                <h1 className="text-3xl font-pixel text-grass-800 dark:text-grass-100 mb-1">
                  {user?.username}
                </h1>
                <p className="text-nature-600 dark:text-nature-400 flex items-center gap-2">
                  <Mail size={16} />
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Join Date */}
            <div className="mt-4 flex items-center gap-2 text-sm text-nature-500 dark:text-nature-400">
              <Calendar size={16} />
              <span>Joined {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}</span>
            </div>
          </div>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <h2 className="text-xl font-pixel text-grass-800 dark:text-grass-100 mb-6 flex items-center gap-2">
            <User size={20} />
            Edit Profile
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-grass-50 dark:bg-grass-900/20 border border-grass-200 dark:border-grass-800 rounded-lg text-sm text-grass-600 dark:text-grass-400">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              disabled={saving}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={saving}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-nature-bark dark:text-nature-cream">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                disabled={saving}
                rows={4}
                className="w-full px-4 py-3 bg-nature-cream dark:bg-dark-bg border-2 border-nature-stone dark:border-dark-border rounded-xl text-nature-bark dark:text-nature-cream placeholder:text-nature-stone dark:placeholder:text-nature-stone focus:border-grass-500 dark:focus:border-grass-400 focus:ring-4 focus:ring-grass-100 dark:focus:ring-grass-900/30 transition-all outline-none disabled:opacity-50"
              />
            </div>

            <Input
              label="Avatar URL"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              disabled={saving}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="w-full"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Account Actions */}
        <Card>
          <h2 className="text-xl font-pixel text-grass-800 dark:text-grass-100 mb-4">
            Account Settings
          </h2>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Change Password
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full animate-pop-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
              </div>
              <h2 className="text-2xl font-pixel text-red-600 dark:text-red-400 mb-2">
                Delete Account?
              </h2>
              <p className="text-nature-bark dark:text-nature-stone text-sm">
                This action cannot be undone.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                ⚠️ Before deleting:
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Make sure you transfer ownership of your servers to other members, or delete the servers first.
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl animate-wiggle">
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleting}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
