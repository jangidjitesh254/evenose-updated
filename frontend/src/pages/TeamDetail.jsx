import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Users,
  CheckCircle,
  XCircle,
  Upload,
  Award,
  Settings,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Link,
  Search,
  Copy,
  Mail,
  Clock,
  CheckCircle2,
  Crown,
  Calendar,
  Target,
  Edit,
  X,
} from 'lucide-react';
import { teamAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMethod, setInviteMethod] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [submissionData, setSubmissionData] = useState({
    roundId: '',
    projectLink: '',
    videoLink: '',
    description: '',
  });

  useEffect(() => {
    fetchTeam();
  }, [id]);

  useEffect(() => {
    if (team) {
      setInviteLink(`${window.location.origin}/teams/${team._id}/join`);
    }
  }, [team]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const teamResponse = await teamAPI.getById(id);
      setTeam(teamResponse.data.team);
      
      // Fetch pending members if user is team leader
      const isLeader = teamResponse.data.team?.leader === user?.id || teamResponse.data.team?.leader?._id === user?.id;
      if (isLeader) {
        try {
          const pendingResponse = await teamAPI.getPendingMembers(id);
          setPendingMembers(pendingResponse.data.pendingMembers || []);
        } catch (error) {
          setPendingMembers([]);
        }
      } else {
        setPendingMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const isTeamLead = () => {
    return team?.leader === user.id || team?.leader?._id === user.id;
  };

  const canModifyTeam = () => {
    if (!isTeamLead()) return false;
    // Can only modify if team is in draft status
    return team?.submissionStatus === 'draft' || !team?.submissionStatus;
  };

  const handleSearchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    try {
      setSearching(true);
      const response = await teamAPI.searchUsersForTeam(team.hackathon._id, searchQuery, team._id);
      console.log('Raw API response (invite search):', response.data);
      
      // Filter to only show users with student role (or no roles set, defaulting to student)
      const students = (response.data.users || []).filter(user => {
        // If roles array exists and is not empty, check if it includes 'student'
        // If roles is empty/undefined, assume student (default behavior)
        if (!user.roles || user.roles.length === 0) {
          return true; // Default to student if no roles set
        }
        return user.roles.includes('student');
      });
      console.log('Filtered students (invite search):', students);
      setSearchResults(students);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleInviteUser = async (userId) => {
    try {
      await teamAPI.sendJoinRequest(team._id, { userId });
      toast.success('Join request sent successfully!');
      // Update search results to show invite sent status
      setSearchResults(searchResults.map(user => 
        user._id === userId ? { ...user, hasPendingRequest: true } : user
      ));
      // Refresh pending members
      if (isTeamLead()) {
        const pendingResponse = await teamAPI.getPendingMembers(team._id);
        setPendingMembers(pendingResponse.data.pendingMembers || []);
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await teamAPI.cancelJoinRequest(team._id, requestId);
      toast.success('Request cancelled successfully!');
      fetchTeam();
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team? This action cannot be undone.')) return;
    
    try {
      await teamAPI.leaveTeam(team._id);
      toast.success('You have left the team successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave team:', error);
      toast.error(error.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleInviteSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    try {
      setSearching(true);
      const response = await teamAPI.searchUsersForTeam(team.hackathon._id, searchQuery, team._id);
      console.log('Raw API response:', response.data);
      console.log('All users from API:', response.data.users);
      
      // Filter to only show users with student role (or no roles set, defaulting to student)
      const students = (response.data.users || []).filter(user => {
        // If roles array exists and is not empty, check if it includes 'student'
        // If roles is empty/undefined, assume student (default behavior)
        if (!user.roles || user.roles.length === 0) {
          return true; // Default to student if no roles set
        }
        return user.roles.includes('student');
      });
      console.log('Filtered students:', students);
      setSearchResults(students);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await teamAPI.removeMember(team._id, memberId);
      toast.success('Member removed successfully!');
      fetchTeam();
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    try {
      await teamAPI.submit(team._id, submissionData);
      toast.success('Project submitted successfully!');
      setShowSubmitModal(false);
      setSubmissionData({ roundId: '', projectLink: '', videoLink: '', description: '' });
      fetchTeam();
    } catch (error) {
      console.error('Failed to submit project:', error);
      toast.error(error.response?.data?.message || 'Failed to submit project');
    }
  };

  const handleConfirmTeam = async () => {
    if (!window.confirm('Are you sure you want to submit this team for final approval? You cannot modify the team after submission.')) return;
    
    try {
      await teamAPI.confirmTeam(team._id);
      toast.success('Team submitted for approval successfully!');
      fetchTeam();
    } catch (error) {
      console.error('Failed to confirm team:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm team');
    }
  };

  const handleRenameTeam = async () => {
    if (!newTeamName || newTeamName.trim() === '') {
      toast.error('Please enter a team name');
      return;
    }

    if (newTeamName.trim() === team.teamName) {
      setShowRenameModal(false);
      return;
    }

    try {
      await teamAPI.update(team._id, { teamName: newTeamName.trim() });
      toast.success('Team name updated successfully!');
      setShowRenameModal(false);
      setNewTeamName('');
      fetchTeam();
    } catch (error) {
      console.error('Failed to rename team:', error);
      toast.error(error.response?.data?.message || 'Failed to rename team');
    }
  };

  const canConfirmTeam = () => {
    if (!isTeamLead()) return false;
    if (team?.submissionStatus !== 'draft') return false;
    
    const activeMembers = team?.members?.filter(m => m.status === 'active') || [];
    const minMembers = team?.hackathon?.teamConfig?.minMembers || 1;
    const maxMembers = team?.hackathon?.teamConfig?.maxMembers || 10;
    
    return activeMembers.length >= minMembers && activeMembers.length <= maxMembers;
  };

  const getTeamStatusMessage = () => {
    if (!team) return '';
    
    const activeMembers = team.members?.filter(m => m.status === 'active') || [];
    const minMembers = team.hackathon?.teamConfig?.minMembers || 1;
    const maxMembers = team.hackathon?.teamConfig?.maxMembers || 10;
    
    if (team.submissionStatus === 'submitted') {
      return { type: 'info', message: 'Team submitted for approval. Waiting for organizer review.' };
    }
    
    if (team.submissionStatus === 'approved') {
      return { type: 'success', message: 'Team registration approved!' };
    }
    
    if (team.submissionStatus === 'rejected') {
      return { type: 'error', message: `Team registration rejected${team.rejectionReason ? ': ' + team.rejectionReason : ''}` };
    }
    
    if (activeMembers.length < minMembers) {
      return { 
        type: 'warning', 
        message: `Add ${minMembers - activeMembers.length} more member(s) to meet the minimum requirement of ${minMembers} members` 
      };
    }
    
    if (activeMembers.length > maxMembers) {
      return { 
        type: 'warning', 
        message: `Team has too many members. Maximum allowed: ${maxMembers}` 
      };
    }
    
    return { type: 'success', message: 'Team meets all requirements. Ready to submit for approval!' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'submissions', label: 'Submissions', icon: Upload },
    { id: 'scores', label: 'Scores', icon: Award },
  ];

  if (isTeamLead()) {
    tabs.push({ id: 'settings', label: 'Settings', icon: Settings });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{team.teamName}</h1>
                  {isTeamLead() && canModifyTeam() && (
                    <button
                      onClick={() => {
                        setNewTeamName(team.teamName);
                        setShowRenameModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Rename team"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {team.hackathon?.title}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-4 py-2 rounded-xl font-semibold ${
                  team.submissionStatus === 'approved' 
                    ? 'bg-green-100 text-green-700'
                    : team.submissionStatus === 'submitted'
                    ? 'bg-blue-100 text-blue-700'
                    : team.submissionStatus === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {team.submissionStatus === 'draft' ? 'Draft' : team.submissionStatus}
                </span>
                {team.checkIn?.isCheckedIn && (
                  <span className="px-4 py-2 rounded-xl font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Checked In
                  </span>
                )}
              </div>
            </div>

            {/* Team Status Message */}
            {(() => {
              const statusInfo = getTeamStatusMessage();
              return (
                <div className={`p-4 rounded-xl border-2 mb-4 ${
                  statusInfo.type === 'success' ? 'bg-green-50 border-green-200' :
                  statusInfo.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  statusInfo.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    statusInfo.type === 'success' ? 'text-green-700' :
                    statusInfo.type === 'warning' ? 'text-yellow-700' :
                    statusInfo.type === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {statusInfo.message}
                  </p>
                </div>
              );
            })()}

            {/* Confirm Team Button */}
            {isTeamLead() && team.submissionStatus === 'draft' && (
              <button
                onClick={handleConfirmTeam}
                disabled={!canConfirmTeam()}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  canConfirmTeam()
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {canConfirmTeam() ? 'Confirm Team & Submit for Approval' : 'Cannot Submit - Requirements Not Met'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-2">
          <nav className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Team Members Card */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-7 h-7 text-purple-600" />
                      Team Members
                    </h2>
                    {isTeamLead() && pendingMembers.length > 0 && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {pendingMembers.length} Pending
                      </span>
                    )}
                  </div>
                  {isTeamLead() && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      disabled={!canModifyTeam()}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                        canModifyTeam()
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={!canModifyTeam() ? 'Cannot modify team after submission' : 'Invite users to team'}
                    >
                      <Search className="w-5 h-5" />
                      Invite Users
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Active Members */}
                  {team.members?.filter(m => m.status === 'active').map((member) => {
                    const isCurrentUser = member.user?._id === user?.id || member.user === user?.id;
                    return (
                      <div key={member._id} className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {(member.user?.fullName || member.fullName)?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {member.user?.fullName || member.fullName}
                              </span>
                              {member.role === 'leader' && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{member.user?.email || member.email}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {member.role === 'leader' && (
                                <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg">
                                  Team Lead
                                </span>
                              )}
                              {member.checkIn?.isCheckedIn ? (
                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Checked In
                                  {member.checkIn?.checkedInAt && (
                                    <span className="text-xs text-green-600 ml-1">
                                      ({format(new Date(member.checkIn.checkedInAt), 'MMM dd, HH:mm')})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Not Checked In
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isTeamLead() && member.role !== 'leader' && canModifyTeam() && (
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                          {!isTeamLead() && isCurrentUser && canModifyTeam() && (
                            <button
                              onClick={handleLeaveTeam}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm"
                            >
                              Leave Team
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending Members (Waiting for Approval) */}
                  {isTeamLead() && pendingMembers.length > 0 && (
                    <>
                      <div className="mt-6 pt-6 border-t-2 border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          Waiting for Approval ({pendingMembers.length})
                        </h3>
                        {pendingMembers.map((request) => (
                          <div key={request._id} className="flex items-center justify-between p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 hover:border-yellow-300 transition-all mb-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                {request.user?.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {request.user?.fullName}
                                  </span>
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg">
                                    Pending
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">@{request.user?.username}</div>
                                <div className="text-sm text-gray-500">{request.user?.email}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Invited {new Date(request.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCancelRequest(request._id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm"
                                title="Cancel request"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Action Buttons Below Members List */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {isTeamLead() && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Search & Invite Users
                    </button>
                  )}
                  {!isTeamLead() && team.members?.some(m => (m.user?._id === user?.id || m.user === user?.id) && m.status === 'active') && (
                    <button
                      onClick={handleLeaveTeam}
                      className="w-full px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <UserMinus className="w-5 h-5" />
                      Leave Team
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Send Request Card */}
              {isTeamLead() && (
                <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                    Invite Members
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Search for students and send them invitations to join your team
                  </p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Search & Invite Users
                  </button>
                </div>
               )}

              <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Team Info
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 block mb-1">Project</span>
                    <p className="font-semibold text-gray-900">{team.projectTitle || 'Not specified'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 block mb-1">Table Number</span>
                    <p className="font-semibold text-gray-900">{team.tableNumber || 'Not assigned'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 block mb-1">Team Number</span>
                    <p className="font-semibold text-gray-900">{team.teamNumber || 'Not assigned'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 block mb-1">Payment Status</span>
                    <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${
                      team.payment?.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {team.payment?.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Check-in Status Card */}
              <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Check-in Status
                </h3>
                <div className="space-y-3">
                  {/* Team Check-in Status */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Team Status</span>
                      {team.checkIn?.isCheckedIn ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    {team.checkIn?.checkedInAt && (
                      <p className="text-xs text-gray-600">
                        Checked in on {format(new Date(team.checkIn.checkedInAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>

                  {/* Members Check-in Progress */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Members Progress</span>
                      <span className="text-sm font-bold text-purple-600">
                        {team.members?.filter(m => m.status === 'active' && m.checkIn?.isCheckedIn).length || 0}/
                        {team.members?.filter(m => m.status === 'active').length || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          team.checkIn?.allMembersCheckedIn
                            ? 'bg-green-600'
                            : team.members?.some(m => m.checkIn?.isCheckedIn)
                            ? 'bg-yellow-600'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          width: `${
                            team.members?.filter(m => m.status === 'active').length > 0
                              ? (team.members.filter(m => m.status === 'active' && m.checkIn?.isCheckedIn).length /
                                 team.members.filter(m => m.status === 'active').length) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    {team.checkIn?.allMembersCheckedIn && (
                      <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        All members checked in!
                      </p>
                    )}
                  </div>

                  {/* Assigned Location */}
                  {(team.tableNumber || team.teamNumber) && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-sm font-semibold text-blue-900 block mb-2">Assigned Location</span>
                      <div className="space-y-1 text-sm">
                        {team.tableNumber && (
                          <p className="text-blue-800">
                            <strong>Table:</strong> {team.tableNumber}
                          </p>
                        )}
                        {team.teamNumber && (
                          <p className="text-blue-800">
                            <strong>Team #:</strong> {team.teamNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {isTeamLead() && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Submit Project
              </button>
            )}
            
            <div className="grid gap-4">
              {team.submissions?.map((submission, index) => (
                <div key={index} className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{submission.round?.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        Submitted {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold">
                      Submitted
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {submission.projectLink && (
                      <a href={submission.projectLink} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
                        <Link className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                    {submission.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-600 font-semibold">Description:</span>
                        <p className="mt-1 text-gray-700">{submission.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!team.submissions || team.submissions.length === 0) && (
                <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-100">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No submissions yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scores' && (
          <div className="space-y-4">
            {team.scores?.map((score, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{score.round?.name}</h3>
                    <p className="text-sm text-gray-500">Judge: {score.judge?.fullName}</p>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                    {score.totalScore}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {score.criteriaScores?.map((cs, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium">{cs.criteriaName}</span>
                      <span className="font-bold text-purple-600">{cs.score}</span>
                    </div>
                  ))}
                </div>
                {score.feedback && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="font-semibold text-blue-900">Feedback:</span>
                    <p className="mt-1 text-blue-800">{score.feedback}</p>
                  </div>
                )}
              </div>
            ))}
            {(!team.scores || team.scores.length === 0) && (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-100">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No scores yet</p>
              </div>
            )}
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Send Join Request</h2>
                  <p className="text-sm text-gray-600 mt-1">Search for students and invite them to join your team</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    setInviteMethod('search');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setInviteMethod('search')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      inviteMethod === 'search'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Search className="w-5 h-5 inline-block mr-2" />
                    Search User
                  </button>
                  <button
                    onClick={() => setInviteMethod('link')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                      inviteMethod === 'link'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Link className="w-5 h-5 inline-block mr-2" />
                    Invite Link
                  </button>
                </div>

                {inviteMethod === 'search' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Search for Students
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                          placeholder="Search by name, username, or email..."
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleSearchUsers}
                          disabled={searching || !searchQuery || searchQuery.length < 2}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Search className="w-5 h-5" />
                          {searching ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enter at least 2 characters to search. Only students will be shown in results.
                      </p>
                    </div>

                    {searchResults.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {searchResults.map((user) => (
                            <div key={user._id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              user.hasPendingRequest 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                                : 'bg-gradient-to-r from-purple-50 to-blue-50 border-gray-100 hover:border-purple-300'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {user.fullName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{user.fullName}</span>
                                    {user.hasPendingRequest && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        Invite Sent
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">@{user.username}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                              {user.hasPendingRequest ? (
                                <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed">
                                  <CheckCircle className="w-4 h-4" />
                                  Invite Sent
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleInviteUser(user._id)}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                  <Mail className="w-4 h-4" />
                                  Invite
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchQuery && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No students found matching your search</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">Share this link with users to invite them to your team:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invite Users Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Invite Users to Team</h2>
                  <p className="text-sm text-gray-600 mt-1">Search for students and send them join requests</p>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Search Students
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleInviteSearch()}
                        placeholder="Search by name, username, or email..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleInviteSearch}
                        disabled={searching || !searchQuery || searchQuery.length < 2}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Search className="w-5 h-5" />
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter at least 2 characters to search. Only students will be shown.
                    </p>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div key={user._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-gray-100 hover:border-purple-300 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {user.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{user.fullName}</div>
                                <div className="text-sm text-gray-600">@{user.username}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleInviteUser(user._id)}
                              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                              <Mail className="w-4 h-4" />
                              Invite
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {searchQuery && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No students found</p>
                      <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                    </div>
                  )}

                  {/* Initial State */}
                  {!searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Search for students to invite</p>
                      <p className="text-sm text-gray-500 mt-1">Enter a name, username, or email to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Submit Project</h2>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Round *</label>
                  <select
                    value={submissionData.roundId}
                    onChange={(e) => setSubmissionData({ ...submissionData, roundId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a round</option>
                    {team.hackathon?.rounds?.map((round) => (
                      <option key={round._id} value={round._id}>{round.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Link *</label>
                  <input
                    type="url"
                    value={submissionData.projectLink}
                    onChange={(e) => setSubmissionData({ ...submissionData, projectLink: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video Link (optional)</label>
                  <input
                    type="url"
                    value={submissionData.videoLink}
                    onChange={(e) => setSubmissionData({ ...submissionData, videoLink: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={submissionData.description}
                    onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProject}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rename Team Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Rename Team</h2>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter new team name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You can only rename your team before submitting for approval.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRenameModal(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameTeam}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}