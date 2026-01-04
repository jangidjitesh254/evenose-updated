import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';


export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Set user and token after login
      setAuth: (user, token) => {
        console.log('✅ Setting auth:', { user: user.email, hasToken: !!token });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      // Update user info
      setUser: (user) => {
        console.log('✅ Updating user:', user.email);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },

      // Logout - Clear everything
      logout: () => {
        console.log('🔴 Logging out - clearing all data');
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage'); // Zustand persist key
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Initialize from localStorage (called on app load)
      initialize: () => {
        console.log('🔍 Initializing auth from localStorage...');

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            console.log('✅ Found stored auth:', { user: user.email });
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('❌ Failed to parse user data:', error);
            // Clear corrupted data
            get().logout();
          }
        } else {
          console.log('ℹ️ No stored auth found');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // Register new user
      register: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.register(userData);

          const { token, user } = response.data;

          // Store auth data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return response.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Login user
      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.login({ email, password });

          const { token, user } = response.data;

          // Store auth data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return response.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);





export const useHackathonStore = create((set) => ({
  hackathons: [],
  currentHackathon: null,
  myHackathons: [],
  myCoordinations: [],
  isLoading: false,

  setHackathons: (hackathons) => set({ hackathons }),
  setCurrentHackathon: (hackathon) => set({ currentHackathon: hackathon }),
  setMyHackathons: (hackathons) => set({ myHackathons: hackathons }),
  setMyCoordinations: (coordinations) => set({ myCoordinations: coordinations }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useTeamStore = create((set) => ({
  teams: [],
  myTeams: [],
  currentTeam: null,
  leaderboard: [],
  isLoading: false,

  setTeams: (teams) => set({ teams }),
  setMyTeams: (teams) => set({ myTeams: teams }),
  setCurrentTeam: (team) => set({ currentTeam: team }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useUIStore = create((set) => ({
  theme: 'light',
  sidebarOpen: true,
  
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
