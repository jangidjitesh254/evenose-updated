import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Edit, Trash2, Calendar, MapPin, Globe,
  FileText, Award, Users, Clock, Settings
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function RoundsManagement() {
  const { id: hackathonId } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'submission',
    mode: 'online',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    instructions: '',
    maxScore: 100,
    isEliminationRound: false,
    eliminationCount: 0,
    submissionConfig: {
      allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSize: 52428800,
      maxFiles: 5,
      requireProjectLink: true,
      requireDemoLink: false,
      requireVideoLink: false,
      requireGithubRepo: false,
      requirePresentationLink: false,
    },
    judgingCriteria: []
  });

  useEffect(() => {
    fetchData();
  }, [hackathonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, roundsRes] = await Promise.all([
        hackathonAPI.getById(hackathonId),
        hackathonAPI.getRounds(hackathonId),
      ]);

      setHackathon(hackathonRes.data.hackathon);
      setRounds(roundsRes.data.rounds || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load rounds');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (round = null) => {
    if (round) {
      setEditingRound(round);
      setFormData({
        name: round.name || '',
        type: round.type || 'submission',
        mode: round.mode || 'online',
        description: round.description || '',
        startTime: round.startTime ? new Date(round.startTime).toISOString().slice(0, 16) : '',
        endTime: round.endTime ? new Date(round.endTime).toISOString().slice(0, 16) : '',
        location: round.location || '',
        meetingLink: round.meetingLink || '',
        instructions: round.instructions || '',
        maxScore: round.maxScore || 100,
        isEliminationRound: round.isEliminationRound || false,
        eliminationCount: round.eliminationCount || 0,
        submissionConfig: round.submissionConfig || {
          allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          maxFileSize: 52428800,
          maxFiles: 5,
          requireProjectLink: true,
          requireDemoLink: false,
          requireVideoLink: false,
          requireGithubRepo: false,
          requirePresentationLink: false,
        },
        judgingCriteria: round.judgingCriteria || []
      });
    } else {
      setEditingRound(null);
      setFormData({
        name: '',
        type: 'submission',
        mode: 'online',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        meetingLink: '',
        instructions: '',
        maxScore: 100,
        isEliminationRound: false,
        eliminationCount: 0,
        submissionConfig: {
          allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          maxFileSize: 52428800,
          maxFiles: 5,
          requireProjectLink: true,
          requireDemoLink: false,
          requireVideoLink: false,
          requireGithubRepo: false,
          requirePresentationLink: false,
        },
        judgingCriteria: []
      });
    }
    setShowRoundModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingRound) {
        await hackathonAPI.updateRound(hackathonId, editingRound._id, formData);
        toast.success('Round updated successfully!');
      } else {
        await hackathonAPI.createRound(hackathonId, formData);
        toast.success('Round created successfully!');
      }

      setShowRoundModal(false);
      setEditingRound(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save round:', error);
      toast.error(error.response?.data?.message || 'Failed to save round');
    }
  };

  const handleDelete = async (roundId) => {
    if (!window.confirm('Are you sure you want to delete this round? This action cannot be undone.')) {
      return;
    }

    try {
      await hackathonAPI.deleteRound(hackathonId, roundId);
      toast.success('Round deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to delete round:', error);
      toast.error(error.response?.data?.message || 'Failed to delete round');
    }
  };

  const handleStatusChange = async (roundId, newStatus) => {
    try {
      await hackathonAPI.updateRoundStatus(hackathonId, roundId, { status: newStatus });
      toast.success('Round status updated!');
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ongoing': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'submission': return FileText;
      case 'presentation': return Users;
      case 'interview': return Users;
      case 'workshop': return Globe;
      default: return Calendar;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
            onClick={() => navigate(`/hackathons/${hackathonId}/manage`)}
            className="mb-4"
          >
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Rounds Management
              </h1>
              <p className="text-gray-600">{hackathon?.title}</p>
            </div>
            <Button icon={Plus} onClick={() => handleOpenModal()}>
              Add Round
            </Button>
          </div>
        </div>

        {/* Rounds List */}
        <div className="space-y-4">
          {rounds.length === 0 ? (
            <Card className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rounds created yet</p>
              <Button
                className="mt-4"
                icon={Plus}
                onClick={() => handleOpenModal()}
              >
                Create First Round
              </Button>
            </Card>
          ) : (
            rounds.map((round, index) => {
              const TypeIcon = getTypeIcon(round.type);
              return (
                <Card key={round._id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {round.name}
                            </h3>
                            <Badge variant={getStatusVariant(round.status)}>
                              {round.status}
                            </Badge>
                            {round.currentRound && (
                              <Badge variant="success">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 capitalize">
                            {round.type} • {round.mode}
                          </p>
                        </div>
                      </div>

                      {round.description && (
                        <p className="text-gray-700 mb-3">{round.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(round.startTime).toLocaleDateString()} - {new Date(round.endTime).toLocaleDateString()}
                          </span>
                        </div>

                        {round.mode === 'offline' && round.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{round.location}</span>
                          </div>
                        )}

                        {round.mode === 'online' && round.meetingLink && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4" />
                            <a
                              href={round.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Meeting Link
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="w-4 h-4" />
                          <span>Max Score: {round.maxScore}</span>
                        </div>

                        {round.isEliminationRound && (
                          <div className="flex items-center gap-2 text-red-600">
                            <Users className="w-4 h-4" />
                            <span>Eliminates {round.eliminationCount} teams</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <select
                        value={round.status}
                        onChange={(e) => handleStatusChange(round._id, e.target.value)}
                        className="input text-sm py-1 px-2"
                      >
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Edit}
                          onClick={() => handleOpenModal(round)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Trash2}
                          onClick={() => handleDelete(round._id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Round Form Modal */}
        <Modal
          isOpen={showRoundModal}
          onClose={() => {
            setShowRoundModal(false);
            setEditingRound(null);
          }}
          title={editingRound ? 'Edit Round' : 'Create New Round'}
          size="large"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <Input
                label="Round Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Idea Submission"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="submission">Submission</option>
                    <option value="presentation">Presentation</option>
                    <option value="interview">Interview</option>
                    <option value="workshop">Workshop</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="input"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Describe what participants need to do in this round..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />

                <Input
                  label="End Time"
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>

              {formData.mode === 'offline' ? (
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Auditorium, Building A"
                />
              ) : (
                <Input
                  label="Meeting Link"
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Detailed instructions for participants..."
                />
              </div>
            </div>

            {/* Scoring and Elimination */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900">Scoring & Elimination</h3>

              <Input
                label="Maximum Score"
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                min="0"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isEliminationRound"
                  checked={formData.isEliminationRound}
                  onChange={(e) => setFormData({ ...formData, isEliminationRound: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isEliminationRound" className="text-sm font-medium text-gray-700">
                  This is an elimination round
                </label>
              </div>

              {formData.isEliminationRound && (
                <Input
                  label="Number of Teams to Eliminate"
                  type="number"
                  value={formData.eliminationCount}
                  onChange={(e) => setFormData({ ...formData, eliminationCount: parseInt(e.target.value) })}
                  min="0"
                />
              )}
            </div>

            {/* Submission Configuration */}
            {formData.type === 'submission' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Submission Configuration</h3>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max File Size (MB)"
                    type="number"
                    value={formData.submissionConfig.maxFileSize / 1048576}
                    onChange={(e) => setFormData({
                      ...formData,
                      submissionConfig: {
                        ...formData.submissionConfig,
                        maxFileSize: parseInt(e.target.value) * 1048576
                      }
                    })}
                    min="1"
                  />

                  <Input
                    label="Max Files"
                    type="number"
                    value={formData.submissionConfig.maxFiles}
                    onChange={(e) => setFormData({
                      ...formData,
                      submissionConfig: {
                        ...formData.submissionConfig,
                        maxFiles: parseInt(e.target.value)
                      }
                    })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Required Links</p>
                  {['requireProjectLink', 'requireDemoLink', 'requireVideoLink', 'requireGithubRepo', 'requirePresentationLink'].map(field => (
                    <div key={field} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field}
                        checked={formData.submissionConfig[field]}
                        onChange={(e) => setFormData({
                          ...formData,
                          submissionConfig: {
                            ...formData.submissionConfig,
                            [field]: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <label htmlFor={field} className="text-sm text-gray-700">
                        {field.replace('require', '').replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRoundModal(false);
                  setEditingRound(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRound ? 'Update Round' : 'Create Round'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
