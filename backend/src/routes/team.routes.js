const express = require('express');
const router = express.Router();
const {
  registerTeam,
  getTeamsByHackathon,
  getTeam,
  updateTeam,
  checkInTeam,
  checkInMember,
  bulkCheckInMembers,
  assignTableAndTeamNumber,
  submitProject,
  scoreTeam,
  eliminateTeam,
  getLeaderboard,
  getMyTeams,
  getUserTeamForHackathon,
  searchUsersForTeam,
  sendJoinRequest,
  getJoinRequests,
  getMyJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  approveTeam,
  rejectTeam,
  leaveTeam,
  removeMember,
  getPendingMembers,
  cancelJoinRequest,
  confirmTeam,
  getSubmittedTeams,
  bulkApproveTeams,
  bulkRejectTeams,
  exportTeamsToCSV,
  addNoteToTeam,
  getTeamNotes,
  checkAutoApproval,
  organizerAddMember,
  organizerRemoveMember,
  organizerDeleteTeam
} = require('../controllers/team.controller');
const { protect, isCoordinator, isJudge, checkCoordinatorPermission, authorize } = require('../middleware/auth');
const { upload, configureUploadLimits } = require('../middleware/upload');

// Student routes
router.post('/register', protect, registerTeam);
router.get('/my', protect, getMyTeams);
router.get('/my/hackathon/:hackathonId', protect, getUserTeamForHackathon);
router.get('/my/join-requests', protect, getMyJoinRequests);
router.get('/:id', protect, getTeam);
router.put('/:id', protect, updateTeam);
router.post('/:id/submit', protect, configureUploadLimits, upload.array('files', 10), submitProject);

// Team confirmation
router.post('/:teamId/confirm', protect, confirmTeam);

// Team join requests
router.get('/hackathon/:hackathonId/search-users', protect, searchUsersForTeam);
router.post('/:teamId/join-requests', protect, sendJoinRequest);
router.get('/:teamId/join-requests', protect, getJoinRequests);
router.get('/:teamId/pending-members', protect, getPendingMembers);
router.post('/:teamId/join-requests/:requestId/accept', protect, acceptJoinRequest);
router.post('/:teamId/join-requests/:requestId/reject', protect, rejectJoinRequest);
router.delete('/:teamId/join-requests/:requestId', protect, cancelJoinRequest);

// Team member management
router.post('/:teamId/leave', protect, leaveTeam);
router.delete('/:teamId/members/:memberId', protect, removeMember);

// Team notes
router.post('/:teamId/notes', protect, addNoteToTeam);
router.get('/:teamId/notes', protect, getTeamNotes);

// Organizer routes for team approval
router.get('/hackathon/:hackathonId/submitted', protect, getSubmittedTeams);
router.post('/:teamId/approve', protect, approveTeam);
router.post('/:teamId/reject', protect, rejectTeam);
router.post('/hackathon/:hackathonId/bulk-approve', protect, bulkApproveTeams);
router.post('/hackathon/:hackathonId/bulk-reject', protect, bulkRejectTeams);
router.get('/hackathon/:hackathonId/export', protect, exportTeamsToCSV);

// Organizer routes for team management
router.post('/:teamId/organizer/add-member', protect, organizerAddMember);
router.delete('/:teamId/organizer/remove-member/:memberId', protect, organizerRemoveMember);
router.delete('/:teamId/organizer/delete', protect, organizerDeleteTeam);

// Auto-approval
router.post('/:teamId/check-auto-approval', protect, checkAutoApproval);

// Coordinator routes
router.get('/hackathon/:hackathonId', protect, isCoordinator, getTeamsByHackathon);
router.post('/:id/checkin', protect, isCoordinator, checkCoordinatorPermission('canCheckIn'), checkInTeam);
router.post('/:id/members/:memberId/checkin', protect, isCoordinator, checkCoordinatorPermission('canCheckIn'), checkInMember);
router.post('/:id/members/bulk-checkin', protect, isCoordinator, checkCoordinatorPermission('canCheckIn'), bulkCheckInMembers);
router.put('/:id/assign', protect, isCoordinator, checkCoordinatorPermission('canAssignTables'), assignTableAndTeamNumber);
router.post('/:id/eliminate', protect, isCoordinator, checkCoordinatorPermission('canEliminateTeams'), eliminateTeam);

// Judge routes
router.post('/:id/score', protect, isJudge, scoreTeam);

// Public routes (leaderboard)
router.get('/hackathon/:hackathonId/leaderboard', getLeaderboard);

module.exports = router;