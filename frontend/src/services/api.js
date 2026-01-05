import axios from 'axios';
import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors (especially 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      console.log('🔴 401 Unauthorized - Session expired');
      
      // Get current path before clearing
      const currentPath = window.location.pathname;
      
      // Clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      
      // Update auth store
      const authStore = useAuthStore.getState();
      authStore.logout();
      
      // Only redirect to login if not already there
      // This prevents redirect loops
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('🔴 Redirecting to login...');
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.log('🔴 403 Forbidden - Access denied');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updateprofile', data),
  changePassword: (data) => api.put('/auth/changepassword', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

// Hackathon API
export const hackathonAPI = {
  getAll: () => api.get('/hackathons'),
  getById: (id) => api.get(`/hackathons/${id}`),
  create: (data) => api.post('/hackathons', data),
  update: (id, data) => api.put(`/hackathons/${id}`, data),
  delete: (id) => api.delete(`/hackathons/${id}`),
  getMyHackathons: () => api.get('/hackathons/my/organized'),
  getMyCoordinations: () => api.get('/hackathons/my/coordinations'),

  // Coordinator management
  getCoordinators: (id) => api.get(`/hackathons/${id}/coordinators`),
  inviteCoordinator: (id, data) => api.post(`/hackathons/${id}/coordinators/invite`, data),
  removeCoordinator: (id, userId) => api.delete(`/hackathons/${id}/coordinators/${userId}`),
  cancelCoordinatorInvite: (id, userId) => api.delete(`/hackathons/${id}/coordinators/${userId}/cancel`),
  resendCoordinatorInvite: (id, userId) => api.post(`/hackathons/${id}/coordinators/${userId}/resend`),
  getCoordinatorInvitations: () => api.get('/hackathons/coordinators/invitations'),
  acceptCoordinatorInvitation: (invitationId, data) => api.post(`/hackathons/coordinators/invitations/${invitationId}/accept`, data),
  declineCoordinatorInvitation: (invitationId) => api.post(`/hackathons/coordinators/invitations/${invitationId}/decline`),
  searchCoordinators: (id, query) => api.get(`/hackathons/${id}/search-coordinators?query=${encodeURIComponent(query)}`),

  // Rounds management
  getRounds: (id) => api.get(`/hackathons/${id}/rounds`),
  createRound: (id, data) => api.post(`/hackathons/${id}/rounds`, data),
  updateRound: (id, roundId, data) => api.put(`/hackathons/${id}/rounds/${roundId}`, data),
  deleteRound: (id, roundId) => api.delete(`/hackathons/${id}/rounds/${roundId}`),
  reorderRounds: (id, roundIds) => api.put(`/hackathons/${id}/rounds/reorder`, { roundIds }),
  updateRoundStatus: (id, roundId, data) => api.put(`/hackathons/${id}/rounds/${roundId}/status`, data),
  getCurrentRound: (id) => api.get(`/hackathons/${id}/rounds/current`),

  // Stats and participants
  getStats: (id) => api.get(`/hackathons/${id}/stats`),
  getParticipants: (id) => api.get(`/hackathons/${id}/participants`),
};

// Team API
export const teamAPI = {
  // Team creation and registration
  create: (data) => api.post('/teams/register', data),
  register: (data) => api.post('/teams/register', data),

  // Team retrieval
  getById: (id) => api.get(`/teams/${id}`),
  getMyTeams: () => api.get('/teams/my'),
  getUserTeamForHackathon: (hackathonId) => api.get(`/teams/my/hackathon/${hackathonId}`),
  getByHackathon: (hackathonId) => api.get(`/teams/hackathon/${hackathonId}`),
  getLeaderboard: (hackathonId) => api.get(`/teams/hackathon/${hackathonId}/leaderboard`),
  getSubmittedTeams: (hackathonId) => api.get(`/teams/hackathon/${hackathonId}/submitted`),

  // Team management
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  confirmTeam: (teamId) => api.post(`/teams/${teamId}/confirm`),

  // Team members
  searchUsersForTeam: (hackathonId, query) => api.get(`/teams/hackathon/${hackathonId}/search-users?query=${encodeURIComponent(query)}`),
  getPendingMembers: (teamId) => api.get(`/teams/${teamId}/pending-members`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  leaveTeam: (id) => api.post(`/teams/${id}/leave`),

  // Organizer team management
  organizerAddMember: (teamId, data) => api.post(`/teams/${teamId}/organizer/add-member`, data),
  organizerRemoveMember: (teamId, memberId) => api.delete(`/teams/${teamId}/organizer/remove-member/${memberId}`),
  organizerDeleteTeam: (teamId) => api.delete(`/teams/${teamId}/organizer/delete`),

  // Join requests
  getJoinRequests: (teamId) => api.get(`/teams/${teamId}/join-requests`),
  getMyJoinRequests: () => api.get('/teams/my/join-requests'),
  sendJoinRequest: (teamId, data) => api.post(`/teams/${teamId}/join-requests`, data),
  requestToJoin: (teamId, data) => api.post(`/teams/${teamId}/join-requests`, data), // Alias
  acceptJoinRequest: (teamId, requestId) => api.post(`/teams/${teamId}/join-requests/${requestId}/accept`),
  rejectJoinRequest: (teamId, requestId) => api.post(`/teams/${teamId}/join-requests/${requestId}/reject`),
  cancelJoinRequest: (teamId, requestId) => api.delete(`/teams/${teamId}/join-requests/${requestId}`),

  // Team approval (Organizer)
  approveTeam: (teamId) => api.post(`/teams/${teamId}/approve`),
  rejectTeam: (teamId, reason) => api.post(`/teams/${teamId}/reject`, { reason }),
  bulkApproveTeams: (hackathonId, teamIds) => api.post(`/teams/hackathon/${hackathonId}/bulk-approve`, { teamIds }),
  bulkRejectTeams: (hackathonId, teamIds) => api.post(`/teams/hackathon/${hackathonId}/bulk-reject`, { teamIds }),

  // Submissions
  submit: (teamId, data) => api.post(`/teams/${teamId}/submit`, data),

  // Coordinator functions
  checkIn: (teamId) => api.post(`/teams/${teamId}/checkin`),
  checkInMember: (teamId, memberId) => api.post(`/teams/${teamId}/members/${memberId}/checkin`),
  bulkCheckInMembers: (teamId, data) => api.post(`/teams/${teamId}/members/bulk-checkin`, data),
  assign: (teamId, data) => api.put(`/teams/${teamId}/assign`, data),

  // Judge functions
  score: (teamId, data) => api.post(`/teams/${teamId}/score`, data),

  // Notes
  addNoteToTeam: (teamId, data) => api.post(`/teams/${teamId}/notes`, data),
  getTeamNotes: (teamId) => api.get(`/teams/${teamId}/notes`),

  // Export
  exportTeamsToCSV: (hackathonId) => api.get(`/teams/hackathon/${hackathonId}/export`),
};

// Payment API (if you have payment functionality)
export const paymentApi = {
  createPayment: (data) => api.post('/payments', data),
  getPayments: () => api.get('/payments'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  verifyPayment: (id, data) => api.post(`/payments/${id}/verify`, data),
};