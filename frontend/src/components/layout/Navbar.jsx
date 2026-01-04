import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Shield,
  X, 
  Home, 
  Trophy, 
  Users, 
  LogIn, 
  UserPlus,
  LogOut,
  User,
  Settings,
  Briefcase,
  Award,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import Button from '../ui/Button';
import InvitationsNotification from '../InvitationsNotification';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileMenuOpen(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'About', href: '/about', icon: Users },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"
            >
              <Trophy className="w-6 h-6 text-indigo-600" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Hack<span className="text-indigo-600">Platform</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="text-black hover:bg-gray-100 hover:text-indigo-600" icon={LayoutDashboard} size="sm">
                    Dashboard
                  </Button>
                </Link>
    <Link to="/hackathons">Hackathons</Link>
    
    {/* ADD THIS: Shows notification badge when user has pending invitations */}
    <InvitationsNotification />
    
                
                <div className="relative" ref={profileMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 border-2 border-transparent hover:border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-semibold">
                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {user?.fullName?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        profileMenuOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </motion.button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-gray-200 py-2 overflow-hidden"
                      >
                        <div className="flex items-center justify-center gap-1 px-1 py-3">
                          <span className="text-white text-sm font-semibold bg-indigo-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        <div className="px-4 py-3 border-b-2 border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{user?.email}</p>
                        </div>
                        </div>

                        <div className="py-2">
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="font-medium">Dashboard</span>
                          </Link>

                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="font-medium">Profile</span>
                          </Link>

                          <Link
                            to="/my-roles"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium">My Roles</span>
                          </Link>

                          <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <Settings className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="font-medium">Settings</span>
                          </Link>

                          {user?.roles?.includes('coordinator') && (
                            <Link
                              to="/my-coordinations"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                              onClick={() => setProfileMenuOpen(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium">My Coordinations</span>
                            </Link>
                          )}

                          {user?.roles?.includes('judge') && (
                            <Link
                              to="/my-judging"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                              onClick={() => setProfileMenuOpen(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                <Award className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium">My Judging</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t-2 border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-left text-red-600"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                              <LogOut className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" icon={LogIn} size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" icon={UserPlus} size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? 
              <X className="w-6 h-6 text-gray-700" /> : 
              <Menu className="w-6 h-6 text-gray-700" />
            }
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t-2 border-gray-200 bg-white/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
              
              <div className="h-px bg-gray-200 my-2" />
              
              {isAuthenticated ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">Profile</span>
                    </Link>
                  </motion.div>

                  {user?.roles?.includes('coordinator') && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Link
                        to="/my-coordinations"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">My Coordinations</span>
                      </Link>
                    </motion.div>
                  )}

                  <div className="h-px bg-gray-200 my-2" />

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-red-600 w-full"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <LogIn className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium">Login</span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 transition-colors text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium">Sign Up</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}