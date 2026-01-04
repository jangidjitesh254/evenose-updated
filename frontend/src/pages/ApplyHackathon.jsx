import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Mail,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Loader,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { hackathonAPI, teamAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function ApplyHackathon() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1: Choose Mode, 2: Team Details, 3: Add Members, 4: Confirm
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationMode, setRegistrationMode] = useState(null); // 'create' or 'join'
  const [existingTeams, setExistingTeams] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, control, setValue } = useForm({
    defaultValues: {
      teamName: '',
      projectTitle: '',
      projectDescription: '',
      techStack: '',
    }
  });

  useEffect(() => {
    fetchHackathonDetails();
  }, [hackathonId]);

  const fetchHackathonDetails = async () => {
    try {
      const response = await hackathonAPI.getById(hackathonId);
      setHackathon(response.data.hackathon);
      
      // Check if already registered
      const myTeamsResponse = await teamAPI.getMyTeams();
      const alreadyInTeam = myTeamsResponse.data.teams.some(
        team => team.hackathon._id === hackathonId
      );
      
      if (alreadyInTeam) {
        toast.error('You are already registered for this hackathon');
        navigate(`/hackathons/${hackathonId}`);
        return;
      }

      // Fetch existing teams looking for members
      try {
        const teamsResponse = await teamAPI.getByHackathon(hackathonId, { status: 'approved', lookingForMembers: true });
        setExistingTeams(teamsResponse.data.teams || []);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    } catch (error) {
      toast.error('Failed to load hackathon details');
      navigate('/hackathons');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // API call to search users
      const response = await authAPI.searchUsers({ query, hackathonId });
      const filtered = response.data.users.filter(
        u => u._id !== user._id && 
        !selectedMembers.find(m => m._id === u._id) &&
        !sentRequests.find(r => r.userId === u._id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const addMember = (member) => {
    if (selectedMembers.length >= (hackathon?.teamConfig?.maxMembers - 1)) {
      toast.error(`Maximum ${hackathon.teamConfig.maxMembers} members allowed (including you)`);
      return;
    }
    
    setSelectedMembers([...selectedMembers, member]);
    setSearchResults([]);
  };

  const removeMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== memberId));
  };

  const sendJoinRequest = async (teamId) => {
    try {
      await teamAPI.requestToJoin(teamId, {
        message: 'I would like to join your team for this hackathon!'
      });
      toast.success('Join request sent successfully!');
      setSentRequests([...sentRequests, { teamId }]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRegistration = async (data) => {
    if (selectedMembers.length < (hackathon.teamConfig.minMembers - 1)) {
      toast.error(`Minimum ${hackathon.teamConfig.minMembers} members required`);
      return;
    }

    setIsSubmitting(true);
    try {
      const registrationData = {
        hackathonId: hackathon._id,
        teamName: data.teamName,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        techStack: data.techStack.split(',').map(t => t.trim()).filter(Boolean),
        members: selectedMembers.map(m => m._id),
      };

      const response = await teamAPI.register(registrationData);
      
      if (response.data.requiresPayment) {
        toast.success('Team registered! Redirecting to payment...');
        navigate(`/payment/${response.data.team._id}`);
      } else {
        toast.success('Team registered successfully!');
        navigate(`/teams/${response.data.team._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark-900 mb-2">
            Apply to {hackathon?.title}
          </h1>
          <p className="text-dark-600">
            {hackathon?.teamConfig?.allowSoloParticipation 
              ? 'Create a team or join an existing one'
              : `Team size: ${hackathon?.teamConfig?.minMembers}-${hackathon?.teamConfig?.maxMembers} members`}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Choose Mode' },
              { num: 2, label: 'Team Details' },
              { num: 3, label: 'Add Members' },
              { num: 4, label: 'Confirm' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    step >= s.num 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-dark-200 text-dark-500'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="text-xs text-center text-dark-600">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`h-1 flex-1 mx-2 ${
                    step > s.num ? 'bg-primary-600' : 'bg-dark-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card title="How would you like to participate?">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Create New Team */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setRegistrationMode('create');
                      setStep(2);
                    }}
                    className="p-6 border-2 border-dark-200 rounded-xl cursor-pointer hover:border-primary-500 transition-all"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                      <UserPlus className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Create New Team</h3>
                    <p className="text-dark-600 mb-4">
                      Form your own team and invite members to join
                    </p>
                    <Badge variant="primary">Recommended</Badge>
                  </motion.div>

                  {/* Join Existing Team */}
                  {existingTeams.length > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setRegistrationMode('join');
                        setStep(5); // Skip to join team step
                      }}
                      className="p-6 border-2 border-dark-200 rounded-xl cursor-pointer hover:border-secondary-500 transition-all"
                    >
                      <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-secondary-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Join Existing Team</h3>
                      <p className="text-dark-600 mb-4">
                        Request to join a team looking for members
                      </p>
                      <Badge variant="secondary">{existingTeams.length} teams available</Badge>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Team Details */}
          {step === 2 && registrationMode === 'create' && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                <Card title="Team Details">
                  <div className="space-y-6">
                    <Input
                      label="Team Name"
                      placeholder="Enter a cool team name"
                      error={errors.teamName?.message}
                      {...register('teamName', {
                        required: 'Team name is required',
                        minLength: { value: 3, message: 'At least 3 characters' }
                      })}
                    />

                    <Input
                      label="Project Title (Optional)"
                      placeholder="What are you building?"
                      {...register('projectTitle')}
                    />

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Project Description (Optional)
                      </label>
                      <textarea
                        rows="4"
                        className="input"
                        placeholder="Describe your project idea..."
                        {...register('projectDescription')}
                      />
                    </div>

                    <Input
                      label="Tech Stack (Optional)"
                      placeholder="React, Node.js, MongoDB (comma separated)"
                      helperText="Technologies you plan to use"
                      {...register('techStack')}
                    />

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button type="submit" icon={ChevronRight} iconPosition="right">
                        Continue
                      </Button>
                    </div>
                  </div>
                </Card>
              </form>
            </motion.div>
          )}

          {/* Step 3: Add Members */}
          {step === 3 && registrationMode === 'create' && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card 
                title="Add Team Members"
                subtitle={`${selectedMembers.length + 1}/${hackathon?.teamConfig?.maxMembers} members (including you)`}
              >
                <div className="space-y-6">
                  {/* Search Members */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Search and Add Members
                    </label>
                    <div className="relative">
                      <Input
                        icon={Search}
                        placeholder="Search by name, email, or username..."
                        onChange={(e) => searchUsers(e.target.value)}
                      />
                      
                      {searching && (
                        <div className="absolute right-3 top-3">
                          <Loader className="w-5 h-5 animate-spin text-primary-600" />
                        </div>
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-white border border-dark-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div
                            key={result._id}
                            className="p-3 hover:bg-dark-50 cursor-pointer flex items-center justify-between"
                            onClick={() => addMember(result)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-primary-600">
                                  {result.fullName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{result.fullName}</div>
                                <div className="text-sm text-dark-600">@{result.username}</div>
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-primary-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Members */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-3">
                      Team Members
                    </label>

                    {/* Team Leader (Current User) */}
                    <div className="mb-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-white">
                              {user?.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user?.fullName}</div>
                            <div className="text-sm text-dark-600">Team Leader (You)</div>
                          </div>
                        </div>
                        <Badge variant="primary">Leader</Badge>
                      </div>
                    </div>

                    {/* Added Members */}
                    {selectedMembers.length === 0 ? (
                      <div className="text-center py-8 text-dark-600">
                        <Users className="w-12 h-12 mx-auto mb-2 text-dark-400" />
                        <p>No members added yet</p>
                        <p className="text-sm">Search and add team members above</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedMembers.map((member) => (
                          <div
                            key={member._id}
                            className="p-4 bg-white border border-dark-200 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-secondary-600">
                                  {member.fullName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-sm text-dark-600">@{member.username}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMember(member._id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Validation Message */}
                  {selectedMembers.length + 1 < hackathon?.teamConfig?.minMembers && (
                    <div className="flex items-start gap-2 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-accent-800">
                        You need at least {hackathon.teamConfig.minMembers - selectedMembers.length - 1} more member(s) to proceed
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={selectedMembers.length + 1 < hackathon?.teamConfig?.minMembers}
                      icon={ChevronRight}
                      iconPosition="right"
                    >
                      Review & Submit
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && registrationMode === 'create' && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleSubmit(handleRegistration)}>
                <Card title="Review & Confirm Registration">
                  <div className="space-y-6">
                    {/* Team Summary */}
                    <div className="p-6 bg-dark-50 rounded-xl">
                      <h3 className="text-lg font-bold mb-4">Team Summary</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-dark-600">Team Name:</span>
                          <p className="font-semibold">{watch('teamName')}</p>
                        </div>
                        {watch('projectTitle') && (
                          <div>
                            <span className="text-sm text-dark-600">Project Title:</span>
                            <p className="font-semibold">{watch('projectTitle')}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-dark-600">Team Members:</span>
                          <p className="font-semibold">{selectedMembers.length + 1} members</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {hackathon?.registrationFee?.amount > 0 && (
                      <div className="p-6 bg-accent-50 border border-accent-200 rounded-xl">
                        <h3 className="text-lg font-bold mb-2">Payment Required</h3>
                        <p className="text-dark-600 mb-3">
                          Registration fee: ₹{hackathon.registrationFee.amount}
                        </p>
                        <p className="text-sm text-dark-600">
                          You will be redirected to payment after registration
                        </p>
                      </div>
                    )}

                    {/* Terms */}
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm text-dark-600">
                        I agree to the hackathon rules and code of conduct. I understand that providing false information may result in disqualification.
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(3)}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        loading={isSubmitting}
                        icon={Check}
                      >
                        Complete Registration
                      </Button>
                    </div>
                  </div>
                </Card>
              </form>
            </motion.div>
          )}

          {/* Step 5: Join Existing Team */}
          {step === 5 && registrationMode === 'join' && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card title="Join Existing Team" subtitle="Send a request to join one of these teams">
                <div className="space-y-4">
                  {existingTeams.map((team) => (
                    <div
                      key={team._id}
                      className="p-6 border border-dark-200 rounded-xl hover:border-primary-500 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{team.teamName}</h3>
                          <p className="text-sm text-dark-600">
                            Led by {team.leader.fullName}
                          </p>
                        </div>
                        <Badge variant="info">
                          {team.members.length}/{hackathon.teamConfig.maxMembers} members
                        </Badge>
                      </div>

                      {team.projectTitle && (
                        <p className="text-dark-700 mb-2">
                          <strong>Project:</strong> {team.projectTitle}
                        </p>
                      )}

                      {team.techStack && team.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {team.techStack.map((tech, idx) => (
                            <Badge key={idx} variant="secondary">{tech}</Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => sendJoinRequest(team._id)}
                        disabled={sentRequests.some(r => r.teamId === team._id)}
                        size="sm"
                        icon={sentRequests.some(r => r.teamId === team._id) ? Check : Mail}
                      >
                        {sentRequests.some(r => r.teamId === team._id) 
                          ? 'Request Sent' 
                          : 'Request to Join'}
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    fullWidth
                  >
                    Back to Options
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
