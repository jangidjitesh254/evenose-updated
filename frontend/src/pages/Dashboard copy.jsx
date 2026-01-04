import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Plus,
  Users,
  Award,
  Calendar,
  TrendingUp,
  Briefcase,
  Gavel,
  ArrowRight,
  Cross,
  CrossIcon,
} from "lucide-react";
import { useAuthStore, useHackathonStore, useTeamStore } from "../store";
import { hackathonAPI, teamAPI } from "../services/api";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { format, set } from "date-fns";
import Input from "../components/ui/Input";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { myHackathons, setMyHackathons } = useHackathonStore();
  const { myTeams, setMyTeams } = useTeamStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    organized: 0,
    participating: 0,
    coordinating: 0,
    judging: 0,
  });
  const roles = user?.roles || [];

  const isStudent = roles.includes("student");
  const isCoordinator = user?.coordinatorFor?.some(
    (c) => c.status === "accepted"
  );
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [hackathonsRes, teamsRes] = await Promise.all([
        hackathonAPI.getMyHackathons(),
        teamAPI.getMyTeams(),
      ]);

      setMyHackathons(hackathonsRes.data.hackathons);
      setMyTeams(teamsRes.data.teams);

      setStats({
        organized: 0, // student cannot organize
        participating: teamsRes.data.teams.length,
        coordinating: isCoordinator
          ? user.coordinatorFor.filter((c) => c.status === "accepted").length
          : 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = () => {
    document.querySelector("#createTeamModal").classList.remove("hidden");
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // API call to create team
    // Close modal after creation
  };
  const closeCreateTeamModal = () => {
    document.querySelector("#createTeamModal").classList.add("hidden");
    setTeamName("");
    setTeamDescription("");
  };

  const statCards = [
    {
      label: "Participating",
      value: stats.participating,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Coordinating",
      value: stats.coordinating,
      icon: Briefcase,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-white py-8">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}
                >
                  <Icon
                    className={`w-6 h-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}
                    style={{ WebkitTextFillColor: "transparent" }}
                  />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* My Teams */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8"
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
              <div>
                <Button onClick={() => createTeam()}>Create Team</Button>
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
                  <Button variant="outline" size="sm">
                    Browse Hackathons
                  </Button>
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
                      <Badge
                        variant={
                          team.registrationStatus === "approved"
                            ? "success"
                            : team.registrationStatus === "pending"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {team.registrationStatus}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {team.members.length} members • {team.hackathon?.title}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
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

            {isCoordinator && (
              <Link to="/my-coordinations">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    My Coordinations
                  </h3>
                  <p className="text-xs text-gray-600">Manage events</p>
                </div>
              </Link>
            )}

            <Link to="/profile">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
                <p className="text-xs text-gray-600">View achievements</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Create Team Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          id="createTeamModal"
          className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="header flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Create New Team
                  </h3>
                  <span className="text-gray-400 text-sm">
                    Enter details to create a new team
                  </span>
                </div>
                <button
                  onClick={() => closeCreateTeamModal()}
                  variant="cancel"
                  type="button"
                  className="cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full p-2 inline-flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-x-icon lucide-x"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <Input
                  type="text"
                  placeholder="Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-3 mb-4"
                />
                <Input
                  type="text"
                  placeholder="Team Description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="w-full p-3 mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="cancel"
                    type="submit"
                    className=""
                    onClick={() => closeCreateTeamModal()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Team</Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
