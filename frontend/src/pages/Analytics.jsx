import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Award,
  DollarSign,
  Download,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { hackathonAPI, teamAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { hackathonId } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, week, month

  useEffect(() => {
    fetchAnalytics();
  }, [hackathonId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const [hackathonRes, analyticsRes] = await Promise.all([
        hackathonAPI.getById(hackathonId),
        hackathonAPI.getAnalytics(hackathonId, { timeRange }),
      ]);
      
      setHackathon(hackathonRes.data.hackathon);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await hackathonAPI.exportAnalytics(hackathonId);
      // Download CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${hackathon.title}-analytics.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const COLORS = ['#ef4444', '#0ea5e9', '#eab308', '#10b981', '#8b5cf6'];

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Registrations',
      value: analytics.totalRegistrations,
      change: '+12%',
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Active Teams',
      value: analytics.activeTeams,
      change: '+8%',
      icon: Award,
      color: 'secondary',
    },
    {
      label: 'Revenue',
      value: `₹${analytics.totalRevenue}`,
      change: '+15%',
      icon: DollarSign,
      color: 'accent',
    },
    {
      label: 'Submission Rate',
      value: `${analytics.submissionRate}%`,
      change: '+5%',
      icon: Target,
      color: 'success',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dark-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-dark-600">{hackathon?.title}</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="week">Last Week</option>
            </select>
            <Button
              onClick={exportReport}
              size="sm"
              variant="outline"
              icon={Download}
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <Badge variant="success">{stat.change}</Badge>
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-dark-600">{stat.label}</div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Registration Trend */}
          <Card title="Registration Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="registrations" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Team Status Distribution */}
          <Card title="Team Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.teamStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.teamStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Submissions by Round */}
          <Card title="Submissions by Round">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.submissionsByRound}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="roundName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Performers */}
          <Card title="Top 10 Teams">
            <div className="space-y-3">
              {analytics.topTeams.slice(0, 10).map((team, idx) => (
                <div key={team._id} className="flex items-center justify-between p-3 bg-dark-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-accent-500 text-white' :
                      idx === 1 ? 'bg-dark-400 text-white' :
                      idx === 2 ? 'bg-orange-500 text-white' :
                      'bg-dark-200 text-dark-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{team.teamName}</div>
                      <div className="text-sm text-dark-600">{team.members.length} members</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-600">{team.overallScore.toFixed(1)}</div>
                    <div className="text-xs text-dark-600">points</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Card title="Detailed Metrics" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Participation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-600">Check-in Rate:</span>
                  <span className="font-semibold">{analytics.checkInRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Avg Team Size:</span>
                  <span className="font-semibold">{analytics.avgTeamSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Solo Participants:</span>
                  <span className="font-semibold">{analytics.soloParticipants}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Engagement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-600">Active Days:</span>
                  <span className="font-semibold">{analytics.activeDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Avg Submissions:</span>
                  <span className="font-semibold">{analytics.avgSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Feedback Given:</span>
                  <span className="font-semibold">{analytics.feedbackCount}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-600">Completion Rate:</span>
                  <span className="font-semibold">{analytics.completionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Avg Score:</span>
                  <span className="font-semibold">{analytics.avgScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-600">Eliminations:</span>
                  <span className="font-semibold">{analytics.eliminatedTeams}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
