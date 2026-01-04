import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, CreditCard, Activity, Save, Mail, Phone, Building, CheckCircle, Calendar } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Profile() {
  const { user: storeUser, setUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [plans, setPlans] = useState([]);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUser();
    fetchPlans();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      const userData = response.data.user;
      setUserState(userData);
      setProfileForm({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        institution: userData.institution || '',
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await paymentAPI.getSubscriptionPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await authAPI.updateProfile(profileForm);
      toast.success('Profile updated successfully!');
      setUser({ ...storeUser, ...profileForm }); // Update Zustand store
      fetchUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setUpdating(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-green-500 border-4 border-white flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">{user?.fullName}</h1>
              <p className="text-gray-600 mb-3">{user?.email}</p>
              <div className="flex gap-2 flex-wrap">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="info">{role}</Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b-2 border-gray-200 mb-8">
          <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-semibold flex items-center gap-2 transition-all whitespace-nowrap rounded-t-xl ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Personal Information</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <Input
                      label="Full Name"
                      icon={User}
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      icon={Mail}
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      icon={Phone}
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                    <Input
                      label="Institution"
                      icon={Building}
                      value={profileForm.institution}
                      onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                    />
                    <Button type="submit" loading={updating} icon={Save} variant="primary">
                      Save Changes
                    </Button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Change Password</h2>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <Input
                      label="Current Password"
                      type="password"
                      icon={Lock}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                    <Input
                      label="New Password"
                      type="password"
                      icon={Lock}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      icon={Lock}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                    <Button type="submit" loading={updating} icon={Lock} variant="primary">
                      Change Password
                    </Button>
                  </form>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Current Subscription</h2>
                    </div>
                    {user?.subscription ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border-2 border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Plan</p>
                            <p className="text-xl font-bold text-gray-900">{user.subscription.plan?.name || 'N/A'}</p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-2xl border-2 border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Status</p>
                            <Badge variant={user.subscription.status === 'active' ? 'success' : 'warning'}>
                              {user.subscription.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-2xl">
                          <p className="text-sm text-gray-600 mb-2">Valid Until</p>
                          <p className="font-bold text-gray-900">
                            {user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-3">Features:</p>
                          <div className="grid gap-2">
                            {Object.entries(user.subscription.features || {}).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-700">{key}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600">No active subscription</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Available Plans</h3>
                    <div className="grid gap-4">
                      {plans.map((plan, index) => (
                        <motion.div
                          key={plan._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{plan.displayName || plan.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                              <p className="text-3xl font-bold text-indigo-600">
                                ₹{plan.price?.amount || 0}<span className="text-sm text-gray-600">/{plan.billingCycle}</span>
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant={user?.subscription?.plan?._id === plan._id ? 'outline' : 'primary'}
                              disabled={user?.subscription?.plan?._id === plan._id}
                            >
                              {user?.subscription?.plan?._id === plan._id ? 'Current Plan' : 'Upgrade'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(plan.features || {}).map(([key, value]) => {
                              // Format the key to be more readable
                              const formattedKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim();
                              
                              // Handle different types of values
                              let displayValue = '';
                              if (typeof value === 'boolean') {
                                if (!value) return null; // Don't show false boolean features
                                displayValue = formattedKey;
                              } else if (typeof value === 'number') {
                                displayValue = `${formattedKey}: ${value}`;
                              } else {
                                displayValue = formattedKey;
                              }

                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
                  </div>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Activity log coming soon...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border-2 border-gray-200 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Account Stats</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="font-bold text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Account Type</p>
                    <p className="font-bold text-gray-900">{user?.roles?.[0] || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Verified</p>
                    <Badge variant={user?.isVerified ? 'success' : 'secondary'}>
                      {user?.isVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>

            {user?.coordinatorFor && user.coordinatorFor.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-white border-2 border-gray-200 rounded-3xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Coordinating</h3>
                </div>
                <p className="text-4xl font-bold text-blue-600 mb-2">{user.coordinatorFor.length}</p>
                <p className="text-sm text-gray-600">Active hackathons</p>
              </motion.div>
            )}

            {user?.judgeFor && user.judgeFor.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-white border-2 border-gray-200 rounded-3xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Judging</h3>
                </div>
                <p className="text-4xl font-bold text-green-600 mb-2">{user.judgeFor.length}</p>
                <p className="text-sm text-gray-600">Active hackathons</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}