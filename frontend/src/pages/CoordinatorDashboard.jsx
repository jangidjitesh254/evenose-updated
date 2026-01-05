import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Download, UserCheck, Hash, ArrowLeft, Users, CheckCircle, Clock, BarChart3, Table as TableIcon, Shield } from 'lucide-react';
import { hackathonAPI, teamAPI } from '../services/api';
import { useAuthStore } from '../store';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function CoordinatorDashboard() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkInFilter, setCheckInFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [assignData, setAssignData] = useState({ tableNumber: '', teamNumber: '' });
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [hackathonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, teamsRes] = await Promise.all([
        hackathonAPI.getById(hackathonId),
        teamAPI.getByHackathon(hackathonId),
      ]);

      setHackathon(hackathonRes.data.hackathon);
      setTeams(teamsRes.data.teams || []);
      // Get user's permissions for this hackathon
      const coordinator = hackathonRes.data.hackathon.coordinators.find(
        c => c.user?._id === user?.id || c.user === user?.id
      );

      console.log('Coordinator permissions:', coordinator?.permissions);
      setPermissions(coordinator?.permissions || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (teamId) => {
    if (!permissions.canCheckIn) {
      toast.error('You do not have permission to check-in teams');
      return;
    }

    try {
      await teamAPI.checkIn(teamId);
      toast.success('Team checked in successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to check-in team:', error);
      toast.error(error.response?.data?.message || 'Failed to check-in team');
    }
  };

  const handleMemberCheckIn = async (memberId) => {
    if (!permissions.canCheckIn) {
      toast.error('You do not have permission to check-in members');
      return;
    }

    try {
      await teamAPI.checkInMember(selectedTeam._id, memberId);
      toast.success('Member checked in successfully!');
      // Refresh the team data
      const updatedTeam = await teamAPI.getById(selectedTeam._id);
      setSelectedTeam(updatedTeam.data.team);
      fetchData();
    } catch (error) {
      console.error('Failed to check-in member:', error);
      toast.error(error.response?.data?.message || 'Failed to check-in member');
    }
  };

  const handleBulkCheckIn = async () => {
    if (!permissions.canCheckIn) {
      toast.error('You do not have permission to check-in teams');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to check in');
      return;
    }

    try {
      await teamAPI.bulkCheckInMembers(selectedTeam._id, {
        memberIds: selectedMembers,
        tableNumber: assignData.tableNumber || undefined,
        teamNumber: assignData.teamNumber || undefined,
      });
      toast.success(`Successfully checked in ${selectedMembers.length} member(s)!`);
      setShowCheckInModal(false);
      setSelectedTeam(null);
      setSelectedMembers([]);
      setAssignData({ tableNumber: '', teamNumber: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to check-in members:', error);
      toast.error(error.response?.data?.message || 'Failed to check-in members');
    }
  };

  const handleCheckInAll = async () => {
    if (!permissions.canCheckIn) {
      toast.error('You do not have permission to check-in teams');
      return;
    }

    try {
      const activeMembers = selectedTeam.members.filter(m => m.status === 'active');
      const memberIds = activeMembers
        .filter(m => !m.checkIn?.isCheckedIn)
        .map(m => m.user._id || m.user);

      await teamAPI.bulkCheckInMembers(selectedTeam._id, {
        memberIds,
        tableNumber: assignData.tableNumber || undefined,
        teamNumber: assignData.teamNumber || undefined,
      });
      toast.success('All members checked in successfully!');
      setShowCheckInModal(false);
      setSelectedTeam(null);
      setSelectedMembers([]);
      setAssignData({ tableNumber: '', teamNumber: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to check-in all members:', error);
      toast.error(error.response?.data?.message || 'Failed to check-in all members');
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleOpenCheckInModal = (team) => {
    setSelectedTeam(team);
    setAssignData({
      tableNumber: team.tableNumber || '',
      teamNumber: team.teamNumber || '',
    });
    // Pre-select unchecked members
    const uncheckedMembers = team.members
      ?.filter(m => m.status === 'active' && !m.checkIn?.isCheckedIn)
      .map(m => m.user._id || m.user) || [];
    setSelectedMembers(uncheckedMembers);
    setShowCheckInModal(true);
  };

  const handleAssign = async () => {
    if (!permissions.canAssignTables) {
      toast.error('You do not have permission to assign tables/numbers');
      return;
    }

    try {
      await teamAPI.assign(selectedTeam._id, {
        tableNumber: assignData.tableNumber ? parseInt(assignData.tableNumber) : undefined,
        teamNumber: assignData.teamNumber ? parseInt(assignData.teamNumber) : undefined,
      });
      toast.success('Assignment successful!');
      setShowAssignModal(false);
      setSelectedTeam(null);
      setAssignData({ tableNumber: '', teamNumber: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error(error.response?.data?.message || 'Failed to assign');
    }
  };

  const exportTeams = () => {
    // Simple CSV export
    const csv = [
      ['Team Name', 'Members', 'Status', 'Check-in', 'Table', 'Team Number'].join(','),
      ...teams.map(team => [
        team.teamName,
        team.members?.length || 0,
        team.registrationStatus,
        team.checkIn?.status || 'not checked-in',
        team.tableNumber || 'N/A',
        team.teamNumber || 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hackathon?.title || 'hackathon'}-teams.csv`;
    a.click();
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.teamName?.toLowerCase().includes(search.toLowerCase()) ||
                          team.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
                          team.members?.some(m =>
                            m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                            m.user?.email?.toLowerCase().includes(search.toLowerCase())
                          );
    const matchesStatus = statusFilter === 'all' || team.registrationStatus === statusFilter;

    let matchesCheckIn = true;
    if (checkInFilter === 'checked-in') {
      matchesCheckIn = team.checkIn?.isCheckedIn === true;
    } else if (checkInFilter === 'not-checked-in') {
      matchesCheckIn = !team.checkIn?.isCheckedIn;
    } else if (checkInFilter === 'partial') {
      const activeMembers = team.members?.filter(m => m.status === 'active') || [];
      const checkedInMembers = activeMembers.filter(m => m.checkIn?.isCheckedIn);
      matchesCheckIn = checkedInMembers.length > 0 && checkedInMembers.length < activeMembers.length;
    }

    return matchesSearch && matchesStatus && matchesCheckIn;
  });

  // Calculate statistics
  const stats = {
    totalTeams: teams.length,
    approvedTeams: teams.filter(t => t.registrationStatus === 'approved').length,
    pendingTeams: teams.filter(t => t.registrationStatus === 'pending').length,
    checkedInTeams: teams.filter(t => t.checkIn?.isCheckedIn).length,
    totalMembers: teams.reduce((sum, t) => sum + (t.members?.filter(m => m.status === 'active').length || 0), 0),
    checkedInMembers: teams.reduce((sum, t) => {
      const checkedIn = t.members?.filter(m => m.status === 'active' && m.checkIn?.isCheckedIn).length || 0;
      return sum + checkedIn;
    }, 0),
  };

  const getCheckInProgress = (team) => {
    const activeMembers = team.members?.filter(m => m.status === 'active') || [];
    const checkedInMembers = activeMembers.filter(m => m.checkIn?.isCheckedIn);
    return {
      checkedIn: checkedInMembers.length,
      total: activeMembers.length,
      percentage: activeMembers.length > 0 ? (checkedInMembers.length / activeMembers.length) * 100 : 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/my-coordinations')}
            className="mb-4"
          >
            Back to Coordinations
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {hackathon?.title}
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Coordinator Dashboard - Team Management
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mt-1">{stats.totalTeams}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 font-semibold">{stats.approvedTeams} approved</span>, {stats.pendingTeams} pending
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Team Check-ins</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.checkedInTeams}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-green-600">
                    {stats.totalTeams > 0 ? Math.round((stats.checkedInTeams / stats.totalTeams) * 100) : 0}%
                  </span> complete
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalTeams > 0 ? (stats.checkedInTeams / stats.totalTeams) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all teams
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Member Check-ins</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.checkedInMembers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-yellow-600">
                    {stats.totalMembers > 0 ? Math.round((stats.checkedInMembers / stats.totalMembers) * 100) : 0}%
                  </span> complete
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalMembers > 0 ? (stats.checkedInMembers / stats.totalMembers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl">
                <BarChart3 className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6" noTransform={true}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                icon={Search}
                placeholder="Search teams, members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input border-2 border-gray-200 rounded-xl px-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value)}
              className="input border-2 border-gray-200 rounded-xl px-2"
            >
              <option value="all">All Check-in</option>
              <option value="checked-in">Checked In</option>
              <option value="partial">Partially Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
            {permissions.canAssignTables && (
              <Button
                icon={TableIcon}
                onClick={() => navigate(`/coordinator/${hackathonId}/table-assignment`)}
                variant="secondary"
              >
                Assign Table
              </Button>
            )}
            <Button icon={Download} onClick={exportTeams} variant="secondary">
              Export
            </Button>
          </div>
        </Card>

        {/* Permissions Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg p-6 border-2 border-blue-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Your Coordinator Permissions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(permissions).map(([key, value]) => (
              value && (
                <div key={key} className="bg-white rounded-xl p-3 border border-blue-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">
                    {key.replace(/([A-Z])/g, ' $1').trim().replace(/^can /, '')}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Teams Table */}
        <Card className="overflow-hidden" noTransform={true}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.map((team) => (
                  <tr key={team._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.members?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={team.registrationStatus === 'approved' ? 'success' : 'warning'}>
                        {team.registrationStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const progress = getCheckInProgress(team);
                        return (
                          <div>
                            <Badge variant={progress.checkedIn === progress.total && progress.total > 0 ? 'success' : progress.checkedIn > 0 ? 'warning' : 'secondary'}>
                              {progress.checkedIn}/{progress.total} members
                            </Badge>
                            {progress.total > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${progress.percentage === 100 ? 'bg-green-600' : progress.percentage > 0 ? 'bg-yellow-600' : 'bg-gray-400'}`}
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.tableNumber || team.teamNumber ? (
                        <div>
                          {team.tableNumber && <div>Table: {team.tableNumber}</div>}
                          {team.teamNumber && <div>Team: {team.teamNumber}</div>}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {permissions.canCheckIn && (
                        <Button
                          size="sm"
                          icon={UserCheck}
                          onClick={() => handleOpenCheckInModal(team)}
                          variant={getCheckInProgress(team).percentage === 100 ? 'outline' : 'primary'}
                        >
                          Check-in
                        </Button>
                      )}
                      {permissions.canAssignTables && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Hash}
                          onClick={() => {
                            setSelectedTeam(team);
                            setAssignData({
                              tableNumber: team.tableNumber || '',
                              teamNumber: team.teamNumber || '',
                            });
                            setShowAssignModal(true);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No teams found
            </div>
          )}
        </Card>

        {/* Member Check-in Modal */}
        <Modal
          isOpen={showCheckInModal}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedTeam(null);
            setSelectedMembers([]);
            setAssignData({ tableNumber: '', teamNumber: '' });
          }}
          title={`Team Check-in: ${selectedTeam?.teamName}`}
        >
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-2xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  Check-in Progress
                </h4>
                {selectedTeam && (() => {
                  const progress = getCheckInProgress(selectedTeam);
                  return (
                    <div className={`px-4 py-2 rounded-xl font-bold ${
                      progress.percentage === 100
                        ? 'bg-green-100 text-green-700'
                        : progress.percentage > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {progress.checkedIn}/{progress.total} Members
                    </div>
                  );
                })()}
              </div>
              {selectedTeam && (() => {
                const progress = getCheckInProgress(selectedTeam);
                return (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all ${progress.percentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : progress.percentage > 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gray-400'}`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center font-semibold">
                      {Math.round(progress.percentage)}% Complete
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Table Assignment Section */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-2xl border-2 border-blue-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-blue-600" />
                Assign Table & Team Number
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Table Number</label>
                  <input
                    type="text"
                    value={assignData.tableNumber}
                    onChange={(e) => setAssignData({ ...assignData, tableNumber: e.target.value })}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Team Number</label>
                  <input
                    type="text"
                    value={assignData.teamNumber}
                    onChange={(e) => setAssignData({ ...assignData, teamNumber: e.target.value })}
                    placeholder="e.g., 42"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                  />
                </div>
              </div>
              {(selectedTeam?.tableNumber || selectedTeam?.teamNumber) && (
                <div className="mt-3 p-3 bg-blue-100 rounded-xl">
                  <p className="text-sm font-semibold text-blue-900">
                    Current Assignment:
                    {selectedTeam.tableNumber && ` Table ${selectedTeam.tableNumber}`}
                    {selectedTeam.tableNumber && selectedTeam.teamNumber && ' • '}
                    {selectedTeam.teamNumber && ` Team #${selectedTeam.teamNumber}`}
                  </p>
                </div>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Team Members</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const activeMembers = selectedTeam?.members
                      ?.filter(m => m.status === 'active' && !m.checkIn?.isCheckedIn)
                      .map(m => m.user._id || m.user) || [];
                    if (selectedMembers.length === activeMembers.length) {
                      setSelectedMembers([]);
                    } else {
                      setSelectedMembers(activeMembers);
                    }
                  }}
                >
                  {selectedMembers.length === selectedTeam?.members?.filter(m => m.status === 'active' && !m.checkIn?.isCheckedIn).length
                    ? 'Deselect All'
                    : 'Select All Unchecked'}
                </Button>
              </div>
              {selectedTeam?.members
                ?.filter(m => m.status === 'active')
                .map((member, index) => {
                  const memberId = member.user?._id || member.user;
                  const isCheckedIn = member.checkIn?.isCheckedIn;
                  const isSelected = selectedMembers.includes(memberId);

                  return (
                    <div key={index} className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg ${isSelected && !isCheckedIn ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      {!isCheckedIn && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMemberSelection(memberId)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {member.user?.fullName || member.user?.name || 'Unknown Member'}
                          {member.role === 'leader' && (
                            <Badge variant="info" className="ml-2 text-xs">Leader</Badge>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{member.user?.email || 'No email'}</p>
                        {isCheckedIn && member.checkIn?.checkedInAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Checked in at {new Date(member.checkIn.checkedInAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {isCheckedIn ? (
                          <Badge variant="success">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowCheckInModal(false);
                setSelectedTeam(null);
                setSelectedMembers([]);
                setAssignData({ tableNumber: '', teamNumber: '' });
              }}>
                Close
              </Button>
              {selectedMembers.length > 0 && (
                <Button onClick={handleBulkCheckIn} icon={UserCheck}>
                  Check In Selected ({selectedMembers.length})
                </Button>
              )}
              {selectedTeam && getCheckInProgress(selectedTeam).percentage < 100 && (
                <Button onClick={handleCheckInAll} icon={UserCheck}>
                  Check In All Members
                </Button>
              )}
            </div>
          </div>
        </Modal>

        {/* Assign Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTeam(null);
          }}
          title={`Assign Numbers - ${selectedTeam?.teamName}`}
        >
          <div className="space-y-4">
            <Input
              label="Table Number"
              type="number"
              value={assignData.tableNumber}
              onChange={(e) => setAssignData({ ...assignData, tableNumber: e.target.value })}
              placeholder="e.g., 5"
            />
            <Input
              label="Team Number"
              type="number"
              value={assignData.teamNumber}
              onChange={(e) => setAssignData({ ...assignData, teamNumber: e.target.value })}
              placeholder="e.g., 42"
            />
            <div className="flex gap-4 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign}>
                Assign
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}