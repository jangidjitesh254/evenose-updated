import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Check,
  X,
  Mail,
  Clock,
  AlertCircle,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { teamAPI } from '../services/api';
import { useAuthStore } from '../store';
import { format } from 'date-fns';

export default function TeamRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Get requests sent TO the user (invitations they received from team leaders)
      const receivedResponse = await teamAPI.getMyJoinRequests().catch(() => ({ data: { joinRequests: [] } }));
      const received = (receivedResponse.data.joinRequests || []).map(req => ({
        ...req,
        team: {
          _id: req.team?._id || req.team,
          teamName: req.team?.teamName || 'Unknown Team',
          hackathon: req.hackathon,
          leader: req.sender
        }
      }));

      // Get requests sent BY the user (as team leader, invitations sent to other users)
      const teamsResponse = await teamAPI.getMyTeams();
      const myTeams = teamsResponse.data.teams || [];
      const teamsUserLeads = myTeams.filter(team =>
        team.leader === user._id || team.leader?._id === user._id
      );

      // Fetch join requests for each team the user leads
      const sentRequestsPromises = teamsUserLeads.map(team =>
        teamAPI.getJoinRequests(team._id).catch(() => ({ data: { joinRequests: [] } }))
      );
      const sentResponses = await Promise.all(sentRequestsPromises);

      // Flatten and format sent requests
      const sent = sentResponses.flatMap((response, index) => {
        const team = teamsUserLeads[index];
        return (response.data.joinRequests || []).map(req => ({
          ...req,
          team: {
            _id: team._id,
            teamName: team.teamName,
            hackathon: team.hackathon
          }
        }));
      });

      setRequests({
        received,
        sent
      });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, teamId) => {
    setActionLoading(true);
    try {
      await teamAPI.acceptJoinRequest(teamId, requestId);
      toast.success('Request accepted! Member added to team');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId, teamId, reason = '') => {
    setActionLoading(true);
    try {
      await teamAPI.rejectJoinRequest(teamId, requestId, { reason });
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (requestId, teamId) => {
    setActionLoading(true);
    try {
      await teamAPI.cancelJoinRequest(teamId, requestId);
      toast.success('Invitation cancelled');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Team Join Requests
          </h1>
          <p className="text-gray-600">
            Manage requests to join your teams or track your sent requests
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all relative ${
                activeTab === 'received'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Received Requests
              {requests.received.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-purple-600 text-xs rounded-full font-bold">
                  {requests.received.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all relative ${
                activeTab === 'sent'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sent Requests
              {requests.sent.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-purple-600 text-xs rounded-full font-bold">
                  {requests.sent.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Received Requests Tab */}
            {activeTab === 'received' && (
              <div className="space-y-4">
                {requests.received.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-100">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No invitations yet</h3>
                    <p className="text-gray-600">
                      You haven't received any team invitations
                    </p>
                  </div>
                ) : (
                  requests.received.map((request) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                              {request.user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">{request.user?.fullName || 'Unknown User'}</h3>
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                  request.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : request.status === 'accepted'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                @{request.user?.username || 'unknown'} • {request.user?.institution || 'No institution'}
                              </p>
                              <p className="text-sm text-gray-600 mb-3">
                                <strong>Team:</strong>{' '}
                                <Link
                                  to={`/teams/${request.team._id}`}
                                  className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                                >
                                  {request.team.teamName}
                                </Link>
                                {' • '}
                                <strong>Hackathon:</strong> {request.team.hackathon?.title || 'Unknown'}
                              </p>
                              {request.message && (
                                <div className="p-3 bg-gray-50 rounded-xl mb-3">
                                  <p className="text-sm text-gray-700">{request.message}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500">
                                Requested {format(new Date(request.createdAt), 'MMM dd, yyyy • HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAcceptRequest(request._id, request.team._id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request._id, request.team._id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                            <button
                              onClick={() => viewRequestDetails(request)}
                              className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                            >
                              View Profile
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              <div className="space-y-4">
                {requests.sent.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-100">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No invitations sent</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't invited anyone to join your teams yet
                    </p>
                    <Link to="/teams">
                      <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                        <UserPlus className="w-5 h-5" />
                        View Your Teams
                      </button>
                    </Link>
                  </div>
                ) : (
                  requests.sent.map((request) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                              {request.user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">{request.user?.fullName || 'Unknown User'}</h3>
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                  request.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : request.status === 'accepted'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                @{request.user?.username || 'unknown'} • {request.user?.institution || 'No institution'}
                              </p>
                              <p className="text-sm text-gray-600 mb-3">
                                <strong>Team:</strong>{' '}
                                <Link
                                  to={`/teams/${request.team._id}`}
                                  className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                                >
                                  {request.team.teamName}
                                </Link>
                                {' • '}
                                <strong>Hackathon:</strong> {request.team.hackathon?.title || 'Unknown'}
                              </p>
                              {request.message && (
                                <div className="p-3 bg-gray-50 rounded-xl mb-3">
                                  <p className="text-sm text-gray-700">{request.message}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mb-3">
                                Invited {format(new Date(request.createdAt), 'MMM dd, yyyy • HH:mm')}
                              </p>

                              {request.status === 'pending' && (
                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                  <Clock className="w-4 h-4" />
                                  Waiting for user's response
                                </div>
                              )}

                              {request.status === 'accepted' && (
                                <div className="flex items-center gap-2 text-sm text-green-700">
                                  <Check className="w-4 h-4" />
                                  {request.user?.fullName} joined your team!
                                </div>
                              )}

                              {request.status === 'rejected' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-2">
                                  <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
                                    <X className="w-4 h-4" />
                                    Invitation was declined
                                  </div>
                                  {request.rejectionReason && (
                                    <p className="text-sm text-red-600">
                                      <strong>Reason:</strong> {request.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleCancelRequest(request._id, request.team._id)}
                                disabled={actionLoading}
                                className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="User Profile"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary-600">
                  {selectedRequest.user.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedRequest.user.fullName}</h3>
                <p className="text-dark-600">@{selectedRequest.user.username}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-dark-600">Email:</span>
                <p className="font-medium">{selectedRequest.user.email}</p>
              </div>
              {selectedRequest.user.institution && (
                <div>
                  <span className="text-sm text-dark-600">Institution:</span>
                  <p className="font-medium">{selectedRequest.user.institution}</p>
                </div>
              )}
              {selectedRequest.user.profile?.skills && selectedRequest.user.profile.skills.length > 0 && (
                <div>
                  <span className="text-sm text-dark-600">Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRequest.user.profile.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
