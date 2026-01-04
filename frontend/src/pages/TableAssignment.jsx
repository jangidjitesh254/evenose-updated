import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Save, ArrowLeft, Hash, Table as TableIcon, Check, X } from 'lucide-react';
import { hackathonAPI, teamAPI } from '../services/api';
import { useAuthStore } from '../store';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function TableAssignment() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [assignments, setAssignments] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const allTeams = teamsRes.data.teams || [];
      setTeams(allTeams);

      // Initialize assignments from current team data
      const initialAssignments = {};
      allTeams.forEach(team => {
        initialAssignments[team._id] = {
          tableNumber: team.tableNumber || '',
          teamNumber: team.teamNumber || '',
        };
      });
      setAssignments(initialAssignments);

      // Get user's permissions
      const coordinator = hackathonRes.data.hackathon.coordinators?.find(
        c => c.user?._id === user?.id || c.user === user?.id
      );

      console.log('Coordinator permissions:', coordinator?.permissions);
      setPermissions(coordinator?.permissions || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = (teamId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value,
      }
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!permissions.canAssignTables) {
      toast.error('You do not have permission to assign tables');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const teamId in assignments) {
        const assignment = assignments[teamId];
        const team = teams.find(t => t._id === teamId);

        // Only update if there are changes
        if (
          assignment.tableNumber !== (team.tableNumber || '') ||
          assignment.teamNumber !== (team.teamNumber || '')
        ) {
          try {
            await teamAPI.assign(teamId, {
              tableNumber: assignment.tableNumber || undefined,
              teamNumber: assignment.teamNumber || undefined,
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to assign ${team.teamName}:`, error);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} team(s)`);
        setHasChanges(false);
        fetchData();
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} team(s)`);
      }
    } catch (error) {
      console.error('Failed to save assignments:', error);
      toast.error('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeam = async (teamId) => {
    if (!permissions.canAssignTables) {
      toast.error('You do not have permission to assign tables');
      return;
    }

    try {
      const assignment = assignments[teamId];
      await teamAPI.assign(teamId, {
        tableNumber: assignment.tableNumber || undefined,
        teamNumber: assignment.teamNumber || undefined,
      });
      toast.success('Assignment saved successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleAutoAssign = () => {
    if (!permissions.canAssignTables) {
      toast.error('You do not have permission to assign tables');
      return;
    }

    const filteredTeams = getFilteredTeams();
    const newAssignments = { ...assignments };

    filteredTeams.forEach((team, index) => {
      newAssignments[team._id] = {
        tableNumber: (index + 1).toString(),
        teamNumber: (index + 1).toString(),
      };
    });

    setAssignments(newAssignments);
    setHasChanges(true);
    toast.success(`Auto-assigned ${filteredTeams.length} team(s)`);
  };

  const handleClearAssignments = () => {
    const filteredTeams = getFilteredTeams();
    const newAssignments = { ...assignments };

    filteredTeams.forEach(team => {
      newAssignments[team._id] = {
        tableNumber: '',
        teamNumber: '',
      };
    });

    setAssignments(newAssignments);
    setHasChanges(true);
    toast.success('Cleared assignments');
  };

  const getFilteredTeams = () => {
    return teams.filter(team => {
      const matchesSearch = team.teamName?.toLowerCase().includes(search.toLowerCase()) ||
                            team.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
                            team.members?.some(m =>
                              m.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                              m.user?.email?.toLowerCase().includes(search.toLowerCase())
                            );
      const matchesStatus = statusFilter === 'all' || team.registrationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredTeams = getFilteredTeams();

  // Calculate statistics
  const stats = {
    totalTeams: teams.length,
    approvedTeams: teams.filter(t => t.registrationStatus === 'approved').length,
    assignedTables: teams.filter(t => t.tableNumber).length,
    assignedTeamNumbers: teams.filter(t => t.teamNumber).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!permissions.canAssignTables) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to assign tables for this hackathon.
          </p>
          <Button onClick={() => navigate(`/coordinator/${hackathonId}`)}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(`/coordinator/${hackathonId}`)}
            className="mb-4"
          >
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Table & Team Number Assignment
          </h1>
          <p className="text-gray-600">{hackathon?.title}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTeams}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TableIcon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Teams</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approvedTeams}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tables Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.assignedTables}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.approvedTeams > 0 ? Math.round((stats.assignedTables / stats.approvedTeams) * 100) : 0}% complete
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TableIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Numbers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.assignedTeamNumbers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.approvedTeams > 0 ? Math.round((stats.assignedTeamNumbers / stats.approvedTeams) * 100) : 0}% complete
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Hash className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                icon={Search}
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button variant="outline" onClick={handleAutoAssign}>
              Auto Assign
            </Button>
            <Button variant="outline" onClick={handleClearAssignments}>
              Clear All
            </Button>
          </div>
        </Card>

        {/* Save Actions */}
        {hasChanges && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Click "Save All Changes" to apply them.
              </p>
              <Button icon={Save} onClick={handleSaveAll} disabled={saving}>
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </Card>
        )}

        {/* Teams Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.map((team) => {
                  const assignment = assignments[team._id] || { tableNumber: '', teamNumber: '' };
                  const hasTeamChanges =
                    assignment.tableNumber !== (team.tableNumber || '') ||
                    assignment.teamNumber !== (team.teamNumber || '');

                  return (
                    <tr key={team._id} className={hasTeamChanges ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                        {team.projectTitle && (
                          <div className="text-xs text-gray-500">{team.projectTitle}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.members?.filter(m => m.status === 'active').length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={team.registrationStatus === 'approved' ? 'success' : team.registrationStatus === 'pending' ? 'warning' : 'secondary'}>
                          {team.registrationStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="text"
                          value={assignment.tableNumber}
                          onChange={(e) => updateAssignment(team._id, 'tableNumber', e.target.value)}
                          placeholder="e.g., 5"
                          className="w-24"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="text"
                          value={assignment.teamNumber}
                          onChange={(e) => updateAssignment(team._id, 'teamNumber', e.target.value)}
                          placeholder="e.g., 42"
                          className="w-24"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasTeamChanges && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveTeam(team._id)}
                            icon={Save}
                          >
                            Save
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No teams found
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
