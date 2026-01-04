import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store";
import { useEffect, useState } from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import "./App.css";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import Hackathons from "./pages/Hackathons";
import Notifications from "./pages/Notifications";
import HackathonDetail from "./pages/HackathonDetail";
import CreateHackathon from "./pages/CreateHackathon";
import MyCoordinations from "./pages/MyCoordinations";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import JudgeDashboard from "./pages/JudgeDashboard";
import TeamDetail from "./pages/TeamDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TeamRequests from "./pages/TeamRequests";
import EditHackathon from "./pages/EditHackathon";
import TeamApprovals from "./pages/TeamApprovals";
import CoordinatorTest from './pages/CoordinatorTest';
import MyInvitations from './pages/MyInvitations';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ManageParticipants from './pages/ManageParticipants';
import TeamProgress from './pages/TeamProgress';
import MyRoles from './pages/MyRoles';
import RoundsManagement from './pages/RoundsManagement';
import TableAssignment from './pages/TableAssignment';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, token, initialize } = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const checkAuth = () => {
      if (initialize) {
        initialize();
      }
      setIsChecking(false);
    };
    
    checkAuth();
  }, [initialize]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const hasToken = !!token || !!localStorage.getItem('token');
  const hasUser = !!user || !!localStorage.getItem('user');

  if (!isAuthenticated || !hasToken || !hasUser) {
    console.log('🔴 Not authenticated, redirecting to login');
    // Save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user?.roles) {
    const hasRole = allowedRoles.some(role => user.roles.includes(role));
    if (!hasRole) {
      console.log('🔴 Unauthorized role');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

// Public Route Component
function PublicRoute({ children }) {
  const { isAuthenticated, token, initialize } = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const checkAuth = () => {
      if (initialize) {
        initialize();
      }
      setIsChecking(false);
    };
    
    checkAuth();
  }, [initialize]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const hasToken = !!token || !!localStorage.getItem('token');

  if (isAuthenticated && hasToken) {
    console.log('✅ Already authenticated, redirecting');
    // Redirect to the page they were trying to access, or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

function DashboardRouter() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  if (roles.includes("admin")) return <AdminDashboard />;
  if (roles.includes("judge")) return <JudgeDashboard />;

  return <Dashboard />; // student / default user
}

function AppContent() {
  const location = useLocation();

  // List of auth routes where footer should be hidden
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => location.pathname.startsWith(route)) ||
                     location.pathname.match(/^\/reset-password\/.+/);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/hackathons/:id" element={<HackathonDetail />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Forgot Password Routes - Public */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route path="/test-coordinator" element={<CoordinatorTest />} />
            
            <Route 
              path="/invitations" 
              element={
                <ProtectedRoute>
                  <MyInvitations />
                </ProtectedRoute>
              } 
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/team-requests"
              element={
                <ProtectedRoute>
                  <TeamRequests />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/create-hackathon"
              element={
                <ProtectedRoute>
                  <CreateHackathon />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/hackathons/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditHackathon />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/hackathons/:id/approvals" 
              element={
                <ProtectedRoute>
                  <TeamApprovals />
                </ProtectedRoute>
              } 
            />
            
            <Route
              path="/my-coordinations"
              element={
                <ProtectedRoute>
                  <MyCoordinations />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/coordinator/:hackathonId"
              element={
                <ProtectedRoute>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/:hackathonId/table-assignment"
              element={
                <ProtectedRoute>
                  <TableAssignment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/judge/:hackathonId"
              element={
                <ProtectedRoute>
                  <JudgeDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <TeamDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teams/:id/progress"
              element={
                <ProtectedRoute>
                  <TeamProgress />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hackathons/:id/manage"
              element={
                <ProtectedRoute>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hackathons/:id/participants"
              element={
                <ProtectedRoute>
                  <ManageParticipants />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hackathons/:id/rounds"
              element={
                <ProtectedRoute>
                  <RoundsManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-roles"
              element={
                <ProtectedRoute>
                  <MyRoles />
                </ProtectedRoute>
              }
            />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthRoute && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app mount
    console.log('🚀 App initializing auth state...');
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;