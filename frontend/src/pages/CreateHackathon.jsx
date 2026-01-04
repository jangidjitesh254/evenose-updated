import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar,
  Users,
  Settings,
  DollarSign,
  Award,
  Check,
  AlertCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { hackathonAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Settings },
  { id: 2, name: 'Schedule', icon: Calendar },
  { id: 3, name: 'Team Config', icon: Users },
  { id: 4, name: 'Rounds', icon: Award },
  { id: 5, name: 'Payment', icon: DollarSign },
];

export default function CreateHackathon() {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setIsCheckingPermissions(true);
      
      // Check if user is admin or super_admin (they can always create)
      if (hasAnyRole(['admin', 'super_admin'])) {
        setSubscriptionError(null);
        setIsCheckingPermissions(false);
        return;
      }

      // Fetch fresh user data to check subscription
      const response = await authAPI.getMe();
      const userData = response.data.user;

      // Check subscription status
      if (!userData.subscription) {
        setSubscriptionError({
          message: 'You need an active subscription to create hackathons',
          action: 'subscribe',
        });
      } else if (userData.subscription.status !== 'active') {
        setSubscriptionError({
          message: `Your subscription is ${userData.subscription.status}. Please renew to create hackathons.`,
          action: 'renew',
        });
      } else if (!userData.subscription.features?.canCreateHackathons) {
        setSubscriptionError({
          message: 'Your current plan does not include hackathon creation. Please upgrade.',
          action: 'upgrade',
        });
      } else {
        setSubscriptionError(null);
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      // Don't block on error, let the backend handle it
      setSubscriptionError(null);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      mode: 'hybrid',
      venue: '',
      tags: [],
      registrationStartDate: '',
      registrationEndDate: '',
      hackathonStartDate: '',
      hackathonEndDate: '',
      teamConfig: {
        minMembers: 1,
        maxMembers: 4,
      },
      rounds: [{
        name: 'Submission Round',
        type: 'submission',
        mode: 'online',
        startTime: '',
        endTime: '',
        maxScore: 100,
        description: '',
        judgingCriteria: [{
          name: 'Innovation',
          maxPoints: 50,
          description: '',
        }]
      }],
      registrationFee: {
        amount: 0,
        currency: 'INR',
        paymentOption: 'per_team',
      },
      prizes: [{
        position: '1st Place',
        amount: '',
        currency: 'INR',
        description: '',
      }],
      judgingCriteriaText: 'Teams will be judged on Innovation, Technical Implementation, Design, and Impact.',
      settings: {
        autoAcceptTeams: false,
        enableCheckIn: true,
        allowLateRegistration: false,
      },
    }
  });

  const { fields: roundFields, append: appendRound, remove: removeRound } = useFieldArray({
    control,
    name: 'rounds',
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: 'prizes',
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Format the data to match the backend schema
      const submissionData = {
        title: data.title,
        description: data.description,
        mode: data.mode,
        tags: data.tags || [],
        
        // Venue - create proper object structure
        venue: data.mode !== 'online' ? {
          name: data.venueName || '',
        } : undefined,
        
        // Dates
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        hackathonStartDate: data.hackathonStartDate,
        hackathonEndDate: data.hackathonEndDate,
        
        // Team config
        teamConfig: {
          minMembers: parseInt(data.teamConfig.minMembers),
          maxMembers: parseInt(data.teamConfig.maxMembers),
        },
        
        // Max teams
        maxTeams: data.maxTeams ? parseInt(data.maxTeams) : 100,
        
        // Rounds
        rounds: data.rounds.map(round => ({
          name: round.name,
          type: round.type,
          mode: round.mode,
          startTime: round.startTime,
          endTime: round.endTime,
          maxScore: parseInt(round.maxScore) || 100,
          description: round.description || '',
          judgingCriteria: round.judgingCriteria?.filter(c => c.name) || [],
        })),
        
        // Registration fee
        registrationFee: {
          amount: parseInt(data.registrationFee.amount) || 0,
          currency: data.registrationFee.currency || 'INR',
        },
        
        // Prizes
        prizes: data.prizes?.filter(p => p.position).map(prize => ({
          position: prize.position,
          amount: prize.amount ? parseInt(prize.amount) : 0,
          description: prize.description || '',
        })) || [],
        
        // Judging criteria as string
        judgingCriteria: data.judgingCriteriaText || '',
        
        // Settings
        settings: {
          autoAcceptTeams: data.settings?.autoAcceptTeams || false,
          enableCheckIn: data.settings?.enableCheckIn !== false,
          allowLateRegistration: data.settings?.allowLateRegistration || false,
          enableLeaderboard: data.settings?.enableLeaderboard !== false,
        },
      };
      
      console.log('Submitting data:', submissionData);
      const response = await hackathonAPI.create(submissionData);
      toast.success('Hackathon created successfully!');
      navigate(`/hackathons/${response.data.hackathon._id}`);
    } catch (error) {
      console.error('Failed to create hackathon:', error);
      toast.error(error.response?.data?.message || 'Failed to create hackathon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hackathon Title *
              </label>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="AI Innovation Challenge 2025"
                error={errors.title?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe your hackathon..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode *
                </label>
                <select
                  {...register('mode', { required: 'Mode is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue {watch('mode') !== 'online' && '*'}
                </label>
                <Input
                  {...register('venueName', { 
                    required: watch('mode') !== 'online' ? 'Venue is required' : false 
                  })}
                  placeholder="Main Campus Auditorium, Building A"
                  error={errors.venueName?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full venue name (you can add detailed address later)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <Input
                placeholder="AI, ML, Web3, Blockchain"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setValue('tags', tags);
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Start Date *
                </label>
                <Input
                  type="datetime-local"
                  {...register('registrationStartDate', { required: 'Required' })}
                  error={errors.registrationStartDate?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration End Date *
                </label>
                <Input
                  type="datetime-local"
                  {...register('registrationEndDate', { required: 'Required' })}
                  error={errors.registrationEndDate?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hackathon Start Date *
                </label>
                <Input
                  type="datetime-local"
                  {...register('hackathonStartDate', { required: 'Required' })}
                  error={errors.hackathonStartDate?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hackathon End Date *
                </label>
                <Input
                  type="datetime-local"
                  {...register('hackathonEndDate', { required: 'Required' })}
                  error={errors.hackathonEndDate?.message}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Team Members *
                </label>
                <Input
                  type="number"
                  {...register('teamConfig.minMembers', { 
                    required: 'Required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  min={1}
                  error={errors.teamConfig?.minMembers?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Team Members *
                </label>
                <Input
                  type="number"
                  {...register('teamConfig.maxMembers', { 
                    required: 'Required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  min={1}
                  error={errors.teamConfig?.maxMembers?.message}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Teams (optional)
              </label>
              <Input
                type="number"
                {...register('maxTeams')}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('settings.autoAcceptTeams')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-accept team registrations</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('settings.enableCheckIn')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable check-in for participants</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('settings.allowLateRegistration')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow late registration</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('settings.enableLeaderboard')}
                  defaultChecked={true}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable leaderboard</span>
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rounds & Judging</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => appendRound({
                  name: '',
                  type: 'submission',
                  mode: 'online',
                  startTime: '',
                  endTime: '',
                  maxScore: 100,
                  description: '',
                  judgingCriteria: [{
                    name: '',
                    maxPoints: 50,
                    description: '',
                  }]
                })}
              >
                Add Round
              </Button>
            </div>

            {roundFields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-900">Round {index + 1}</h4>
                  {roundFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <Input
                    {...register(`rounds.${index}.name`, { required: 'Required' })}
                    placeholder="Round name"
                    error={errors.rounds?.[index]?.name?.message}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      {...register(`rounds.${index}.type`)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="submission">Submission</option>
                      <option value="presentation">Presentation</option>
                      <option value="interview">Interview</option>
                      <option value="workshop">Workshop</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      {...register(`rounds.${index}.mode`)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="datetime-local"
                      {...register(`rounds.${index}.startTime`, { required: 'Required' })}
                      error={errors.rounds?.[index]?.startTime?.message}
                    />
                    <Input
                      type="datetime-local"
                      {...register(`rounds.${index}.endTime`, { required: 'Required' })}
                      error={errors.rounds?.[index]?.endTime?.message}
                    />
                  </div>

                  <Input
                    type="number"
                    {...register(`rounds.${index}.maxScore`)}
                    placeholder="Max score"
                  />

                  <textarea
                    {...register(`rounds.${index}.description`)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Round description..."
                  />

                  {/* Judging Criteria for this Round */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                      Judging Criteria for this Round
                    </h5>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          {...register(`rounds.${index}.judgingCriteria.0.name`)}
                          placeholder="e.g., Innovation"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          {...register(`rounds.${index}.judgingCriteria.0.maxPoints`)}
                          placeholder="Max points"
                          className="text-sm"
                        />
                        <Input
                          {...register(`rounds.${index}.judgingCriteria.0.description`)}
                          placeholder="Description"
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          {...register(`rounds.${index}.judgingCriteria.1.name`)}
                          placeholder="e.g., Technical"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          {...register(`rounds.${index}.judgingCriteria.1.maxPoints`)}
                          placeholder="Max points"
                          className="text-sm"
                        />
                        <Input
                          {...register(`rounds.${index}.judgingCriteria.1.description`)}
                          placeholder="Description"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Overall Judging Criteria Description
              </h3>
              <Card className="p-4 bg-gray-50">
                <textarea
                  {...register('judgingCriteriaText')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Describe the overall judging criteria for the hackathon. E.g., Teams will be evaluated on Innovation (40%), Technical Implementation (30%), Design (20%), and Impact (10%)."
                />
                <p className="text-sm text-gray-500 mt-2">
                  This will be displayed to participants on the hackathon detail page.
                </p>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Prizes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Fee
                </label>
                <Input
                  type="number"
                  {...register('registrationFee.amount')}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  {...register('registrationFee.currency')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Option
                </label>
                <select
                  {...register('registrationFee.paymentOption')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="per_team">Per Team</option>
                  <option value="per_participant">Per Participant</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Prizes</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => appendPrize({
                    position: '',
                    amount: '',
                    currency: 'INR',
                    description: '',
                  })}
                >
                  Add Prize
                </Button>
              </div>

              {prizeFields.map((field, index) => (
                <Card key={field.id} className="p-4 bg-gray-50 mb-3">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        {...register(`prizes.${index}.position`)}
                        placeholder="1st Place"
                      />
                      <Input
                        type="number"
                        {...register(`prizes.${index}.amount`)}
                        placeholder="Amount"
                      />
                      <select
                        {...register(`prizes.${index}.currency`)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    {prizeFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrize(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <Input
                    {...register(`prizes.${index}.description`)}
                    placeholder="Prize description"
                  />
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Hackathon</h1>
          <p className="text-gray-600">Set up your hackathon with detailed configuration</p>
        </div>

        {/* Loading State */}
        {isCheckingPermissions ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-gray-600">Checking permissions...</p>
            </div>
          </Card>
        ) : subscriptionError ? (
          /* Subscription Error State */
          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Subscription Required
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {subscriptionError.message}
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="primary"
                >
                  {subscriptionError.action === 'subscribe' && 'View Plans'}
                  {subscriptionError.action === 'upgrade' && 'Upgrade Plan'}
                  {subscriptionError.action === 'renew' && 'Renew Subscription'}
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </div>
              
              {/* Development Mode Override */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Development Mode:</strong> Subscription check can be bypassed
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubscriptionError(null)}
                  >
                    Continue Anyway (Dev Only)
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          /* Main Form */
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1.1 : 1,
                            backgroundColor: isCompleted ? '#10B981' : isCurrent ? '#EF4444' : '#E5E7EB',
                          }}
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        >
                          {isCompleted ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : (
                            <StepIcon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-600'}`} />
                          )}
                        </motion.div>
                        <span className={`text-sm font-medium ${isCurrent ? 'text-red-600' : 'text-gray-600'}`}>
                          {step.name}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className="flex-1 h-1 bg-gray-200 mx-4">
                          <motion.div
                            initial={false}
                            animate={{
                              width: isCompleted ? '100%' : '0%',
                            }}
                            className="h-full bg-green-500"
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card className="p-8 mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    icon={Check}
                  >
                    Create Hackathon
                  </Button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}