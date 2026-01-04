import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Trophy, Star } from 'lucide-react';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated, token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    const hasToken = !!token || !!localStorage.getItem('token');
    
    if (isAuthenticated && hasToken) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('✅ Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, token, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 Attempting login for:', formData.email);
      
      const response = await authAPI.login(formData);
      
      console.log('✅ Login successful');
      
      // Set auth data in store and localStorage
      setAuth(response.data.user, response.data.token);
      
      // Show success message
      toast.success(`Welcome back, ${response.data.user.fullName}!`);
      
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('✅ Redirecting to:', from);
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with gradient background */}
      <section className="max-w-full mx-auto p-4 pt-0">
        <div className="w-full bg-linear-to-b from-blue-100 to-white px-4 sm:px-6 lg:px-8 pt-20 pb-16 rounded-2xl">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-left"
            >
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center transform rotate-12">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">HackPlatform</span>
              </Link>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Welcome Back to Your
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Innovation Journey
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8">
                Sign in to access your dashboard, manage hackathons, and connect with talented innovators worldwide.
              </p>

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 border-2 border-gray-200 shadow-sm">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-orange-400 text-orange-400"
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm font-medium">
                  Trusted by 10,000+ users
                </span>
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="px-8 py-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
                    <p className="text-gray-600">Continue to your account</p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 font-medium">Remember me</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          Sign In
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link
                        to="/register"
                        className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Create account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}