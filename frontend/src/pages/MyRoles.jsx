import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Shield,
  Award,
  Users,
  Trophy,
  ChevronRight,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { hackathonAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function MyRoles() {
  const { user } = useAuthStore();
  const [organizedHackathons, setOrganizedHackathons] = useState([]);
  const [coordinations, setCoordinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonsRes, coordinationsRes] = await Promise.all([
        hackathonAPI.getMyHackathons(),
        hackathonAPI.getMyCoordinations(),
      ]);

      setOrganizedHackathons(hackathonsRes.data.hackathons || []);
      setCoordinations(coordinationsRes.data.coordinations || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load your roles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your roles...</p>
        </div>
      </div>
    );
  }

  const hasOrganizerRole = organizedHackathons.length > 0;
  const hasCoordinatorRole = coordinations.length > 0;
  const hasJudgeRole = user?.roles?.includes('judge');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Roles</h1>
          <p className="text-gray-600">Overview of all your roles across hackathons</p>
        </div>

        {/* Role Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-gray-900">Participant</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {user?.roles?.includes('student') ? 'Yes' : 'No'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Organizer</h3>
            </div>
            <div className="text-3xl font-bold text-indigo-600">{organizedHackathons.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-gray-900">Coordinator</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">{coordinations.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-gray-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-gray-900">Judge</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {hasJudgeRole ? 'Yes' : 'No'}
            </div>
          </motion.div>
        </div>

        {/* Organizer Section */}
        {hasOrganizerRole && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Hackathons (Organizer)</h2>
              </div>
              <Link to="/create-hackathon">
                <Button size="sm">Create New</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {organizedHackathons.map((hackathon) => (
                <div
                  key={hackathon._id}
                  className="p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{hackathon.title}</h3>
                        <Badge variant={hackathon.status === 'ongoing' ? 'success' : 'default'}>
                          {hackathon.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {hackathon.description?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(hackathon.hackathonStartDate).toLocaleDateString()}
                        </div>
                        <span>•</span>
                        <span className="capitalize">{hackathon.mode}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/hackathons/${hackathon._id}/manage`}>
                        <Button size="sm" variant="outline">
                          Manage
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                      <Link to={`/hackathons/${hackathon._id}`}>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coordinator Section */}
        {hasCoordinatorRole && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Coordinator Roles</h2>
              </div>
              <Link to="/invitations">
                <Button size="sm" variant="outline">
                  View Invitations
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {coordinations.map((coordination) => (
                <div
                  key={coordination.hackathon._id}
                  className="p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {coordination.hackathon.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {coordination.permissions?.canViewTeams && (
                          <Badge variant="info">View Teams</Badge>
                        )}
                        {coordination.permissions?.canCheckIn && (
                          <Badge variant="info">Check-in</Badge>
                        )}
                        {coordination.permissions?.canAssignTables && (
                          <Badge variant="info">Assign Tables</Badge>
                        )}
                        {coordination.permissions?.canViewSubmissions && (
                          <Badge variant="info">View Submissions</Badge>
                        )}
                        {coordination.permissions?.canCommunicate && (
                          <Badge variant="info">Communicate</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>
                          Accepted on {new Date(coordination.acceptedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link to={`/coordinator/${coordination.hackathon._id}`}>
                      <Button size="sm">
                        Open Dashboard
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Roles Message */}
        {!hasOrganizerRole && !hasCoordinatorRole && !hasJudgeRole && (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Additional Roles</h3>
            <p className="text-gray-600 mb-6">
              You are currently a participant. You can be invited as a coordinator or judge by hackathon
              organizers.
            </p>
            <Link to="/hackathons">
              <Button>Browse Hackathons</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
