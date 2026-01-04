import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Download,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function ManageParticipants() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCheckedIn, setFilterCheckedIn] = useState('all');

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery, filterStatus, filterCheckedIn]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, participantsRes] = await Promise.all([
        hackathonAPI.getById(id),
        hackathonAPI.getParticipants(id),
      ]);

      setHackathon(hackathonRes.data.hackathon);
      setParticipants(participantsRes.data.participants);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.username.toLowerCase().includes(query) ||
          p.teamName.toLowerCase().includes(query)
      );
    }

    // Team status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.teamStatus === filterStatus);
    }

    // Check-in filter
    if (filterCheckedIn !== 'all') {
      filtered = filtered.filter((p) =>
        filterCheckedIn === 'checked-in' ? p.checkedIn : !p.checkedIn
      );
    }

    setFilteredParticipants(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Username', 'Institution', 'Team', 'Role', 'Status', 'Checked In'];
    const rows = filteredParticipants.map((p) => [
      p.fullName,
      p.email,
      p.username,
      p.institution || '',
      p.teamName,
      p.isLeader ? 'Leader' : 'Member',
      p.teamStatus,
      p.checkedIn ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${hackathon?.title || 'hackathon'}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Participants exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    all: participants.length,
    approved: participants.filter((p) => p.teamStatus === 'approved').length,
    pending: participants.filter((p) => p.teamStatus === 'pending').length,
    rejected: participants.filter((p) => p.teamStatus === 'rejected').length,
  };

  const checkedInCount = participants.filter((p) => p.checkedIn).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Participants</h1>
              <p className="text-gray-600">{hackathon?.title}</p>
            </div>
            <Button onClick={exportToCSV} icon={Download}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">{participants.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">{statusCounts.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">{checkedInCount}</div>
                <div className="text-sm text-gray-600">Checked In</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">{filteredParticipants.length}</div>
                <div className="text-sm text-gray-600">Filtered</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, email, username, or team..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Team Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Check-in Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Status</label>
              <select
                value={filterCheckedIn}
                onChange={(e) => setFilterCheckedIn(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Participant</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Team</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Check-in</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{participant.fullName}</div>
                          <div className="text-sm text-gray-600">{participant.email}</div>
                          <div className="text-sm text-gray-500">@{participant.username}</div>
                          {participant.institution && (
                            <div className="text-sm text-gray-500">{participant.institution}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/teams/${participant.teamId}`}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {participant.teamName}
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={participant.isLeader ? 'success' : 'default'}>
                          {participant.isLeader ? 'Leader' : 'Member'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            participant.teamStatus === 'approved'
                              ? 'success'
                              : participant.teamStatus === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {participant.teamStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {participant.checkedIn ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm">
                              {new Date(participant.checkInTime).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not checked in</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${participant.email}`}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Send email"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                          <Link
                            to={`/teams/${participant.teamId}`}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View team"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No participants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
