import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ExternalLink,
  Calendar,
  MapPin,
  Trophy,
  Eye,
  Users,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { hackathonAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function MyInvitations() {
  const { user } = useAuthStore();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      
      const pendingInvites = response.data.user.coordinatorFor?.filter(
        (coord) => coord.status === 'pending'
      ) || [];

      const invitesWithDetails = await Promise.all(
        pendingInvites.map(async (invite) => {
          try {
            // Check if hackathon is already populated (has title property)
            if (invite.hackathon?.title) {
              // Already populated, use it directly
              return {
                ...invite,
                hackathonDetails: invite.hackathon,
              };
            }
            
            // Not populated, fetch it
            // Extract ID if it's an object, or use it directly if it's a string
            const hackathonId = invite.hackathon?._id || invite.hackathon;
            const hackathonRes = await hackathonAPI.getById(hackathonId);
            return {
              ...invite,
              hackathonDetails: hackathonRes.data.hackathon,
            };
          } catch (error) {
            console.error('Failed to fetch hackathon details:', error);
            return null;
          }
        })
      );

      setInvitations(invitesWithDetails.filter(Boolean));
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleAccept = async (hackathonId) => {
    setAcceptingId(hackathonId);
    try {
      await hackathonAPI.acceptCoordinatorInvitation(hackathonId);
      toast.success('Invitation accepted! You are now a coordinator.', {
        duration: 4000,
        icon: '🎉',
      });
      fetchInvitations();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      const message = error.response?.data?.message || 'Failed to accept invitation';
      
      // Check if user is a participant
      if (error.response?.data?.isParticipant) {
        toast.error(message, { duration: 6000 });
      } else {
        toast.error(message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (hackathonId) => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) return;

    setDecliningId(hackathonId);
    try {
      await hackathonAPI.cancelCoordinatorInvite(hackathonId, user._id);
      toast.success('Invitation declined');
      fetchInvitations();
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setDecliningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    );
  }

  const activeCoordinations = user?.coordinatorFor?.filter((c) => c.status === 'accepted').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Coordinator Invitations</h1>
          <p className="text-gray-600">
            View and manage your coordinator invitations for hackathons
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Mail className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{invitations.length}</div>
                <div className="text-sm text-gray-600">Pending Invitations</div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{activeCoordinations}</div>
                <div className="text-sm text-gray-600">Active Roles</div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{user?.coordinatorFor?.length || 0}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Invitations List */}
        {invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation, index) => {
              const hack = invitation.hackathonDetails;
              return (
                <motion.div
                  key={invitation._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-6 h-6 text-indigo-600" />
                          <h3 className="text-2xl font-bold text-gray-900">
                            Coordinator Invitation
                          </h3>
                        </div>
                        <Link
                          to={`/hackathons/${hack._id}`}
                          className="text-xl font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-2"
                        >
                          {hack.title}
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <p className="text-gray-600 text-sm">
                          {hack.description?.substring(0, 150) || 'No description available'}...
                        </p>
                      </div>
                      <Badge variant="warning">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </Badge>
                    </div>

                    {/* Hackathon Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Start Date</div>
                          <div className="font-semibold text-gray-900">
                            {formatDate(hack.startDate || hack.hackathonStartDate)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Mode</div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {hack.mode || hack.eventMode || 'Not specified'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Invited</div>
                          <div className="font-semibold text-gray-900">
                            {formatDate(invitation.invitedAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Your Assigned Permissions:
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {invitation.permissions?.canViewTeams && (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Eye className="w-4 h-4" />
                            <span>View Teams</span>
                          </div>
                        )}
                        {invitation.permissions?.canCheckIn && (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>Check-in</span>
                          </div>
                        )}
                        {invitation.permissions?.canAssignTables && (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Users className="w-4 h-4" />
                            <span>Assign Tables</span>
                          </div>
                        )}
                        {invitation.permissions?.canViewSubmissions && (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Eye className="w-4 h-4" />
                            <span>View Submissions</span>
                          </div>
                        )}
                        {invitation.permissions?.canEliminateTeams && (
                          <div className="flex items-center gap-2 text-sm text-orange-700">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Eliminate Teams</span>
                          </div>
                        )}
                        {invitation.permissions?.canCommunicate && (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Mail className="w-4 h-4" />
                            <span>Communicate</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAccept(hack._id)}
                        disabled={acceptingId === hack._id || decliningId === hack._id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {acceptingId === hack._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Invitation
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(hack._id)}
                        disabled={acceptingId === hack._id || decliningId === hack._id}
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        {decliningId === hack._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Declining...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-gray-500 mb-4">
              You don't have any coordinator invitations at the moment.
            </p>
            {activeCoordinations > 0 && (
              <p className="text-sm text-gray-600">
                You're currently a coordinator for {activeCoordinations} hackathon{activeCoordinations !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}