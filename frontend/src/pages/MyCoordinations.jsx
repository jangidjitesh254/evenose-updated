import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Shield,
  Eye,
  UserCheck,
  Table,
  FileText,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function MyCoordinations() {
  const navigate = useNavigate();
  const [coordinations, setCoordinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted

  useEffect(() => {
    fetchCoordinations();
  }, []);

  const fetchCoordinations = async () => {
    try {
      setLoading(true);
      const response = await hackathonAPI.getMyCoordinations();
      setCoordinations(response.data.coordinations || []);
    } catch (error) {
      console.error('Failed to fetch coordinations:', error);
      toast.error('Failed to load coordinations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (coordinationId) => {
    try {
      await hackathonAPI.acceptCoordination(coordinationId);
      toast.success('Coordination accepted!');
      fetchCoordinations();
    } catch (error) {
      console.error('Failed to accept coordination:', error);
      toast.error(error.response?.data?.message || 'Failed to accept coordination');
    }
  };

  const filteredCoordinations = coordinations.filter(coord => {
    if (filter === 'all') return true;
    if (filter === 'pending') return coord.status === 'pending';
    if (filter === 'accepted') return coord.status === 'accepted';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Coordinations</h1>
          <p className="text-gray-600">
            Manage hackathons where you are invited as a coordinator
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({coordinations.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({coordinations.filter(c => c.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'accepted' ? 'primary' : 'outline'}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({coordinations.filter(c => c.status === 'accepted').length})
          </Button>
        </div>

        {/* Coordinations List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 skeleton rounded-xl"></div>
            ))}
          </div>
        ) : filteredCoordinations.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filter === 'pending' ? 'No Pending Invitations' : 
               filter === 'accepted' ? 'No Accepted Coordinations' : 
               'No Coordinations'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't been invited to coordinate any hackathons yet."
                : `You don't have any ${filter} coordinations.`}
            </p>
            <Button onClick={() => navigate('/hackathons')}>
              Browse Hackathons
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCoordinations.map((coordination, index) => (
              <CoordinationCard
                key={coordination._id}
                coordination={coordination}
                index={index}
                onAccept={handleAccept}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoordinationCard({ coordination, index, onAccept }) {
  const navigate = useNavigate();
  const { hackathon, permissions, status, invitedAt, acceptedAt } = coordination;

  const permissionsList = [
    { key: 'canViewTeams', icon: Eye, label: 'View Teams' },
    { key: 'canCheckIn', icon: UserCheck, label: 'Check-in' },
    { key: 'canAssignTables', icon: Table, label: 'Assign Tables' },
    { key: 'canViewSubmissions', icon: FileText, label: 'View Submissions' },
    { key: 'canCommunicate', icon: MessageSquare, label: 'Communicate' },
  ];

  const activePermissions = permissionsList.filter(p => permissions[p.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card hoverable className="h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={status === 'accepted' ? 'success' : 'warning'}>
                {status === 'pending' ? (
                  <><Clock className="w-3 h-3 mr-1" /> Pending</>
                ) : (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Accepted</>
                )}
              </Badge>
              <Badge variant="info">{hackathon.mode}</Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {hackathon.title}
            </h3>
          </div>
        </div>

        {/* Hackathon Info */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(hackathon.hackathonStartDate), 'MMM dd, yyyy')}
          </div>
          {hackathon.venue?.name && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {hackathon.venue.name}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Invited {format(new Date(invitedAt), 'MMM dd, yyyy')}
            {acceptedAt && ` • Accepted ${format(new Date(acceptedAt), 'MMM dd, yyyy')}`}
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Permissions:</h4>
          <div className="flex flex-wrap gap-2">
            {activePermissions.map((perm) => {
              const Icon = perm.icon;
              return (
                <div
                  key={perm.key}
                  className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                >
                  <Icon className="w-3 h-3" />
                  {perm.label}
                </div>
              );
            })}
            {activePermissions.length === 0 && (
              <p className="text-sm text-gray-500">No permissions assigned</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {status === 'pending' ? (
            <>
              <Button
                size="sm"
                onClick={() => onAccept(coordination._id)}
                icon={CheckCircle}
                className="flex-1"
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
                icon={XCircle}
                className="flex-1"
              >
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/coordinator/${hackathon._id}`)}
              icon={ArrowRight}
              iconPosition="right"
              className="flex-1"
            >
              Open Dashboard
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}