import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Edit,
  UserPlus,
  Download,
  Award,
  Target,
  AlertCircle,
  ChevronRight,
  Link2,
  Share2,
  Copy,
  Search,
  Shield,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { hackathonAPI, teamAPI } from '../services/api';
import { useAuthStore } from '../store';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import CoordinatorsManagement from './CoordinatorsManagement';

export default function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteType, setInviteType] = useState('coordinator');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchHackathon();
    checkUserRegistration();
  }, [id]);

  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const response = await hackathonAPI.getById(id);
      setHackathon(response.data.hackathon);

      // Fetch teams if organizer/coordinator
      if (isOrganizerOrCoordinator(response.data.hackathon)) {
        try {
          const teamsResponse = await teamAPI.getByHackathon(id);
          setTeams(teamsResponse.data.teams || []);
        } catch (error) {
          console.error('Failed to fetch teams:', error);
        }
      }

      // Fetch leaderboard
      try {
        const leaderboardResponse = await teamAPI.getLeaderboard(id);
        setLeaderboard(leaderboardResponse.data.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
      toast.error('Failed to load hackathon');
    } finally {
      setLoading(false);
    }
  };

  const checkUserRegistration = async () => {
    if (!user) return;
    
    try {
      const response = await teamAPI.getUserTeamForHackathon(id);
      if (response.data.team) {
        setUserTeam(response.data.team);
      }
    } catch (error) {
      // User not registered, that's fine
      console.log('User not registered for this hackathon');
    }
  };

  const isOrganizerOrCoordinator = (hack = hackathon) => {
    if (!hack || !user) return false;
    const isOrg = hack.organizer?._id === user._id || 
                  hack.organizer === user._id || 
                  hack.organizer?._id === user.id || 
                  hack.organizer === user.id;
    const isCoord = user.coordinatorFor?.some(c => 
      c.hackathon === hack._id || 
      c.hackathon?._id === hack._id ||
      c.hackathon === hack.id ||
      c.hackathon?._id === hack.id
    );
    return isOrg || isCoord;
  };

  const isOrganizer = (hack = hackathon) => {
    if (!hack || !user) return false;
    return hack.organizer?._id === user._id ||
           hack.organizer === user._id ||
           hack.organizer?._id === user.id ||
           hack.organizer === user.id;
  };

  const isCoordinator = (hack = hackathon) => {
    if (!hack || !user) return false;
    return user.coordinatorFor?.some(c =>
      c.hackathon === hack._id ||
      c.hackathon?._id === hack._id ||
      c.hackathon === hack.id ||
      c.hackathon?._id === hack.id
    );
  };

  const isAdmin = () => {
    return user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
  };

  const handleRegister = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (userTeam) {
      toast.error('You are already registered for this hackathon');
      return;
    }
    
    setShowRegisterModal(true);
  };

  const handleJoinRequest = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowJoinRequestModal(true);
  };

  const handleShareTeamLink = () => {
    if (!userTeam) return;
    setShowShareModal(true);
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await teamAPI.searchUsersForTeam(id, query);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const sendJoinRequest = async (userId) => {
    if (!userTeam) {
      toast.error('You need to have a team to send requests');
      return;
    }

    try {
      await teamAPI.sendJoinRequest(userTeam._id, { userId });
      toast.success('Join request sent successfully!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send join request');
    }
  };

  const handleInvite = async (data) => {
    if (!hackathon || !hackathon._id) {
      toast.error('Hackathon data not loaded. Please refresh the page.');
      console.error('Hackathon object:', hackathon);
      return;
    }

    try {
      if (inviteType === 'coordinator') {
        await hackathonAPI.inviteCoordinator(hackathon._id, {
          emailOrUsername: data.emailOrUsername,
          permissions: data.permissions || {
            canViewTeams: true,
            canCheckIn: true,
            canAssignTables: false,
            canViewSubmissions: true,
            canEliminateTeams: false,
            canCommunicate: true,
          }
        });
        toast.success('Coordinator invited successfully!');
      } else {
        await hackathonAPI.inviteJudge(hackathon._id, {
          emailOrUsername: data.emailOrUsername,
        });
        toast.success('Judge invited successfully!');
      }
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const copyTeamLink = () => {
    const link = `${window.location.origin}/teams/${userTeam._id}/join`;
    navigator.clipboard.writeText(link);
    toast.success('Team join link copied to clipboard!');
  };

  const copyShareableLink = () => {
    const link = `${window.location.origin}/hackathons/${hackathon._id}`;
    navigator.clipboard.writeText(link);
    toast.success('Hackathon link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading hackathon...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hackathon Not Found</h2>
          <p className="text-gray-600 mb-6">The hackathon you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/hackathons')}>Browse Hackathons</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'rounds', label: 'Rounds', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  if (isOrganizerOrCoordinator() || isAdmin()) {
    tabs.push({ id: 'teams', label: 'Teams', icon: Users });
  }

  if (isOrganizer() || isAdmin()) {
    tabs.push({ id: 'coordinators', label: 'Coordinators', icon: Shield });
  }

  if (isOrganizerOrCoordinator() || isAdmin()) {
    tabs.push({ id: 'registrations', label: 'Registrations', icon: CheckCircle });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <Badge variant={hackathon.status === 'registration_open' ? 'success' : 'secondary'}>
                    {hackathon.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="info">{hackathon.mode}</Badge>
                  {hackathon.registrationFee?.amount > 0 && (
                    <Badge>₹{hackathon.registrationFee.amount}</Badge>
                  )}
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                  {hackathon.title}
                </h1>
                <p className="text-lg lg:text-xl mb-8 text-indigo-100 max-w-3xl leading-relaxed">
                  {hackathon.description}
                </p>
                
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {format(new Date(hackathon.hackathonStartDate), 'MMM dd')} - 
                      {format(new Date(hackathon.hackathonEndDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {hackathon.venue?.name && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <MapPin className="w-5 h-5" />
                      <span>{hackathon.venue.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <Users className="w-5 h-5" />
                    <span>{hackathon.currentRegistrations || 0}/{hackathon.maxTeams} Teams</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  icon={Share2}
                  onClick={copyShareableLink}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  Share
                </Button>

                {/* Organizer Buttons */}
                {isOrganizer() && (
                  <>
                    <Button
                      icon={Settings}
                      onClick={() => navigate(`/hackathons/${hackathon._id}/manage`)}
                      className="bg-white text-indigo-600 hover:bg-indigo-50"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      icon={Edit}
                      onClick={() => navigate(`/hackathons/${hackathon._id}/edit`)}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      Edit
                    </Button>
                  </>
                )}

                {/* Coordinator Buttons */}
                {isCoordinator() && !isOrganizer() && (
                  <Button
                    icon={Shield}
                    onClick={() => navigate(`/coordinator/${hackathon._id}`)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50"
                  >
                    Coordinator Dashboard
                  </Button>
                )}

                {/* Registration/Team Management Buttons */}
                {hackathon.status === 'registration_open' && !isOrganizerOrCoordinator() && (
                  <>
                    {!userTeam ? (
                      <Button
                        icon={UserPlus}
                        onClick={handleRegister}
                        className="bg-white text-indigo-600 hover:bg-indigo-50"
                      >
                        Register Team
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          icon={Users}
                          onClick={() => navigate(`/teams/${userTeam._id}`)}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          My Team
                        </Button>
                        {userTeam.leader === user._id || userTeam.leader?._id === user._id ? (
                          <Button
                            icon={Link2}
                            onClick={handleShareTeamLink}
                            className="bg-white text-indigo-600 hover:bg-indigo-50"
                          >
                            Invite Members
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* User Team Status Banner */}
      {userTeam && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    You're registered as part of "{userTeam.teamName}"
                  </p>
                  <p className="text-sm text-gray-600">
                    {userTeam.members?.length || 0} members •
                    Status: {userTeam.registrationStatus}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Users}
                  onClick={() => navigate(`/teams/${userTeam._id}`)}
                >
                  Team Details
                </Button>
                {userTeam.registrationStatus === 'approved' && (
                  <Button
                    size="sm"
                    icon={TrendingUp}
                    onClick={() => navigate(`/teams/${userTeam._id}/progress`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View Progress
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b-2 border-gray-200 bg-white/90 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-semibold flex items-center gap-2 transition-all whitespace-nowrap rounded-t-xl ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab hackathon={hackathon} />}
          {activeTab === 'rounds' && <RoundsTab rounds={hackathon.rounds} />}
          {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} />}
          {activeTab === 'teams' && (isOrganizerOrCoordinator() || isAdmin()) && (
            <TeamsTab 
              teams={teams} 
              hackathon={hackathon}
              isOrganizer={isOrganizer()}
              isAdmin={isAdmin()}
              onInvite={(type) => {
                setInviteType(type);
                setShowInviteModal(true);
              }}
            />
          )}
          {activeTab === 'coordinators' && (isOrganizer() || isAdmin()) && (
            <CoordinatorsManagement 
              hackathon={hackathon}
              isOrganizer={isOrganizer()}
              onRefresh={fetchHackathon}
            />
          )}
          {activeTab === 'registrations' && (isOrganizerOrCoordinator() || isAdmin()) && (
            <RegistrationsTab 
              hackathon={hackathon} 
              teams={teams}
              isOrganizer={isOrganizer()}
              onRefresh={fetchHackathon}
            />
          )}
        </motion.div>
      </div>

      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        hackathon={hackathon}
        onSuccess={() => {
          fetchHackathon();
          checkUserRegistration();
        }}
      />

      {/* Share Team Link Modal */}
      {userTeam && (
        <ShareTeamLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          team={userTeam}
          hackathon={hackathon}
          onSearch={searchUsers}
          searchResults={searchResults}
          searching={searching}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSendRequest={sendJoinRequest}
        />
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        type={inviteType}
        onSubmit={handleInvite}
      />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ hackathon }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {hackathon.description}
          </p>
          <div className="flex mt-4">
            <img src={hackathon.organizer?.profilePicture || 'https://i.pinimg.com/originals/c5/07/8e/c5078ec7b5679976947d90e4a19e1bbb.jpg'} alt="Organizer" className="w-12 h-12 rounded-full object-cover mr-4" />
            <div>
              <h3 className="font-bold text-gray-900">Organized by</h3>
              <p className="text-gray-600">{hackathon.organizer?.fullName || 'Organizer Name'}</p>
            </div>
          </div>
        </motion.div>

        {hackathon.judgingCriteria && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Judging Criteria</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{hackathon.judgingCriteria}</p>
          </motion.div>
        )}

        {hackathon.prizes && hackathon.prizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Prizes</h2>
            </div>
            <div className="space-y-4">
              {hackathon.prizes.map((prize, index) => (
                <div key={index} className="flex justify-between items-center p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl hover:border-indigo-300 transition-all">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{prize.position}</h3>
                    {prize.description && (
                      <p className="text-sm text-gray-600 mt-1">{prize.description}</p>
                    )}
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-indigo-600">
                    {prize.amount !== null && prize.amount !== undefined ? `₹${prize.amount.toLocaleString()}` : 'TBA'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border-2 border-gray-200 rounded-3xl p-8 sticky top-32"
        >
          <div className="flex mb-4">
            <img className='rounded-xl border border-gray-200' src="https://d8it4huxumps7.cloudfront.net/uploads/images/opportunity/mobile_banner/694e8a2ea176b_e-raksha-hackathon-2026.png?d=700x400" alt="" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Quick Info</h2>
          <div className="space-y-5">
            
            <InfoItem
              icon={Calendar}
              label="Registration"
              value={`${format(new Date(hackathon.registrationStartDate), 'MMM dd')} - ${format(new Date(hackathon.registrationEndDate), 'MMM dd, yyyy')}`}
            />
            <InfoItem
              icon={Users}
              label="Team Size"
              value={`${hackathon.teamConfig.minMembers}-${hackathon.teamConfig.maxMembers} members`}
            />
            <InfoItem
              icon={DollarSign}
              label="Registration Fee"
              value={hackathon.registrationFee?.amount === 0 ? 'Free' : `₹${hackathon.registrationFee?.amount}`}
            />
            {hackathon.mode !== 'online' && hackathon.venue?.name && (
              <InfoItem
                icon={MapPin}
                label="Venue"
                value={hackathon.venue.name}
              />
            )}
          </div>
        </motion.div>

        {hackathon.tags && hackathon.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8"
          >
            <h3 className="font-bold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {hackathon.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Rounds Tab Component
function RoundsTab({ rounds }) {
  return (
    <div className="space-y-4">
      {rounds && rounds.length > 0 ? (
        rounds.map((round, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8 hover:border-indigo-300 transition-all"
          >
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{round.name}</h3>
                </div>
                <p className="text-gray-600 ml-13">{round.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="info">{round.type}</Badge>
                <Badge>{round.mode}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ml-13">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1 font-medium">Start Time</p>
                <p className="font-bold text-gray-900">{format(new Date(round.startTime), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1 font-medium">End Time</p>
                <p className="font-bold text-gray-900">{format(new Date(round.endTime), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>

            {round.judgingCriteria && round.judgingCriteria.length > 0 && (
              <div className="ml-13">
                <h4 className="font-bold text-gray-900 mb-3">Judging Criteria:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {round.judgingCriteria.map((criteria, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gradient-to-br from-indigo-50 to-white border-2 border-gray-200 rounded-xl">
                      <span className="font-medium text-gray-900">{criteria.name}</span>
                      <span className="font-bold text-indigo-600">{criteria.maxPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600">No rounds configured yet</p>
        </div>
      )}
    </div>
  );
}

// Leaderboard Tab Component
function LeaderboardTab({ leaderboard }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden">
      {leaderboard && leaderboard.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Members</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-200">
              {leaderboard.map((team, index) => (
                <motion.tr 
                  key={team._id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white' : 
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-white' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-white' : ''
                  }`}
                >
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-yellow-600" />
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-orange-600" />
                        </div>
                      )}
                      {index > 2 && <div className="w-8"></div>}
                      <span className="text-xl font-bold text-gray-900">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{team.teamName || team.name}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-2xl font-bold text-indigo-600">{team.totalScore || team.overallScore || 0}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{team.members?.length || 0}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600">No scores yet</p>
        </div>
      )}
    </div>
  );
}

// Teams Tab Component (Enhanced)
function TeamsTab({ teams, hackathon, isOrganizer, isAdmin, onInvite }) {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter(team => {
    const matchesStatus = filterStatus === 'all' || team.registrationStatus === filterStatus;
    const matchesSearch = !searchQuery || 
      team.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.teamNumber?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {isOrganizer && (
            <>
              <Button icon={UserPlus} onClick={() => onInvite('coordinator')}>
                Invite Coordinator
              </Button>
              <Button variant="outline" icon={UserPlus} onClick={() => onInvite('judge')}>
                Invite Judge
              </Button>
            </>
          )}
          {isAdmin && (
            <Button variant="outline" icon={Download} onClick={() => {
              // Export functionality
              toast.info('Export feature coming soon!');
            }}>
              Export Data
            </Button>
          )}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Input
            icon={Search}
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden">
        {filteredTeams && filteredTeams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Leader</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Members</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {filteredTeams.map((team, index) => (
                  <motion.tr 
                    key={team._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{team.teamName}</div>
                        {team.teamNumber && (
                          <div className="text-sm text-gray-500">#{team.teamNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {team.leader?.fullName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{team.members?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <Badge variant={
                        team.registrationStatus === 'approved' ? 'success' : 
                        team.registrationStatus === 'pending' ? 'warning' : 'danger'
                      }>
                        {team.registrationStatus}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <Badge variant={
                        team.payment?.status === 'completed' ? 'success' : 
                        team.payment?.status === 'pending' ? 'warning' : 'secondary'
                      }>
                        {team.payment?.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/teams/${team._id}`)}
                        >
                          View
                        </Button>
                        {isAdmin && team.registrationStatus === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={async () => {
                                try {
                                  await teamAPI.approveTeam(team._id);
                                  toast.success('Team approved!');
                                  window.location.reload();
                                } catch (error) {
                                  toast.error('Failed to approve team');
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger"
                              onClick={async () => {
                                try {
                                  await teamAPI.rejectTeam(team._id);
                                  toast.success('Team rejected');
                                  window.location.reload();
                                } catch (error) {
                                  toast.error('Failed to reject team');
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all' ? 'No teams match your filters' : 'No teams registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Registrations Tab (Admin Only)
function RegistrationsTab({ hackathon, teams, isOrganizer, onRefresh }) {
  const navigate = useNavigate();
  
  const stats = {
    total: teams.length,
    approved: teams.filter(t => t.submissionStatus === 'approved' || t.registrationStatus === 'approved').length,
    pending: teams.filter(t => t.submissionStatus === 'submitted' || (t.submissionStatus === 'draft' && t.registrationStatus === 'pending')).length,
    rejected: teams.filter(t => t.submissionStatus === 'draft' && t.rejectionReason).length,
    paid: teams.filter(t => t.payment?.status === 'completed').length,
  };

  const pendingTeams = teams.filter(t => t.submissionStatus === 'submitted');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Teams</div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-2xl p-6">
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-600 mt-1">Approved</div>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-2xl p-6">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600 mt-1">Pending</div>
        </div>
        <div className="bg-white border-2 border-red-200 rounded-2xl p-6">
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600 mt-1">Rejected</div>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.paid}</div>
          <div className="text-sm text-gray-600 mt-1">Paid</div>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {isOrganizer && pendingTeams.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-yellow-900 mb-2">
                {pendingTeams.length} team{pendingTeams.length !== 1 ? 's' : ''} waiting for approval
              </h4>
              <p className="text-yellow-700 mb-3">
                Review and approve team registrations to allow participants to join the hackathon.
              </p>
              <Button
                variant="primary"
                icon={CheckCircle}
                onClick={() => navigate(`/hackathons/${hackathon._id}/approvals`)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Review Team Submissions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Timeline */}
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Registration Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Capacity</span>
            <span className="font-semibold">{hackathon.currentRegistrations}/{hackathon.maxTeams}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${(hackathon.currentRegistrations / hackathon.maxTeams) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isOrganizer && (
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              icon={CheckCircle}
              onClick={() => navigate(`/hackathons/${hackathon._id}/approvals`)}
            >
              Manage Team Approvals
            </Button>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => {
                window.open(`${import.meta.env.VITE_API_URL}/teams/hackathon/${hackathon._id}/export`, '_blank');
                toast.success('Downloading teams data...');
              }}
            >
              Export Teams CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Register Modal Component
function RegisterModal({ isOpen, onClose, hackathon, onSuccess }) {
  const [teamName, setTeamName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await teamAPI.register({
        hackathonId: hackathon._id,
        teamName,
        projectTitle,
        members: [],
      });
      toast.success('Team registered successfully!');
      onClose();
      onSuccess();
      setTeamName('');
      setProjectTitle('');
    } catch (error) {
      console.error('Failed to register team:', error);
      toast.error(error.response?.data?.message || 'Failed to register team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Your Team">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
        <Input
          label="Project Title"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          required
        />
        <div className="flex gap-3 justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Register Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Share Team Link Modal Component
function ShareTeamLinkModal({ 
  isOpen, 
  onClose, 
  team, 
  hackathon,
  onSearch,
  searchResults,
  searching,
  searchQuery,
  setSearchQuery,
  onSendRequest
}) {
  const teamLink = `${window.location.origin}/teams/${team._id}/join`;

  const copyLink = () => {
    navigator.clipboard.writeText(teamLink);
    toast.success('Team join link copied to clipboard!');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Members">
      <div className="space-y-6">
        {/* Share Link Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Share Team Join Link
          </label>
          <div className="flex gap-2">
            <Input
              value={teamLink}
              readOnly
              className="flex-1"
            />
            <Button icon={Copy} onClick={copyLink}>
              Copy
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Share this link with people you want to invite to your team
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or search and invite</span>
          </div>
        </div>

        {/* Search Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Users
          </label>
          <Input
            icon={Search}
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
          />

          {/* Search Results */}
          {searching && (
            <div className="mt-3 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-indigo-600">
                        {user.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSendRequest(user._id)}
                  >
                    Send Request
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="mt-3 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Invite Modal Component
function InviteModal({ isOpen, onClose, type, onSubmit }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [permissions, setPermissions] = useState({
    canViewTeams: true,
    canCheckIn: true,
    canAssignTables: false,
    canViewSubmissions: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ emailOrUsername, permissions });
    setEmailOrUsername('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invite ${type === 'coordinator' ? 'Coordinator' : 'Judge'}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email or Username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          required
        />
        {type === 'coordinator' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Permissions:</p>
            <div className="space-y-2">
              {Object.keys(permissions).map((key) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}