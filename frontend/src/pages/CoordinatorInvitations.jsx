import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, X, Mail, Clock, Briefcase, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { hackathonAPI } from '../services/api';
import { useAuthStore } from '../store';
import { format } from 'date-fns';

export default function CoordinatorInvitations() {
  const { user, fetchUser } = useAuthStore();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await hackathonAPI.getCoordinatorInvitations();
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId, hackathonId) => {
    setActionLoading(true);
    try {
      await hackathonAPI.acceptCoordinatorInvitation(invitationId, { hackathonId });
      toast.success('Invitation accepted! You are now a coordinator');
      await fetchUser(); // Refresh user data
      fetchInvitations();
      setShowPermissionsModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    setActionLoading(true);
    try {
      await hackathonAPI.declineCoordinatorInvitation(invitationId);
      toast.success('Invitation declined');
      fetchInvitations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const viewPermissions = (invitation) => {
    setSelectedInvitation(invitation);
    setShowPermissionsModal(true);
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
  const declinedInvitations = invitations.filter(inv => inv.status === 'declined');

  const permissionsList = [
    { key: 'canViewTeams', label: 'View Teams', icon: Briefcase },
    { key: 'canEditTeams', label: 'Edit Team Details', icon: Shield },
    { key: 'canCheckIn', label: 'Check-in Participants', icon: Check },
    { key: 'canAssignTables', label: 'Assign Table Numbers', icon: Shield },
    { key: 'canViewSubmissions', label: 'View Submissions', icon: Briefcase },
    { key: 'canEliminateTeams', label: 'Eliminate Teams', icon: X },
    { key: 'canCommunicate', label: 'Communicate with Teams', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark-900 mb-2">
            Coordinator Invitations
          </h1>
          <p className="text-dark-600">
            Manage your coordinator invitations for hackathons
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-accent-600" />
                  Pending Invitations
                  <Badge variant="warning">{pendingInvitations.length}</Badge>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {pendingInvitations.map(invitation => (
                    <motion.div
                      key={invitation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-2 border-accent-200">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-2">
                            {invitation.hackathon.title}
                          </h3>
                          <p className="text-sm text-dark-600 mb-2">
                            Invited by: <strong>{invitation.invitedBy.fullName}</strong>
                          </p>
                          <p className="text-xs text-dark-500">
                            {format(new Date(invitation.invitedAt), 'MMM dd, yyyy • HH:mm')}
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-dark-700 mb-2">
                            <strong>Hackathon Period:</strong><br />
                            {format(new Date(invitation.hackathon.hackathonStartDate), 'MMM dd')} -{' '}
                            {format(new Date(invitation.hackathon.hackathonEndDate), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => viewPermissions(invitation)}
                            size="sm"
                            variant="primary"
                            icon={Check}
                          >
                            Review & Accept
                          </Button>
                          <Button
                            onClick={() => handleDeclineInvitation(invitation._id)}
                            size="sm"
                            variant="outline"
                            icon={X}
                          >
                            Decline
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Invitations */}
            {acceptedInvitations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Check className="w-6 h-6 text-green-600" />
                  Active Coordinations
                  <Badge variant="success">{acceptedInvitations.length}</Badge>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {acceptedInvitations.map(invitation => (
                    <motion.div
                      key={invitation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold">
                              {invitation.hackathon.title}
                            </h3>
                            <Badge variant="success">Active</Badge>
                          </div>
                          <p className="text-sm text-dark-600">
                            Accepted on: {format(new Date(invitation.acceptedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <Button
                          onClick={() => window.location.href = `/coordinator/${invitation.hackathon._id}`}
                          size="sm"
                          variant="primary"
                          fullWidth
                        >
                          Go to Dashboard
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {invitations.length === 0 && (
              <Card>
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-dark-400" />
                  <h3 className="text-xl font-semibold mb-2">No invitations yet</h3>
                  <p className="text-dark-600">
                    You haven't received any coordinator invitations
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Permissions Review Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title="Review Coordinator Permissions"
        size="lg"
      >
        {selectedInvitation && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                {selectedInvitation.hackathon.title}
              </h3>
              <p className="text-sm text-dark-600">
                You've been invited to be a coordinator by{' '}
                <strong>{selectedInvitation.invitedBy.fullName}</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Your Permissions:</h4>
              <div className="space-y-2">
                {permissionsList.map(perm => {
                  const Icon = perm.icon;
                  const hasPermission = selectedInvitation.permissions[perm.key];
                  return (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        hasPermission ? 'bg-green-50 border border-green-200' : 'bg-dark-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        hasPermission ? 'text-green-600' : 'text-dark-400'
                      }`} />
                      <span className={`flex-1 ${
                        hasPermission ? 'text-green-900 font-medium' : 'text-dark-500'
                      }`}>
                        {perm.label}
                      </span>
                      {hasPermission ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent-600" />
                Important Notes
              </h4>
              <ul className="text-sm text-dark-700 space-y-1 list-disc list-inside">
                <li>As a coordinator, you cannot participate in this hackathon</li>
                <li>You can view and manage teams based on your permissions</li>
                <li>The organizer can modify your permissions at any time</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleAcceptInvitation(
                  selectedInvitation._id,
                  selectedInvitation.hackathon._id
                )}
                loading={actionLoading}
                icon={Check}
                variant="primary"
                fullWidth
              >
                Accept Invitation
              </Button>
              <Button
                onClick={() => handleDeclineInvitation(selectedInvitation._id)}
                loading={actionLoading}
                icon={X}
                variant="outline"
                fullWidth
              >
                Decline
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
