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
      </div>
    </div>
  );
}