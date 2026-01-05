const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const emailService = require('../services/email.service');

// @desc    Register team for hackathon
// @route   POST /api/teams/register
// @access  Private
exports.registerTeam = async (req, res) => {
  try {
    const { hackathonId, teamName, members, projectTitle, projectDescription } = req.body;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check if registration is open
    if (!hackathon.isRegistrationOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this hackathon'
      });
    }

    // Check if user is already registered
    const existingTeam = await Team.findOne({
      hackathon: hackathonId,
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id, 'members.status': 'active' }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this hackathon'
      });
    }

    // Check if user is a coordinator (cannot participate as both)
    const User = require('../models/User');
    const userDoc = await User.findById(req.user._id);
    if (userDoc && userDoc.isCoordinatorFor(hackathonId)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinators cannot participate in the hackathon'
      });
    }

    // Validate team size - allow creation with any size, but note if it meets requirements
    const totalMembers = members ? members.length + 1 : 1; // +1 for leader
    const meetsRequirements = totalMembers >= hackathon.teamConfig.minMembers && 
                              totalMembers <= hackathon.teamConfig.maxMembers;

    // Check max teams limit
    if (hackathon.currentRegistrations >= hackathon.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Maximum team limit reached for this hackathon'
      });
    }

    // Prepare team members
    const teamMembers = [
      {
        user: req.user._id,
        role: 'leader',
        status: 'active'
      }
    ];

    if (members && members.length > 0) {
      for (const memberId of members) {
        // Check if member is already in another team
        const memberInTeam = await Team.findOne({
          hackathon: hackathonId,
          'members.user': memberId,
          'members.status': 'active'
        });

        if (memberInTeam) {
          return res.status(400).json({
            success: false,
            message: 'One or more members are already registered in another team'
          });
        }

        teamMembers.push({
          user: memberId,
          role: 'member',
          status: 'active'
        });
      }
    }

    // Create team
    const team = await Team.create({
      hackathon: hackathonId,
      teamName,
      leader: req.user._id,
      members: teamMembers,
      projectTitle,
      projectDescription,
      submissionStatus: 'draft', // Start as draft, needs confirmation before submission
      registrationStatus: 'pending',
      payment: {
        status: hackathon.registrationFee.amount > 0 ? 'pending' : 'completed',
        amount: hackathon.registrationFee.amount,
        currency: hackathon.registrationFee.currency
      }
    });

    // Update hackathon registration count
    hackathon.currentRegistrations += 1;
    await hackathon.save();

    // Populate team for response
    await team.populate('members.user', 'fullName email username');
    await team.populate('leader', 'fullName email username');

    // Send confirmation email
    try {
      // TODO: Implement sendTeamRegistrationConfirmation in email service
      // await emailService.sendTeamRegistrationConfirmation(
      //   { teamName, members: teamMembers, leader: req.user },
      //   hackathon
      // );
      console.log('Team registration confirmation email would be sent here');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: meetsRequirements 
        ? 'Team registered successfully. You can now submit for approval.' 
        : `Team created successfully. Add ${hackathon.teamConfig.minMembers - totalMembers} more member(s) to meet the minimum requirement of ${hackathon.teamConfig.minMembers} members before submitting for approval.`,
      team,
      meetsRequirements,
      requiresPayment: hackathon.registrationFee.amount > 0
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's team for a specific hackathon
// @route   GET /api/teams/my/hackathon/:hackathonId
// @access  Private
exports.getUserTeamForHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const team = await Team.findOne({
      hackathon: hackathonId,
      $or: [
        { leader: req.user._id },
        {
          members: {
            $elemMatch: {
              user: req.user._id,
              status: 'active'
            }
          }
        }
      ]
    })
      .populate('leader', 'fullName email username')
      .populate('members.user', 'fullName email username')
      .populate('hackathon', 'title');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Not registered for this hackathon'
      });
    }

    // Filter out removed and left members before sending to frontend
    const teamObj = team.toObject();
    teamObj.members = teamObj.members.filter(member => member.status === 'active');

    res.status(200).json({
      success: true,
      team: teamObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search users for team invitation
// @route   GET /api/teams/hackathon/:hackathonId/search-users
// @access  Private
exports.searchUsersForTeam = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters'
      });
    }

    // Find all users matching the search (not limited to hackathon participants)
    // Filter to include users with student role or no roles (defaults to student)
    const users = await User.find({
      $and: [
        {
          $or: [
            { fullName: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        {
          _id: { $ne: req.user._id } // Exclude current user
        },
        {
          $or: [
            { roles: { $in: ['student'] } },
            { roles: { $size: 0 } },
            { roles: { $exists: false } }
          ]
        }
      ]
    })
      .select('fullName username email roles institution')
      .limit(50); // Increased limit to search more users

    console.log(`Found ${users.length} users matching search query: ${query}`);

    // Get all user IDs that are already in teams for this hackathon (for efficient filtering)
    const teamsInHackathon = await Team.find({
      hackathon: hackathonId
    }).select('members.user members.status');

    const userIdsInTeams = new Set();
    teamsInHackathon.forEach(team => {
      team.members.forEach(member => {
        // Only add users who are ACTIVE members (exclude removed/left members)
        if (member.user && member.status === 'active') {
          userIdsInTeams.add(member.user.toString());
        }
      });
    });

    // Get all pending join requests for this team to show invite status
    const teamId = req.query.teamId; // Get teamId from query params
    const pendingRequests = teamId ? await JoinRequest.find({
      team: teamId,
      hackathon: hackathonId,
      status: 'pending'
    }).select('user') : [];

    const userIdsWithPendingRequests = new Set();
    pendingRequests.forEach(request => {
      if (request.user) {
        userIdsWithPendingRequests.add(request.user.toString());
      }
    });

    // Filter out users already in teams for this hackathon and add request status
    const usersNotInTeams = users
      .filter(user => !userIdsInTeams.has(user._id.toString()))
      .map(user => {
        const userObj = user.toObject();
        userObj.hasPendingRequest = userIdsWithPendingRequests.has(user._id.toString());
        // Ensure roles is always an array (default to student if empty)
        if (!userObj.roles || userObj.roles.length === 0) {
          userObj.roles = ['student'];
        }
        return userObj;
      });

    console.log(`Returning ${usersNotInTeams.length} users not in teams (after filtering)`);

    res.status(200).json({
      success: true,
      users: usersNotInTeams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send join request to user
// @route   POST /api/teams/:teamId/join-requests
// @access  Private (Team Leader)
exports.sendJoinRequest = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const team = await Team.findById(teamId).populate('hackathon');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can send join requests'
      });
    }

    // Check if team is full
    if (team.members.length >= team.hackathon.teamConfig.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a coordinator for this hackathon (cannot participate as both)
    if (user.isCoordinatorFor(team.hackathon._id)) {
      return res.status(400).json({
        success: false,
        message: 'This user is a coordinator for this hackathon and cannot join a team'
      });
    }

    // Check if user is already in a team for this hackathon
    const userTeam = await Team.findOne({
      hackathon: team.hackathon._id,
      members: {
        $elemMatch: {
          user: userId,
          status: 'active'
        }
      }
    });

    if (userTeam) {
      return res.status(400).json({
        success: false,
        message: 'User is already in a team for this hackathon'
      });
    }

    // Check if request already exists
    const existingRequest = await JoinRequest.findOne({
      team: teamId,
      user: userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Join request already sent to this user'
      });
    }

    // Create join request
    const joinRequest = await JoinRequest.create({
      team: teamId,
      user: userId,
      sender: req.user._id,
      hackathon: team.hackathon._id,
      message: `${req.user.fullName} has invited you to join their team "${team.teamName}"`
    });

    // Send notification email
    try {
      await emailService.sendJoinRequestNotification(user, team, req.user);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully',
      joinRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get join requests for a team
// @route   GET /api/teams/:teamId/join-requests
// @access  Private (Team Leader)
exports.getJoinRequests = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can view join requests'
      });
    }

    const joinRequests = await JoinRequest.find({
      team: teamId,
      status: 'pending'
    })
      .populate('user', 'fullName email username')
      .populate('sender', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      joinRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my join requests (as a user)
// @route   GET /api/teams/my/join-requests
// @access  Private
exports.getMyJoinRequests = async (req, res) => {
  try {
    const joinRequests = await JoinRequest.find({
      user: req.user._id,
      status: 'pending'
    })
      .populate('team', 'teamName')
      .populate('sender', 'fullName')
      .populate('hackathon', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      joinRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept join request
// @route   POST /api/teams/:teamId/join-requests/:requestId/accept
// @access  Private (User receiving request)
exports.acceptJoinRequest = async (req, res) => {
  try {
    const { teamId, requestId } = req.params;

    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      team: teamId,
      user: req.user._id,
      status: 'pending'
    })
      .populate('team')
      .populate('hackathon')
      .populate('sender', 'fullName email');

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    // Check if user is already in a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathon: joinRequest.hackathon._id,
      members: {
        $elemMatch: {
          user: req.user._id,
          status: 'active'
        }
      }
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this hackathon'
      });
    }

    const team = await Team.findById(teamId).populate('hackathon').populate('leader', 'fullName email');

    // Check if user already has a member record in this team (removed or left)
    const existingMemberIndex = team.members.findIndex(
      m => m.user.toString() === req.user._id.toString()
    );

    if (existingMemberIndex !== -1) {
      // User was previously in this team - reactivate their membership
      team.members[existingMemberIndex].status = 'active';
      team.members[existingMemberIndex].joinedAt = new Date();
      team.members[existingMemberIndex].role = 'member';
    } else {
      // Check if team is full (only count active members)
      const activeMembersCount = team.members.filter(m => m.status === 'active').length;
      if (activeMembersCount >= team.hackathon.teamConfig.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Team is already full'
        });
      }

      // Add new member to team
      team.members.push({
        user: req.user._id,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      });
    }

    await team.save();

    // Update join request status
    joinRequest.status = 'accepted';
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    // Reject all other pending requests for this user for the same hackathon
    await JoinRequest.updateMany(
      {
        user: req.user._id,
        hackathon: joinRequest.hackathon._id,
        status: 'pending',
        _id: { $ne: requestId }
      },
      {
        status: 'rejected',
        respondedAt: new Date()
      }
    );

    // Send email notification to team leader
    try {
      const teamLeader = joinRequest.sender || team.leader;
      await emailService.sendJoinRequestAcceptedNotification(
        teamLeader,
        team,
        req.user
      );
    } catch (emailError) {
      console.error('Failed to send acceptance notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined the team',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject join request
// @route   POST /api/teams/:teamId/join-requests/:requestId/reject
// @access  Private (User receiving request)
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { teamId, requestId } = req.params;
    const { reason } = req.body;

    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      team: teamId,
      user: req.user._id,
      status: 'pending'
    })
      .populate('team')
      .populate('sender', 'fullName email');

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    joinRequest.status = 'rejected';
    joinRequest.respondedAt = new Date();
    if (reason) {
      joinRequest.rejectionReason = reason;
    }
    await joinRequest.save();

    // Send email notification to team leader
    try {
      const team = await Team.findById(teamId).populate('leader', 'fullName email');
      const teamLeader = joinRequest.sender || team.leader;
      await emailService.sendJoinRequestRejectedNotification(
        teamLeader,
        joinRequest.team,
        req.user,
        reason
      );
    } catch (emailError) {
      console.error('Failed to send rejection notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Join request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve team (Admin)
// @route   PUT /api/teams/:id/approve
// @access  Private (Admin, Organizer)
exports.approveTeam = async (req, res) => {
  try {
    console.log('=== approveTeam Debug ===');
    console.log('Team ID:', req.params.teamId);
    console.log('User ID:', req.user._id);
    
    const team = await Team.findById(req.params.teamId).populate('hackathon');

    if (!team) {
      console.log('❌ Team not found');
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    console.log('✅ Team found:', team.teamName);
    console.log('Current submission status:', team.submissionStatus);

    // Check authorization
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.hasAnyRole(['admin', 'super_admin']);

    if (!isOrganizer && !isAdmin) {
      console.log('❌ Not authorized');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve teams'
      });
    }

    console.log('✅ User authorized');

    // Update both statuses for compatibility
    team.submissionStatus = 'approved';
    team.registrationStatus = 'approved';
    team.approvedAt = new Date();
    team.approvedBy = req.user._id;
    await team.save();

    console.log('✅ Team approved successfully');

    // Send notification email
    try {
      const leader = await User.findById(team.leader);
      await emailService.sendTeamApprovalNotification(leader, team, team.hackathon);
      console.log('✅ Approval email sent');
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Team approved successfully',
      team
    });
  } catch (error) {
    console.error('❌ approveTeam error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject team (Admin)
// @route   POST /api/teams/:teamId/reject
// @access  Private (Admin, Organizer)
exports.rejectTeam = async (req, res) => {
  try {
    console.log('=== rejectTeam Debug ===');
    console.log('Team ID:', req.params.teamId);
    console.log('Reason:', req.body.reason);
    
    const { reason } = req.body;
    const team = await Team.findById(req.params.teamId).populate('hackathon');

    if (!team) {
      console.log('❌ Team not found');
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    console.log('✅ Team found:', team.teamName);

    // Check authorization
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.hasAnyRole(['admin', 'super_admin']);

    if (!isOrganizer && !isAdmin) {
      console.log('❌ Not authorized');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject teams'
      });
    }

    console.log('✅ User authorized');

    // Return to draft status and set rejection reason
    team.submissionStatus = 'draft';
    team.registrationStatus = 'rejected';
    team.rejectionReason = reason || 'No reason provided';
    
    if (reason) {
      team.notes.push({
        author: req.user._id,
        content: `Rejection reason: ${reason}`,
        createdAt: new Date(),
        isPublic: true
      });
    }
    await team.save();

    console.log('✅ Team rejected successfully');

    // Send notification email
    try {
      const leader = await User.findById(team.leader);
      await emailService.sendTeamRejectionNotification(leader, team, team.hackathon, reason);
      console.log('✅ Rejection email sent');
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Team rejected',
      team
    });
  } catch (error) {
    console.error('❌ rejectTeam error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get teams for a hackathon
// @route   GET /api/teams/hackathon/:hackathonId
// @access  Private (Coordinator, Organizer, Judge)
exports.getTeamsByHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { status, eliminated, page = 1, limit = 20 } = req.query;

    const query = { hackathon: hackathonId };

    // Only filter by status if explicitly provided
    if (status) {
      query.registrationStatus = status;
    }

    if (eliminated !== undefined) {
      query.isEliminated = eliminated === 'true';
    }

    const teams = await Team.find(query)
      .populate('leader', 'fullName email username institution')
      .populate('members.user', 'fullName email username institution')
      .populate('hackathon', 'title')
      .sort({ overallScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Team.countDocuments(query);

    // Filter out removed and left members from all teams before sending to frontend
    const teamsWithActiveMembers = teams.map(team => {
      const teamObj = team.toObject();
      teamObj.members = teamObj.members.filter(member => member.status === 'active');
      return teamObj;
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      teams: teamsWithActiveMembers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('hackathon')
      .populate('leader', 'fullName email username institution profile')
      .populate('members.user', 'fullName email username institution profile')
      .populate('scores.judge', 'fullName email')
      .populate('notes.author', 'fullName');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Filter out removed and left members before sending to frontend
    const teamObj = team.toObject();
    teamObj.members = teamObj.members.filter(member => member.status === 'active');

    res.status(200).json({
      success: true,
      team: teamObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team Leader)
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('hackathon');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update team details'
      });
    }

    const { teamName, projectTitle, projectDescription, techStack } = req.body;

    // Check if team name change is allowed
    if (teamName && !team.hackathon.settings.allowTeamNameChange) {
      return res.status(400).json({
        success: false,
        message: 'Team name change is not allowed'
      });
    }

    if (teamName) team.teamName = teamName;
    if (projectTitle) team.projectTitle = projectTitle;
    if (projectDescription) team.projectDescription = projectDescription;
    if (techStack) team.techStack = techStack;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check-in team
// @route   POST /api/teams/:id/checkin
// @access  Private (Coordinator, Organizer)
exports.checkInTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    team.checkIn.isCheckedIn = true;
    team.checkIn.checkedInAt = new Date();
    team.checkIn.checkedInBy = req.user._id;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team checked in successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check-in team member
// @route   POST /api/teams/:id/members/:memberId/checkin
// @access  Private (Coordinator, Organizer)
exports.checkInMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const member = team.members.find(
      m => m.user.toString() === req.params.memberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }

    member.checkIn.isCheckedIn = true;
    member.checkIn.checkedInAt = new Date();
    member.checkIn.checkedInBy = req.user._id;

    // Check if all members are checked in
    const allCheckedIn = team.members.every(m => m.checkIn.isCheckedIn);
    if (allCheckedIn) {
      team.checkIn.allMembersCheckedIn = true;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member checked in successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk check-in team members
// @route   POST /api/teams/:id/members/bulk-checkin
// @access  Private (Coordinator, Organizer)
exports.bulkCheckInMembers = async (req, res) => {
  try {
    const { memberIds, tableNumber, teamNumber } = req.body;
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'fullName email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: 'Member IDs must be provided as an array'
      });
    }

    let checkedInCount = 0;
    let alreadyCheckedIn = 0;

    // Check in specified members
    memberIds.forEach(memberId => {
      const member = team.members.find(
        m => m.user._id.toString() === memberId.toString()
      );

      if (member) {
        if (!member.checkIn.isCheckedIn) {
          member.checkIn.isCheckedIn = true;
          member.checkIn.checkedInAt = new Date();
          member.checkIn.checkedInBy = req.user._id;
          checkedInCount++;
        } else {
          alreadyCheckedIn++;
        }
      }
    });

    // Update table and team numbers if provided
    if (tableNumber !== undefined && tableNumber !== '') {
      team.tableNumber = tableNumber;
    }
    if (teamNumber !== undefined && teamNumber !== '') {
      team.teamNumber = teamNumber;
    }

    // Check if all active members are checked in
    const activeMembers = team.members.filter(m => m.status === 'active');
    const allCheckedIn = activeMembers.every(m => m.checkIn.isCheckedIn);

    if (allCheckedIn) {
      team.checkIn.isCheckedIn = true;
      team.checkIn.checkedInAt = new Date();
      team.checkIn.checkedInBy = req.user._id;
      team.checkIn.allMembersCheckedIn = true;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: `Successfully checked in ${checkedInCount} member(s)${alreadyCheckedIn > 0 ? `, ${alreadyCheckedIn} already checked in` : ''}`,
      checkedInCount,
      alreadyCheckedIn,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign table and team number
// @route   PUT /api/teams/:id/assign
// @access  Private (Coordinator, Organizer)
exports.assignTableAndTeamNumber = async (req, res) => {
  try {
    const { tableNumber, teamNumber } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (tableNumber) team.tableNumber = tableNumber;
    if (teamNumber) team.teamNumber = teamNumber;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Table and team number assigned successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit project for round
// @route   POST /api/teams/:id/submit
// @access  Private (Team Member)
exports.submitProject = async (req, res) => {
  try {
    const { roundId, projectLink, demoLink, videoLink, presentationLink, githubRepo, description, techStack } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team member
    if (!team.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can submit'
      });
    }

    // Check if already submitted for this round
    const existingSubmission = team.submissions.find(
      s => s.round.toString() === roundId
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Already submitted for this round'
      });
    }

    // Process uploaded files
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        files.push({
          name: file.originalname,
          url: `/uploads/submissions/${file.filename}`,
          type: file.mimetype,
          size: file.size
        });
      });
    }

    team.submissions.push({
      round: roundId,
      submittedAt: new Date(),
      submittedBy: req.user._id,
      projectLink,
      demoLink,
      videoLink,
      presentationLink,
      githubRepo,
      files,
      description,
      techStack,
      status: 'submitted'
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Project submitted successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Score team (Judge)
// @route   POST /api/teams/:id/score
// @access  Private (Judge)
exports.scoreTeam = async (req, res) => {
  try {
    const { roundId, criteriaScores, remarks, feedback } = req.body;
    
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if judge already scored this team for this round
    const existingScore = team.scores.find(
      s => s.round.toString() === roundId && 
           s.judge.toString() === req.user._id.toString()
    );

    if (existingScore) {
      return res.status(400).json({
        success: false,
        message: 'You have already scored this team for this round'
      });
    }

    // Calculate total score
    const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
    const maxPossibleScore = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);

    team.scores.push({
      round: roundId,
      judge: req.user._id,
      criteriaScores,
      totalScore,
      maxPossibleScore,
      remarks,
      feedback,
      isFinalized: true
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team scored successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminate team
// @route   POST /api/teams/:id/eliminate
// @access  Private (Organizer, Admin)
exports.eliminateTeam = async (req, res) => {
  try {
    const { roundId, reason } = req.body;
    
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    team.isEliminated = true;
    team.eliminatedAt = new Date();
    team.eliminatedInRound = roundId;
    team.eliminatedBy = req.user._id;
    team.eliminationReason = reason;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team eliminated successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/teams/hackathon/:hackathonId/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { roundId } = req.query;

    const query = { 
      hackathon: hackathonId,
      registrationStatus: 'approved',
      isEliminated: false
    };

    let teams = await Team.find(query)
      .populate('leader', 'fullName institution')
      .populate('members.user', 'fullName')
      .select('teamName teamNumber overallScore scores projectTitle')
      .sort({ overallScore: -1 });

    // Filter out removed and left members from all teams
    teams = teams.map(team => {
      const teamObj = team.toObject();
      teamObj.members = teamObj.members.filter(member => member.status === 'active');
      return teamObj;
    });

    // Filter by round if specified
    if (roundId) {
      teams = teams.map(team => {
        const roundScore = team.getScoreForRound ? team.getScoreForRound(roundId) : 0;
        return {
          ...team,
          roundScore
        };
      }).sort((a, b) => b.roundScore - a.roundScore);
    }

    // Assign ranks
    teams = teams.map((team, index) => ({
      ...team,
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      count: teams.length,
      leaderboard: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my teams
// @route   GET /api/teams/my
// @access  Private
exports.getMyTeams = async (req, res) => {
  try {
    // Get all teams where user is leader or member (including removed members for proper separation)
    const allTeams = await Team.find({
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('hackathon', 'title slug status hackathonStartDate hackathonEndDate teamConfig')
      .populate('leader', 'fullName email')
      .populate('members.user', 'fullName email')
      .sort({ createdAt: -1 });

    // Separate active teams from removed teams
    const activeTeams = [];
    const removedTeams = [];

    allTeams.forEach(team => {
      // Check if user is leader
      if (team.leader._id.toString() === req.user._id.toString()) {
        // Filter out removed/left members from leader's view
        const teamObj = team.toObject();
        teamObj.members = teamObj.members.filter(m => m.status === 'active');
        activeTeams.push(teamObj);
      } else {
        // Check member status
        const memberEntry = team.members.find(
          m => m.user._id.toString() === req.user._id.toString()
        );

        if (memberEntry) {
          if (memberEntry.status === 'active') {
            // Filter out removed/left members for this user too
            const teamObj = team.toObject();
            teamObj.members = teamObj.members.filter(m => m.status === 'active');
            activeTeams.push(teamObj);
          } else if (memberEntry.status === 'removed' || memberEntry.status === 'left') {
            removedTeams.push({
              ...team.toObject(),
              userStatus: memberEntry.status
            });
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      count: activeTeams.length,
      teams: activeTeams,
      removedTeams: removedTeams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave team
// @route   POST /api/teams/:teamId/leave
// @access  Private
exports.leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is approved - cannot leave after approval
    if (team.registrationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave team after it has been approved. Please contact the organizer.'
      });
    }

    // Check if user is the leader
    if (team.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave the team. Please transfer leadership first.'
      });
    }

    // Find the member
    const memberIndex = team.members.findIndex(
      m => m.user.toString() === req.user._id.toString() && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Mark member as left
    team.members[memberIndex].status = 'left';

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the team',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:teamId/members/:memberId
// @access  Private (Team Leader)
exports.removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is approved - cannot remove members after approval
    if (team.registrationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove members after team has been approved. Please contact the organizer.'
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }

    // Find the member
    const memberIndex = team.members.findIndex(
      m => m._id.toString() === memberId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }

    // Check if trying to remove leader
    if (team.members[memberIndex].role === 'leader') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader'
      });
    }

    // Mark member as removed
    team.members[memberIndex].status = 'removed';

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending members (users with pending join requests)
// @route   GET /api/teams/:teamId/pending-members
// @access  Private (Team Leader)
exports.getPendingMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can view pending members'
      });
    }

    const pendingRequests = await JoinRequest.find({
      team: teamId,
      status: 'pending'
    })
      .populate('user', 'fullName username email roles institution')
      .populate('sender', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pendingMembers: pendingRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel join request
// @route   DELETE /api/teams/:teamId/join-requests/:requestId
// @access  Private (Team Leader or Request Sender)
exports.cancelJoinRequest = async (req, res) => {
  try {
    const { teamId, requestId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const joinRequest = await JoinRequest.findById(requestId);

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    // Check if user is team leader or the sender
    const isTeamLeader = team.leader.toString() === req.user._id.toString();
    const isSender = joinRequest.sender.toString() === req.user._id.toString();

    if (!isTeamLeader && !isSender) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    joinRequest.status = 'cancelled';
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    res.status(200).json({
      success: true,
      message: 'Join request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Confirm team and submit for approval
// @route   POST /api/teams/:teamId/confirm
// @access  Private (Team Leader)
exports.confirmTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('hackathon', 'title teamConfig registrationEndDate settings')
      .populate('leader', 'fullName email institution')
      .populate('members.user', 'fullName email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leader._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can confirm the team'
      });
    }

    // Check registration deadline
    const now = new Date();
    const registrationEnd = new Date(team.hackathon.registrationEndDate);
    
    if (team.hackathon.settings?.enforceRegistrationDeadline && now > registrationEnd) {
      // Check if late registration is allowed
      if (!team.hackathon.settings?.allowLateRegistration) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline has passed'
        });
      }

      // Check strict enforcement
      if (team.hackathon.settings?.strictDeadlineEnforcement) {
        return res.status(400).json({
          success: false,
          message: 'Registration is closed. No late registrations accepted.'
        });
      }

      // Apply late registration fee if enabled
      if (team.hackathon.settings?.lateRegistrationFee?.enabled) {
        const lateFeeDateEnd = new Date(team.hackathon.settings.lateRegistrationFee.validUntil);
        if (now > lateFeeDateEnd) {
          return res.status(400).json({
            success: false,
            message: 'Late registration period has ended'
          });
        }

        // Add late fee to team
        team.payment.amount += team.hackathon.settings.lateRegistrationFee.amount;
        team.notes.push({
          author: req.user._id,
          content: `Late registration fee of ${team.hackathon.settings.lateRegistrationFee.amount} applied`,
          isPublic: false,
          isOrganizerNote: true,
          createdAt: new Date()
        });
      }
    }

    // Check if team meets requirements
    const activeMembers = team.getActiveMembers();
    const minMembers = team.hackathon.teamConfig.minMembers;
    const maxMembers = team.hackathon.teamConfig.maxMembers;

    if (activeMembers.length < minMembers) {
      return res.status(400).json({
        success: false,
        message: `Team must have at least ${minMembers} member(s). Current: ${activeMembers.length}`
      });
    }

    if (activeMembers.length > maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Team cannot have more than ${maxMembers} member(s). Current: ${activeMembers.length}`
      });
    }

    // Update submission status
    team.submissionStatus = 'submitted';
    team.submittedForApprovalAt = new Date();
    await team.save();

    // Check for auto-approval
    if (team.hackathon.settings?.enableAutoApproval) {
      try {
        const autoApprovalResult = await exports.checkAutoApproval({ params: { teamId: team._id } }, {
          status: (code) => ({ json: (data) => data })
        });

        if (autoApprovalResult.autoApproved) {
          return res.status(200).json({
            success: true,
            message: 'Team automatically approved!',
            team: autoApprovalResult.team,
            autoApproved: true
          });
        }
      } catch (autoApprovalError) {
        console.error('Auto-approval check failed:', autoApprovalError);
        // Continue with manual approval if auto-approval fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Team submitted for approval successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get submitted teams for organizer approval
// @route   GET /api/teams/hackathon/:hackathonId/submitted
// @access  Private (Organizer/Coordinator)
exports.getSubmittedTeams = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check if user is organizer or coordinator
    const isOrganizer = hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(hackathonId);
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submitted teams'
      });
    }

    const teams = await Team.find({
      hackathon: hackathonId,
      submissionStatus: { $in: ['submitted', 'approved', 'rejected'] }
    })
      .populate('leader', 'fullName email username institution')
      .populate('members.user', 'fullName email username')
      .populate('approvedBy', 'fullName')
      .sort({ submittedForApprovalAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Bulk approve teams
// @route   POST /api/teams/hackathon/:hackathonId/bulk-approve
// @access  Private (Organizer/Coordinator)
exports.bulkApproveTeams = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { teamIds } = req.body;

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of team IDs'
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check authorization
    const isOrganizer = hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(hackathonId);
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve teams'
      });
    }

    const results = { approved: [], failed: [] };

    for (const teamId of teamIds) {
      try {
        const team = await Team.findById(teamId)
          .populate('hackathon')
          .populate('leader', 'fullName email')
          .populate('members.user', 'fullName email');

        if (!team || team.hackathon._id.toString() !== hackathonId) {
          results.failed.push({ teamId, reason: 'Team not found or wrong hackathon' });
          continue;
        }

        if (team.submissionStatus !== 'submitted') {
          results.failed.push({ teamId, reason: 'Team not in submitted status' });
          continue;
        }

        team.submissionStatus = 'approved';
        team.registrationStatus = 'approved';
        team.approvedAt = new Date();
        team.approvedBy = req.user._id;
        await team.save();

        // Send approval email
        try {
          await emailService.sendTeamApprovalNotification(team, team.hackathon, req.user);
        } catch (emailError) {
          console.error('Failed to send approval email for team:', teamId, emailError);
        }

        results.approved.push(teamId);
      } catch (error) {
        results.failed.push({ teamId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk approval complete. Approved: ${results.approved.length}, Failed: ${results.failed.length}`,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk reject teams
// @route   POST /api/teams/hackathon/:hackathonId/bulk-reject
// @access  Private (Organizer/Coordinator)
exports.bulkRejectTeams = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { teamIds, reason } = req.body;

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of team IDs'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection'
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check authorization
    const isOrganizer = hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(hackathonId);
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject teams'
      });
    }

    const results = { rejected: [], failed: [] };

    for (const teamId of teamIds) {
      try {
        const team = await Team.findById(teamId)
          .populate('hackathon')
          .populate('leader', 'fullName email')
          .populate('members.user', 'fullName email');

        if (!team || team.hackathon._id.toString() !== hackathonId) {
          results.failed.push({ teamId, reason: 'Team not found or wrong hackathon' });
          continue;
        }

        if (team.submissionStatus !== 'submitted') {
          results.failed.push({ teamId, reason: 'Team not in submitted status' });
          continue;
        }

        team.submissionStatus = 'draft';
        team.registrationStatus = 'pending';
        team.rejectionReason = reason;
        team.approvedBy = req.user._id;
        await team.save();

        // Send rejection email
        try {
          await emailService.sendTeamRejectionNotification(team, team.hackathon, req.user, reason);
        } catch (emailError) {
          console.error('Failed to send rejection email for team:', teamId, emailError);
        }

        results.rejected.push(teamId);
      } catch (error) {
        results.failed.push({ teamId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk rejection complete. Rejected: ${results.rejected.length}, Failed: ${results.failed.length}`,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export teams to CSV
// @route   GET /api/teams/hackathon/:hackathonId/export
// @access  Private (Organizer/Coordinator)
exports.exportTeamsToCSV = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { status } = req.query;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check authorization
    const isOrganizer = hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(hackathonId);
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export teams'
      });
    }

    const query = { hackathon: hackathonId };
    if (status) {
      query.submissionStatus = status;
    }

    const teams = await Team.find(query)
      .populate('leader', 'fullName email username institution')
      .populate('members.user', 'fullName email username')
      .sort({ createdAt: -1 });

    // Generate CSV
    const csvRows = [];
    
    // Header
    csvRows.push([
      'Team Name',
      'Submission Status',
      'Registration Status',
      'Leader Name',
      'Leader Email',
      'Leader Institution',
      'Total Members',
      'Active Members',
      'Project Title',
      'Submitted At',
      'Approved/Rejected At',
      'Rejection Reason'
    ].join(','));

    // Data rows
    teams.forEach(team => {
      const activeMembers = team.members.filter(m => m.status === 'active').length;
      
      csvRows.push([
        `"${team.teamName}"`,
        team.submissionStatus || '',
        team.registrationStatus || '',
        `"${team.leader?.fullName || ''}"`,
        team.leader?.email || '',
        `"${team.leader?.institution || ''}"`,
        team.members.length,
        activeMembers,
        `"${team.projectTitle || ''}"`,
        team.submittedForApprovalAt ? new Date(team.submittedForApprovalAt).toISOString() : '',
        team.approvedAt ? new Date(team.approvedAt).toISOString() : '',
        `"${team.rejectionReason || ''}"`
      ].join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="teams-${hackathon.slug}-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add note to team
// @route   POST /api/teams/:teamId/notes
// @access  Private (Organizer/Coordinator)
exports.addNoteToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { content, isPublic, notifyTeam } = req.body;

    const team = await Team.findById(teamId)
      .populate('hackathon')
      .populate('leader', 'fullName email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check authorization
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(team.hackathon._id);
    
    if (!isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes'
      });
    }

    const note = {
      author: req.user._id,
      content,
      isPublic: isPublic || false,
      isOrganizerNote: true,
      createdAt: new Date()
    };

    team.notes.push(note);
    await team.save();

    // Populate the note author
    await team.populate('notes.author', 'fullName email');

    // Send email notification if requested
    if (notifyTeam) {
      try {
        await emailService.sendTeamNoteNotification(team, team.hackathon, note, req.user);
        note.notifiedAt = new Date();
        await team.save();
      } catch (emailError) {
        console.error('Failed to send note notification:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note: team.notes[team.notes.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get team notes
// @route   GET /api/teams/:teamId/notes
// @access  Private
exports.getTeamNotes = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('notes.author', 'fullName email')
      .populate('hackathon');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team member or organizer/coordinator
    const isTeamMember = team.isMember(req.user._id) || team.isLeader(req.user._id);
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isCoordinator = req.user.isCoordinatorFor(team.hackathon._id);

    if (!isTeamMember && !isOrganizer && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view notes'
      });
    }

    // Filter notes based on visibility
    let notes = team.notes;
    if (isTeamMember && !isOrganizer && !isCoordinator) {
      // Team members can only see public notes
      notes = notes.filter(note => note.isPublic);
    }

    res.status(200).json({
      success: true,
      notes: notes.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check and apply auto-approval for a team
// @route   POST /api/teams/:teamId/check-auto-approval
// @access  Private (System/Team Leader)
exports.checkAutoApproval = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('hackathon')
      .populate('leader', 'fullName email institution')
      .populate('members.user', 'fullName email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if auto-approval is enabled
    if (!team.hackathon.settings?.enableAutoApproval) {
      return res.status(400).json({
        success: false,
        message: 'Auto-approval is not enabled for this hackathon'
      });
    }

    // Check if team meets auto-approval criteria
    const criteria = team.hackathon.settings.autoApprovalCriteria || {};
    const activeMembers = team.getActiveMembers();
    let eligible = true;
    let reason = '';

    // Check team size
    if (criteria.minTeamSize && activeMembers.length < criteria.minTeamSize) {
      eligible = false;
      reason = `Team size below minimum (${criteria.minTeamSize})`;
    }

    if (criteria.maxTeamSize && activeMembers.length > criteria.maxTeamSize) {
      eligible = false;
      reason = `Team size exceeds maximum (${criteria.maxTeamSize})`;
    }

    // Check required institutions
    if (eligible && criteria.requiredInstitutions && criteria.requiredInstitutions.length > 0) {
      const hasRequiredInstitution = criteria.requiredInstitutions.includes(team.leader.institution);
      if (!hasRequiredInstitution) {
        eligible = false;
        reason = 'Leader institution not in approved list';
      }
    }

    // Check required email domains
    if (eligible && criteria.requiredEmailDomains && criteria.requiredEmailDomains.length > 0) {
      const leaderDomain = team.leader.email.split('@')[1];
      const hasRequiredDomain = criteria.requiredEmailDomains.includes(leaderDomain);
      if (!hasRequiredDomain) {
        eligible = false;
        reason = 'Leader email domain not in approved list';
      }
    }

    // Check payment requirement
    if (eligible && criteria.autoApproveAfterPayment) {
      if (team.payment.status !== 'completed') {
        eligible = false;
        reason = 'Payment not completed';
      }
    }

    team.autoApprovalChecked = true;
    team.autoApprovalEligible = eligible;
    team.autoApprovalReason = reason || 'Meets all criteria';

    // Auto-approve if eligible
    if (eligible && team.submissionStatus === 'submitted') {
      team.submissionStatus = 'approved';
      team.registrationStatus = 'approved';
      team.approvedAt = new Date();
      team.approvedBy = team.hackathon.organizer; // System approval
      await team.save();

      // Send approval email
      try {
        await emailService.sendTeamApprovalNotification(team, team.hackathon, { fullName: 'System Auto-Approval' });
      } catch (emailError) {
        console.error('Failed to send auto-approval email:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Team auto-approved successfully',
        team,
        autoApproved: true
      });
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: eligible ? 'Team is eligible for auto-approval' : 'Team does not meet auto-approval criteria',
      team,
      autoApprovalEligible: eligible,
      autoApprovalReason: team.autoApprovalReason
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add member to team (Organizer)
// @route   POST /api/teams/:teamId/organizer/add-member
// @access  Private (Organizer)
exports.organizerAddMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const team = await Team.findById(teamId).populate('hackathon');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is organizer
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.hasAnyRole(['admin', 'super_admin']);

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only hackathon organizers can add members to teams'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a coordinator for this hackathon
    if (user.isCoordinatorFor(team.hackathon._id)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinators cannot participate in the hackathon'
      });
    }

    // Check if user is already in another team for this hackathon
    const existingTeam = await Team.findOne({
      hackathon: team.hackathon._id,
      'members.user': userId,
      'members.status': 'active'
    });

    if (existingTeam && existingTeam._id.toString() !== teamId) {
      return res.status(400).json({
        success: false,
        message: 'User is already in another team for this hackathon'
      });
    }

    // Check if team is full
    const activeMembers = team.members.filter(m => m.status === 'active');
    if (activeMembers.length >= team.hackathon.teamConfig.maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Team is full (maximum ${team.hackathon.teamConfig.maxMembers} members)`
      });
    }

    // Check if user already exists in this team (might be removed/left)
    const existingMemberIndex = team.members.findIndex(
      m => m.user.toString() === userId
    );

    if (existingMemberIndex !== -1) {
      // Reactivate if they were removed/left
      team.members[existingMemberIndex].status = 'active';
      team.members[existingMemberIndex].role = 'member';
      team.members[existingMemberIndex].joinedAt = new Date();
    } else {
      // Add as new member
      team.members.push({
        user: userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      });
    }

    await team.save();

    // Populate the team for response
    await team.populate('members.user', 'fullName email username');
    await team.populate('leader', 'fullName email username');

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      team
    });
  } catch (error) {
    console.error('organizerAddMember error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove member from team (Organizer)
// @route   DELETE /api/teams/:teamId/organizer/remove-member/:memberId
// @access  Private (Organizer)
exports.organizerRemoveMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    const team = await Team.findById(teamId).populate('hackathon');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is organizer
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.hasAnyRole(['admin', 'super_admin']);

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only hackathon organizers can remove members from teams'
      });
    }

    // Find the member
    const memberIndex = team.members.findIndex(
      m => m._id.toString() === memberId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Active member not found in team'
      });
    }

    // Check if trying to remove the team leader
    if (team.members[memberIndex].role === 'leader') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader. Please delete the entire team instead.'
      });
    }

    // Mark member as removed
    team.members[memberIndex].status = 'removed';
    await team.save();

    // Populate the team for response
    await team.populate('members.user', 'fullName email username');
    await team.populate('leader', 'fullName email username');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      team
    });
  } catch (error) {
    console.error('organizerRemoveMember error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete team (Organizer)
// @route   DELETE /api/teams/:teamId/organizer/delete
// @access  Private (Organizer)
exports.organizerDeleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate('hackathon');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is organizer
    const isOrganizer = team.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.hasAnyRole(['admin', 'super_admin']);

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only hackathon organizers can delete teams'
      });
    }

    // Delete all join requests for this team
    await JoinRequest.deleteMany({ team: teamId });

    // Delete the team
    await Team.findByIdAndDelete(teamId);

    // Update hackathon registration count
    const hackathon = await Hackathon.findById(team.hackathon._id);
    if (hackathon && hackathon.currentRegistrations > 0) {
      hackathon.currentRegistrations -= 1;
      await hackathon.save();
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('organizerDeleteTeam error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;