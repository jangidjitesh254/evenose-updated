import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  Calendar,
  ArrowLeft,
  Download,
  MessageSquare,
  Check,
  X,
  Edit3,
  UserPlus,
  UserMinus,
  Trash2,
  Search,
} from 'lucide-react';
import { teamAPI, hackathonAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function TeamApprovals() {
  const { id } = useParams(); // Changed from hackathonId to id to match route
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [hackathon, setHackathon] = useState(null);
  const [filter, setFilter] = useState('submitted'); // submitted, approved, rejected, all
  const [rejectModal, setRejectModal] = useState({ show: false, team: null });
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [noteModal, setNoteModal] = useState({ show: false, team: null });
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Team Management Modal
  const [manageTeamModal, setManageTeamModal] = useState({ show: false, team: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, hackathonRes] = await Promise.all([
        teamAPI.getSubmittedTeams(id),
        hackathonAPI.getById(id)
      ]);
      
      setTeams(teamsRes.data.teams);
      setHackathon(hackathonRes.data.hackathon);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teamId) => {
    if (!window.confirm('Are you sure you want to approve this team?')) return;

    try {
      await teamAPI.approveTeam(teamId);
      toast.success('Team approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to approve team:', error);
      toast.error(error.response?.data?.message || 'Failed to approve team');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await teamAPI.rejectTeam(rejectModal.team._id, { reason: rejectReason });
      toast.success('Team rejected');
      setRejectModal({ show: false, team: null });
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error('Failed to reject team:', error);
      toast.error(error.response?.data?.message || 'Failed to reject team');
    }
  };

  const handleSelectTeam = (teamId) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTeams.size === filteredTeams.filter(t => t.submissionStatus === 'submitted').length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(filteredTeams.filter(t => t.submissionStatus === 'submitted').map(t => t._id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTeams.size === 0) {
      toast.error('Please select at least one team');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${selectedTeams.size} team(s)?`)) return;

    try {
      const result = await teamAPI.bulkApproveTeams(id, Array.from(selectedTeams));
      toast.success(`Approved ${result.data.results.approved.length} team(s)`);
      if (result.data.results.failed.length > 0) {
        toast.error(`Failed to approve ${result.data.results.failed.length} team(s)`);
      }
      setSelectedTeams(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk approve failed:', error);
      toast.error(error.response?.data?.message || 'Bulk approve failed');
    }
  };

  const handleBulkReject = async () => {
    if (!bulkRejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const result = await teamAPI.bulkRejectTeams(id, Array.from(selectedTeams), bulkRejectReason);
      toast.success(`Rejected ${result.data.results.rejected.length} team(s)`);
      if (result.data.results.failed.length > 0) {
        toast.error(`Failed to reject ${result.data.results.failed.length} team(s)`);
      }
      setBulkRejectModal(false);
      setBulkRejectReason('');
      setSelectedTeams(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk reject failed:', error);
      toast.error(error.response?.data?.message || 'Bulk reject failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await teamAPI.exportTeamsToCSV(id, filter === 'all' ? null : filter);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teams-${hackathon.slug || 'export'}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Teams exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export teams');
    } finally {
      setExporting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      await teamAPI.addNoteToTeam(noteModal.team._id, {
        content: noteContent,
        isPublic: noteIsPublic,
        notifyTeam
      });
      toast.success('Note added successfully');
      setNoteModal({ show: false, team: null });
      setNoteContent('');
      setNoteIsPublic(false);
      setNotifyTeam(true);
      fetchData();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  // Team Management Functions
  const handleSearchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    try {
      setSearching(true);
      const response = await teamAPI.searchUsersForTeam(id, searchQuery);
      // Filter to only show students not already in the team
      const currentMemberIds = manageTeamModal.team?.members
        ?.filter(m => m.status === 'active')
        .map(m => m.user?._id || m.user) || [];

      const availableUsers = (response.data.users || []).filter(user => {
        const isStudent = !user.roles || user.roles.length === 0 || user.roles.includes('student');
        const notInTeam = !currentMemberIds.includes(user._id);
        return isStudent && notInTeam;
      });

      setSearchResults(availableUsers);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleOrganizerAddMember = async (userId) => {
    try {
      await teamAPI.organizerAddMember(manageTeamModal.team._id, { userId });
      toast.success('Member added successfully!');
      setSearchResults([]);
      setSearchQuery('');
      fetchData();
      // Refresh the modal team data
      const updatedTeam = await teamAPI.getById(manageTeamModal.team._id);
      setManageTeamModal({ show: true, team: updatedTeam.data.team });
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleOrganizerRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      await teamAPI.organizerRemoveMember(manageTeamModal.team._id, memberId);
      toast.success('Member removed successfully!');
      fetchData();
      // Refresh the modal team data
      const updatedTeam = await teamAPI.getById(manageTeamModal.team._id);
      setManageTeamModal({ show: true, team: updatedTeam.data.team });
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleOrganizerDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to permanently delete this team? This action cannot be undone.')) return;

    try {
      await teamAPI.organizerDeleteTeam(teamId);
      toast.success('Team deleted successfully!');
      setManageTeamModal({ show: false, team: null });
      fetchData();
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error(error.response?.data?.message || 'Failed to delete team');
    }
  };

  const filteredTeams = teams.filter(team => {
    if (filter === 'all') return true;
    return team.submissionStatus === filter;
  });

  const stats = {
    submitted: teams.filter(t => t.submissionStatus === 'submitted').length,
    approved: teams.filter(t => t.submissionStatus === 'approved').length,
    rejected: teams.filter(t => t.submissionStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Team Approvals</h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {hackathon?.title}
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setFilter('submitted')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'submitted'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.submitted}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'approved'
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200 hover:border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'rejected'
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-gray-200 hover:border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'all'
                ? 'bg-purple-50 border-purple-300'
                : 'bg-white border-gray-200 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">All Teams</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{teams.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </button>
        </div>

        {/* Teams List */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {filter === 'submitted' ? 'Pending Teams' :
             filter === 'approved' ? 'Approved Teams' :
             filter === 'rejected' ? 'Rejected Teams' :
             'All Teams'}
          </h2>

          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No teams found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeams.map((team) => (
                <div
                  key={team._id}
                  className="p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{team.teamName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Lead: {team.leader?.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {team.leader?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {team.members?.filter(m => m.status === 'active').length} members
                        </span>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl font-semibold ${
                      team.submissionStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : team.submissionStatus === 'submitted'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {team.submissionStatus}
                    </span>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Team Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {team.members?.filter(m => m.status === 'active').map((member) => (
                        <div
                          key={member._id}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                        >
                          {member.user?.fullName}
                          {member.role === 'leader' && ' 👑'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Submitted: {team.submittedForApprovalAt ? format(new Date(team.submittedForApprovalAt), 'PPp') : 'N/A'}</p>
                    {team.approvedAt && (
                      <p>Processed: {format(new Date(team.approvedAt), 'PPp')} by {team.approvedBy?.fullName}</p>
                    )}
                    {team.rejectionReason && (
                      <p className="text-red-600 mt-2">Reason: {team.rejectionReason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {team.submissionStatus === 'submitted' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(team._id)}
                          className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Approve Team
                        </button>
                        <button
                          onClick={() => setRejectModal({ show: true, team })}
                          className="flex-1 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject Team
                        </button>
                      </div>
                    )}

                    {/* Organizer Team Management Button */}
                    <button
                      onClick={() => setManageTeamModal({ show: true, team })}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" />
                      Manage Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Reject Team</h2>
                <button
                  onClick={() => {
                    setRejectModal({ show: false, team: null });
                    setRejectReason('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to reject <strong>{rejectModal.team?.teamName}</strong>?
                  </p>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for rejection *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="Please provide a clear reason..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setRejectModal({ show: false, team: null });
                      setRejectReason('');
                    }}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Reject Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Team Modal */}
        {manageTeamModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Edit3 className="w-6 h-6 text-purple-600" />
                    Manage Team: {manageTeamModal.team?.teamName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add or remove team members, or delete the entire team
                  </p>
                </div>
                <button
                  onClick={() => {
                    setManageTeamModal({ show: false, team: null });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Current Team Members */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Current Team Members ({manageTeamModal.team?.members?.filter(m => m.status === 'active').length})
                  </h3>
                  <div className="space-y-3">
                    {manageTeamModal.team?.members
                      ?.filter(m => m.status === 'active')
                      .map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                              {(member.user?.fullName || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {member.user?.fullName || 'Unknown Member'}
                                </p>
                                {member.role === 'leader' && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg">
                                    Team Leader
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.user?.email || 'No email'}</p>
                            </div>
                          </div>
                          {member.role !== 'leader' && (
                            <button
                              onClick={() => handleOrganizerRemoveMember(member._id)}
                              className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Add New Member Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    Add New Member
                  </h3>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                      placeholder="Search by name, username, or email..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSearchUsers}
                      disabled={searching || !searchQuery || searchQuery.length < 2}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                              {user.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.fullName}</p>
                              <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOrganizerAddMember(user._id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No students found matching your search</p>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
                  <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    Permanently delete this team. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => handleOrganizerDeleteTeam(manageTeamModal.team._id)}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Team Permanently
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setManageTeamModal({ show: false, team: null });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}