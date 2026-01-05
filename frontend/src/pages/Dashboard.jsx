import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Award,
  Briefcase,
  Bell,
  Mail,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuthStore, useTeamStore } from "../store";
import { teamAPI, authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { myTeams, setMyTeams } = useTeamStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joinRequests, setJoinRequests] = useState([]);
  const [removedTeams, setRemovedTeams] = useState([]);
  const [stats, setStats] = useState({
    participating: 0,
    coordinating: 0,
    pendingRequests: 0,
  });
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [freshUser, setFreshUser] = useState(null);
  const isCoordinator = freshUser?.coordinatorFor?.some(
    (c) => c.status === "accepted"
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [teamsRes, requestsRes, userRes] = await Promise.all([
        teamAPI.getMyTeams(),
        teamAPI.getMyJoinRequests().catch(() => ({ data: { joinRequests: [] } })),
        authAPI.getMe()
      ]);

      // Update fresh user data
      setFreshUser(userRes.data.user);

      setMyTeams(teamsRes.data.teams);
      setRemovedTeams(teamsRes.data.removedTeams || []);
      setJoinRequests(requestsRes.data.joinRequests || []);

      // Count accepted coordinator roles from fresh user data
      const coordinatingCount = userRes.data.user.coordinatorFor?.filter(
        (c) => c.status === "accepted"
      ).length || 0;

      // Count pending coordinator invitations
      const pending = userRes.data.user.coordinatorFor?.filter(
        c => c.status === 'pending'
      ) || [];
      setPendingInvitations(pending.length);

      setStats({
        participating: teamsRes.data.teams.length,
        coordinating: coordinatingCount,
        pendingRequests: requestsRes.data.joinRequests?.length || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, teamId) => {
    try {
      await teamAPI.acceptJoinRequest(teamId, requestId);
      toast.success("Successfully joined the team!");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId, teamId) => {
    try {
      await teamAPI.rejectJoinRequest(teamId, requestId);
      toast.success("Request rejected");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  const statCards = [
    {
      label: "My Teams",
      value: stats.participating,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      color: "text-purple-600",
      link: "#teams"
    },
    {
      label: "Join Requests",
      value: stats.pendingRequests,
      icon: Bell,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      color: "text-blue-600",
      link: "/team-requests",
      action: true
    },
  ];

  if (isCoordinator) {
    statCards.push({
      label: "Coordinating",
      value: stats.coordinating,
      icon: Briefcase,
      gradient: "from-green-500 to-green-600",
      bg: "bg-green-50",
      color: "text-green-600",
      link: "/my-coordinations"
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your hackathons
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={stat.link}
                  className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 block"
                >
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    {stat.value}
                    {stat.action && stat.value > 0 && (
                      <span className="animate-pulse">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                  {stat.action && stat.value > 0 && (
                    <div className="mt-3 text-xs text-blue-600 font-semibold flex items-center gap-1">
                      View requests <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Recent Join Requests */}
          {joinRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-2 border-gray-200 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Team Invitations
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {joinRequests.length} pending invitation{joinRequests.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  to="/team-requests"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {joinRequests.slice(0, 3).map((request) => (
                  <div
                    key={request._id}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          {request.team?.teamName}
                          <Mail className="w-4 h-4 text-blue-600" />
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {request.sender?.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.hackathon?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAcceptRequest(request._id, request.team._id)}
                        className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id, request.team._id)}
                        className="flex-1 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {pendingInvitations > 0 && (
  <Link 
    to="/invitations"
    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-6 hover:shadow-lg transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
        <Mail className="w-6 h-6 text-yellow-600" />
      </div>
      <div className="text-4xl font-bold text-yellow-900">
        {pendingInvitations}
      </div>
    </div>
    <h3 className="font-bold text-lg text-yellow-900 mb-1">
      Pending Invitations
    </h3>
    <p className="text-yellow-700 text-sm mb-3">
      You have coordinator invitations waiting!
    </p>
    <div className="flex items-center text-yellow-600 text-sm font-medium">
      <span>View Invitations</span>
      <Clock className="w-4 h-4 ml-2" />
    </div>
  </Link>
)}

          {/* My Teams */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8"
            id="teams"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  My Teams
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Teams you're participating in
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-100 rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-gray-600 mb-4">Not part of any team yet</p>
                <Link to="/hackathons">
                  <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    Browse Hackathons
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myTeams.slice(0, 3).map((team) => (
                  <Link
                    key={team._id}
                    to={`/teams/${team._id}`}
                    className="block p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {team.teamName}
                      </h4>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        team.registrationStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : team.registrationStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {team.registrationStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {team.members.length} members
                      </span>
                      <span>•</span>
                      <span className="truncate">{team.hackathon?.title}</span>
                      {team.checkIn?.isCheckedIn && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Checked In
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Removed Teams */}
          {removedTeams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white border-2 border-gray-200 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Removed From Teams
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Teams you were removed from
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {removedTeams.map((team) => (
                  <div
                    key={team._id}
                    className="block p-5 border-2 border-red-200 bg-red-50 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {team.teamName}
                      </h4>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                        Removed
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {team.members?.length || 0} members
                      </span>
                      <span>•</span>
                      <span className="truncate">{team.hackathon?.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/hackathons">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Browse Hackathons
                </h3>
                <p className="text-xs text-gray-600">Discover events</p>
              </div>
            </Link>

            <Link to="/team-requests">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group cursor-pointer relative">
                {stats.pendingRequests > 0 && (
                  <span className="absolute top-3 right-3 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {stats.pendingRequests}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Team Requests
                </h3>
                <p className="text-xs text-gray-600">Manage invitations</p>
              </div>
            </Link>

            {isCoordinator && (
              <Link to="/my-coordinations">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    My Coordinations
                  </h3>
                  <p className="text-xs text-gray-600">Manage events</p>
                </div>
              </Link>
            )}

            <Link to="/profile">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
                <p className="text-xs text-gray-600">View achievements</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}