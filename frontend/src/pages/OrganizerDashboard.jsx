import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Edit,
  Eye,
  Shield,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  FileText,
  Play,
  Pause,
  CheckSquare,
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function OrganizerDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, statsRes] = await Promise.all([
        hackathonAPI.getById(id),
        hackathonAPI.getStats(id),
      ]);

      setHackathon(hackathonRes.data.hackathon);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hackathon || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard not available</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'gray',
      published: 'blue',
      registration_open: 'green',
      registration_closed: 'yellow',
      ongoing: 'indigo',
      completed: 'purple',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  const getRoundStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      ongoing: 'success',
      completed: 'info',
      cancelled: 'error',
    };
    return variants[status] || 'default';
  };

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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{hackathon.title}</h1>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(hackathon.status)}>
                  {hackathon.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-gray-600">Organizer Dashboard</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate(`/hackathons/${id}/edit`)} icon={Edit} variant="outline">
                Edit
              </Button>
              <Button onClick={() => navigate(`/hackathons/${id}`)} icon={Eye}>
                View Public Page
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.overview.totalTeams}</div>
                <div className="text-sm text-gray-600">Total Teams</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.overview.totalParticipants}</div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.overview.pendingApproval}</div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.overview.checkedInTeams}</div>
                <div className="text-sm text-gray-600">Checked In</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Round */}
            {stats.currentRound && (
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Current Round</h2>
                </div>
                <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-green-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{stats.currentRound.name}</h3>
                      <p className="text-gray-600">{stats.currentRound.description}</p>
                    </div>
                    <Badge variant="success">Ongoing</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">Start</div>
                      <div className="font-semibold">{new Date(stats.currentRound.startTime).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">End</div>
                      <div className="font-semibold">{new Date(stats.currentRound.endTime).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rounds Overview */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Rounds Progress</h2>
                </div>
                <Button onClick={() => navigate(`/hackathons/${id}/rounds`)} size="sm" variant="outline">
                  Manage Rounds
                </Button>
              </div>
              <div className="space-y-4">
                {stats.rounds && stats.rounds.length > 0 ? (
                  stats.rounds.map((round) => (
                    <div key={round.roundId} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-900">{round.name}</h4>
                            <Badge variant={getRoundStatusBadge(round.status)}>
                              {round.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{round.submissions} / {round.totalTeams} submissions</span>
                            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${round.totalTeams > 0 ? (round.submissions / round.totalTeams) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No rounds configured yet</p>
                )}
              </div>
            </div>

            {/* Registration Stats */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Registration Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Capacity</span>
                  <span className="font-bold text-gray-900">
                    {stats.registration.currentRegistrations} / {stats.registration.maxTeams}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Fill Rate</span>
                  <span className="font-bold text-indigo-600">{stats.registration.percentFilled}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.registration.percentFilled}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/hackathons/${id}/approvals`)}
                  className="w-full justify-start"
                  variant="outline"
                  icon={CheckSquare}
                >
                  Approve Teams ({stats.overview.pendingApproval})
                </Button>
                <Button
                  onClick={() => navigate(`/hackathons/${id}/participants`)}
                  className="w-full justify-start"
                  variant="outline"
                  icon={Users}
                >
                  View Participants
                </Button>
                <Button
                  onClick={() => navigate(`/hackathons/${id}/coordinators-management`)}
                  className="w-full justify-start"
                  variant="outline"
                  icon={Shield}
                >
                  Manage Coordinators
                </Button>
                <Button
                  onClick={() => navigate(`/hackathons/${id}/rounds`)}
                  className="w-full justify-start"
                  variant="outline"
                  icon={Target}
                >
                  Manage Rounds
                </Button>
                <Button
                  onClick={() => navigate(`/hackathons/${id}/edit`)}
                  className="w-full justify-start"
                  variant="outline"
                  icon={Settings}
                >
                  Hackathon Settings
                </Button>
              </div>
            </div>

            {/* Team Status Summary */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Team Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-gray-700">Approved</span>
                  <span className="font-bold text-green-600">{stats.overview.approvedTeams}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-gray-700">Pending</span>
                  <span className="font-bold text-yellow-600">{stats.overview.pendingApproval}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-gray-700">Rejected</span>
                  <span className="font-bold text-red-600">{stats.overview.rejectedTeams}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-gray-700">Eliminated</span>
                  <span className="font-bold text-purple-600">{stats.overview.eliminatedTeams}</span>
                </div>
              </div>
            </div>

            {/* Revenue (if paid event) */}
            {stats.overview.totalRevenue > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Total Revenue</h3>
                </div>
                <div className="text-4xl font-bold text-green-600">
                  ₹{stats.overview.totalRevenue.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
