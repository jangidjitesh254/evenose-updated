import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Building, UserPlus, Trophy, Star } from 'lucide-react';
import { useAuthStore } from '../store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with gradient background */}
      <section className="max-w-full mx-auto p-4 pt-0">
        <div className="w-full bg-linear-to-b from-blue-100 to-white px-4 sm:px-6 lg:px-8 pt-20 pb-16 rounded-2xl">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center transform rotate-12">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">HackPlatform</span>
              </Link>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Start Your{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Innovation Journey
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Join thousands of hackers and organizers worldwide
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

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="px-8 py-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                    <p className="text-gray-600">Fill in your details to get started</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        icon={User}
                        placeholder="John Doe"
                        error={errors.fullName?.message}
                        {...register('fullName', {
                          required: 'Full name is required',
                          minLength: {
                            value: 3,
                            message: 'Name must be at least 3 characters',
                          },
                        })}
                      />

                      <Input
                        label="Username"
                        icon={User}
                        placeholder="johndoe"
                        error={errors.username?.message}
                        {...register('username', {
                          required: 'Username is required',
                          minLength: {
                            value: 3,
                            message: 'Username must be at least 3 characters',
                          },
                          pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message: 'Username can only contain letters, numbers, and underscores',
                          },
                        })}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        placeholder="you@example.com"
                        error={errors.email?.message}
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                      />

                      <Input
                        label="Phone Number"
                        type="tel"
                        icon={Phone}
                        placeholder="+1234567890"
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                    </div>

                    <Input
                      label="Institution / Organization"
                      icon={Building}
                      placeholder="Your University or Company"
                      error={errors.institution?.message}
                      {...register('institution')}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Password"
                        type="password"
                        icon={Lock}
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                          },
                        })}
                      />

                      <Input
                        label="Confirm Password"
                        type="password"
                        icon={Lock}
                        placeholder="••••••••"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === password || 'Passwords do not match',
                        })}
                      />
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
                      <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 w-4 h-4 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        {...register('terms', {
                          required: 'You must accept the terms and conditions',
                        })}
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700">
                        I agree to the{' '}
                        <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    {errors.terms && (
                      <p className="text-sm text-red-600 font-medium">{errors.terms.message}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center justify-center gap-2 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Create Account
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                        Sign in here
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
