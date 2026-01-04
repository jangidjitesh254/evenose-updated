import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail,
  UserPlus,
  Trash2,
  Shield,
  X,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Check,
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function CoordinatorsManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hackathon, setHackathon] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Multiple selection states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Permissions states
  const [permissions, setPermissions] = useState({
    canViewTeams: true,
    canCheckIn: true,
    canAssignTables: false,
    canViewSubmissions: true,
    canEliminateTeams: false,
    canCommunicate: true,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, coordinatorsRes] = await Promise.all([
        hackathonAPI.getById(id),
        hackathonAPI.getCoordinators(id),
      ]);
      
      setHackathon(hackathonRes.data.hackathon);
      setCoordinators(coordinatorsRes.data.coordinators);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load coordinators');
    } finally {
      setLoading(false);
    }
  };

  // Search users with debounce
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await hackathonAPI.searchCoordinators(id, query);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Toggle user selection
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Check if user is selected
  const isUserSelected = (userId) => {
    return selectedUsers.some((u) => u._id === userId);
  };

  // Remove selected user
  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Invite selected users
  const handleInviteSelected = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to invite');
      return;
    }

    try {
      setInviting(true);

      // Send invitations for all selected users
      const promises = selectedUsers.map((user) =>
        hackathonAPI.inviteCoordinator(id, {
          emailOrUsername: user.email,
          permissions,
        })
      );

      await Promise.all(promises);

      toast.success(`Successfully invited ${selectedUsers.length} coordinator(s)!`, {
        duration: 4000,
        icon: '🎉',
      });

      // Clear selections and refresh
      clearAllSelections();
      setShowInviteForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to invite coordinators:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCoordinator = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this coordinator?')) {
      return;
    }

    try {
      await hackathonAPI.removeCoordinator(id, userId);
      toast.success('Coordinator removed successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to remove coordinator:', error);
      toast.error(error.response?.data?.message || 'Failed to remove coordinator');
    }
  };

  const handleCancelInvite = async (userId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await hackathonAPI.cancelCoordinatorInvite(id, userId);
      toast.success('Invitation cancelled');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvite = async (userId) => {
    try {
      await hackathonAPI.resendCoordinatorInvite(id, userId);
      toast.success('Invitation resent successfully');
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to resend invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coordinators...</p>
        </div>
      </div>
    );
  }

  const activeCoordinators = coordinators.filter((c) => c.status === 'accepted');
  const pendingInvitations = coordinators.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Coordinators</h1>
          <p className="text-gray-600">{hackathon?.title}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{activeCoordinators.length}</div>
                <div className="text-sm text-gray-600">Active Coordinators</div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{pendingInvitations.length}</div>
                <div className="text-sm text-gray-600">Pending Invitations</div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{selectedUsers.length}</div>
                <div className="text-sm text-gray-600">Users Selected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-indigo-600" />
              Invite Coordinators
            </h2>
            {selectedUsers.length > 0 && (
              <Button onClick={clearAllSelections} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Clear Selection ({selectedUsers.length})
              </Button>
            )}
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username, email, or name..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
                >
                  {searchResults.map((user) => {
                    const selected = isUserSelected(user._id);
                    const isParticipant = user.isParticipant;
                    const isCoordinator = user.isCoordinator;
                    const isPending = user.isPendingCoordinator;
                    const disabled = isParticipant || isCoordinator || isPending;

                    return (
                      <div
                        key={user._id}
                        onClick={() => !disabled && toggleUserSelection(user)}
                        className={`p-4 border-b border-gray-100 last:border-0 transition-all ${
                          disabled
                            ? 'bg-gray-50 cursor-not-allowed opacity-60'
                            : 'hover:bg-indigo-50 cursor-pointer'
                        } ${selected ? 'bg-indigo-100' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Checkbox */}
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                disabled
                                  ? 'border-gray-300 bg-gray-100'
                                  : selected
                                  ? 'border-indigo-600 bg-indigo-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{user.fullName}</div>
                              <div className="text-sm text-gray-600">@{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex gap-2">
                              {isParticipant && (
                                <Badge variant="error">
                                  🔴 Participant
                                  {user.teamName && ` (${user.teamName})`}
                                </Badge>
                              )}
                              {isCoordinator && (
                                <Badge variant="success">🟢 Coordinator</Badge>
                              )}
                              {isPending && (
                                <Badge variant="warning">🟡 Pending Invite</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Helper Text */}
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-sm text-gray-500 mt-2">Type at least 2 characters to search</p>
            )}

            {/* Participant Warning */}
            {searchResults.some((u) => u.isParticipant) && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Users marked as participants cannot be invited as coordinators.
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      They must leave their team first before accepting a coordinator role.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Users ({selectedUsers.length})
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <button
                      onClick={() => removeSelectedUser(user._id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {selectedUsers.length > 0 && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Set Permissions for Selected Users
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(permissions).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setPermissions({ ...permissions, [key]: e.target.checked })
                        }
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Invite Button */}
              <Button
                onClick={handleInviteSelected}
                disabled={inviting}
                className="w-full"
                icon={inviting ? null : UserPlus}
              >
                {inviting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending Invitations...
                  </div>
                ) : (
                  `Invite ${selectedUsers.length} Coordinator${selectedUsers.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
        </div>

        {/* Active Coordinators */}
        {activeCoordinators.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Active Coordinators ({activeCoordinators.length})
            </h2>
            <div className="space-y-4">
              {activeCoordinators.map((coord) => (
                <div
                  key={coord.user._id}
                  className="p-4 border-2 border-gray-200 rounded-2xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">
                        {coord.user.fullName}
                      </div>
                      <div className="text-sm text-gray-600">{coord.user.email}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {Object.entries(coord.permissions || {})
                          .filter(([_, value]) => value)
                          .map(([key]) => (
                            <Badge key={key} variant="info">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveCoordinator(coord.user._id)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="space-y-4">
              {pendingInvitations.map((coord) => (
                <div
                  key={coord.user._id}
                  className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">
                        {coord.user.fullName}
                      </div>
                      <div className="text-sm text-gray-600">{coord.user.email}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Invited: {new Date(coord.invitedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResendInvite(coord.user._id)}
                        variant="outline"
                        size="sm"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend
                      </Button>
                      <Button
                        onClick={() => handleCancelInvite(coord.user._id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}