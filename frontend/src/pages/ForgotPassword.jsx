import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, Trophy, Star } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await authAPI.forgotPassword({ email });
      
      setEmailSent(true);
      toast.success('Password reset link sent to your email!', {
        duration: 5000,
        icon: '📧',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white">
        <section className="max-w-full mx-auto p-4 pt-0">
          <div className="w-full bg-linear-to-b from-blue-100 to-white px-4 sm:px-6 lg:px-8 pt-20 pb-16 rounded-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="px-8 py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Check Your Email!</h2>
                  <p className="text-gray-600 text-lg mb-8">We've sent you a password reset link</p>

                  <div className="text-center mb-8">
                    <p className="text-gray-600 mb-2">
                      We've sent a password reset link to:
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{email}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      Next steps:
                    </p>
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                      <li>Check your email inbox</li>
                      <li>Click the password reset link</li>
                      <li>Enter your new password</li>
                      <li>Log in with your new password</li>
                    </ol>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8 text-left">
                    <p className="text-sm font-semibold text-yellow-900 mb-3">
                      Didn't receive the email?
                    </p>
                    <ul className="text-sm text-yellow-800 space-y-2">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Wait a few minutes and check again</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setEmailSent(false)}
                      className="w-full px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-semibold hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      Send to a different email
                    </button>

                    <Link to="/login">
                      <button className="w-full px-6 py-3.5 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-full mx-auto p-4 pt-0">
        <div className="w-full bg-linear-to-b from-blue-100 to-white px-4 sm:px-6 lg:px-8 pt-20 pb-16 rounded-2xl">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
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
                Reset Your
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Password
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8">
                No worries! We'll send you reset instructions to get you back on track.
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
                  Secure & Trusted
                </span>
              </div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="px-8 py-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">We'll send you reset instructions</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Enter the email address associated with your account
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending reset link...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Reset Link
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Login
                    </Link>
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