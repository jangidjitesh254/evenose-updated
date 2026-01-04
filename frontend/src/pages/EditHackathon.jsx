import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Settings,
  FileText,
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import { useAuthStore } from '../store';

export default function EditHackathon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hackathon, setHackathon] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hackathonStartDate: '',
    hackathonEndDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    mode: 'online',
    venue: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
    },
    teamConfig: {
      minMembers: 1,
      maxMembers: 5,
      allowSoloParticipation: true,
    },
    maxTeams: 100,
    registrationFee: {
      amount: 0,
      currency: 'INR',
    },
    contactEmail: '',
    contactPhone: '',
    rules: [''],
    guidelines: '',
  });

  useEffect(() => {
    fetchHackathon();
  }, [id]);

  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const response = await hackathonAPI.getById(id);
      const data = response.data.hackathon;
      
      // Check if user is organizer
      if (data.organizer._id !== user.id && data.organizer !== user.id) {
        toast.error('Not authorized to edit this hackathon');
        navigate(`/hackathons/${id}`);
        return;
      }

      setHackathon(data);
      
      // Format dates for input fields
      setFormData({
        ...data,
        hackathonStartDate: data.hackathonStartDate ? new Date(data.hackathonStartDate).toISOString().slice(0, 16) : '',
        hackathonEndDate: data.hackathonEndDate ? new Date(data.hackathonEndDate).toISOString().slice(0, 16) : '',
        registrationStartDate: data.registrationStartDate ? new Date(data.registrationStartDate).toISOString().slice(0, 16) : '',
        registrationEndDate: data.registrationEndDate ? new Date(data.registrationEndDate).toISOString().slice(0, 16) : '',
        rules: data.rules && data.rules.length > 0 ? data.rules : [''],
        venue: data.venue || {
          name: '',
          address: '',
          city: '',
          state: '',
          country: '',
        },
        teamConfig: data.teamConfig || {
          minMembers: 1,
          maxMembers: 5,
          allowSoloParticipation: true,
        },
        registrationFee: data.registrationFee || {
          amount: 0,
          currency: 'INR',
        },
      });
    } catch (error) {
      console.error('Failed to fetch hackathon:', error);
      toast.error('Failed to load hackathon');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validation
      if (!formData.title || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.hackathonStartDate || !formData.hackathonEndDate) {
        toast.error('Please select hackathon dates');
        return;
      }

      if (!formData.registrationStartDate || !formData.registrationEndDate) {
        toast.error('Please select registration dates');
        return;
      }

      // Filter out empty rules
      const cleanedData = {
        ...formData,
        rules: formData.rules.filter(rule => rule.trim() !== ''),
      };

      await hackathonAPI.update(id, cleanedData);
      toast.success('Hackathon updated successfully!');
      navigate(`/hackathons/${id}`);
    } catch (error) {
      console.error('Failed to update hackathon:', error);
      toast.error(error.response?.data?.message || 'Failed to update hackathon');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = () => {
    setFormData({
      ...formData,
      rules: [...formData.rules, ''],
    });
  };

  const handleRemoveRule = (index) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      rules: newRules.length > 0 ? newRules : [''],
    });
  };

  const handleRuleChange = (index, value) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData({
      ...formData,
      rules: newRules,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/hackathons/${id}`)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Hackathon</span>
          </button>
          
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Edit Hackathon</h1>
            <p className="text-gray-600">Update your hackathon details</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., TechFest 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your hackathon..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Guidelines
                </label>
                <textarea
                  value={formData.guidelines || ''}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Additional guidelines for participants..."
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Dates & Duration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hackathon Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.hackathonStartDate}
                  onChange={(e) => setFormData({ ...formData, hackathonStartDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hackathon End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.hackathonEndDate}
                  onChange={(e) => setFormData({ ...formData, hackathonEndDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.registrationStartDate}
                  onChange={(e) => setFormData({ ...formData, registrationStartDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.registrationEndDate}
                  onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Mode & Venue */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              Mode & Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mode *
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {(formData.mode === 'offline' || formData.mode === 'hybrid') && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      value={formData.venue?.name || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        venue: { ...formData.venue, name: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Convention Center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.venue?.address || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        venue: { ...formData.venue, address: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.venue?.city || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          venue: { ...formData.venue, city: e.target.value }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="San Francisco"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.venue?.state || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          venue: { ...formData.venue, state: e.target.value }
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="California"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.venue?.country || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        venue: { ...formData.venue, country: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="USA"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Configuration */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Team Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Members *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.teamConfig?.minMembers || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    teamConfig: { ...formData.teamConfig, minMembers: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Members *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.teamConfig?.maxMembers || 5}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    teamConfig: { ...formData.teamConfig, maxMembers: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Teams
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxTeams || 100}
                  onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Registration Fee */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              Registration Fee
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.registrationFee?.amount || 0}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    registrationFee: { ...formData.registrationFee, amount: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.registrationFee?.currency || 'INR'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    registrationFee: { ...formData.registrationFee, currency: e.target.value }
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-purple-600" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="contact@hackathon.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rules & Regulations</h2>

            <div className="space-y-3">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`Rule ${index + 1}`}
                  />
                  {formData.rules.length > 1 && (
                    <button
                      onClick={() => handleRemoveRule(index)}
                      className="px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={handleAddRule}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                + Add Rule
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/hackathons/${id}`)}
              className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}