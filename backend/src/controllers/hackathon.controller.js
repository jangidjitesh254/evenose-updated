const Hackathon = require('../models/Hackathon');
const User = require('../models/User');
const Team = require('../models/Team');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// @desc    Create hackathon
// @route   POST /api/hackathons
// @access  Private (Admin, Organizer with subscription)
exports.createHackathon = async (req, res) => {
  try {
    const bypassCheck = process.env.BYPASS_SUBSCRIPTION_CHECK === 'true' || process.env.NODE_ENV === 'development';
    
    // Check if user can create hackathons
    if (!req.user.hasAnyRole(['admin', 'super_admin']) && !bypassCheck) {
      // Only check subscription if not in bypass mode
      if (!req.user.subscription || 
          !req.user.subscription.features.canCreateHackathons || 
          req.user.subscription.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Active subscription with hackathon creation permission required',
          hint: 'Set BYPASS_SUBSCRIPTION_CHECK=true in .env to bypass this check in development'
        });
      }
    }

    // Set organizer
    req.body.organizer = req.user._id;
    req.body.organizerDetails = {
      name: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      organization: req.user.institution
    };

    const hackathon = await Hackathon.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Hackathon created successfully',
      hackathon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
exports.getHackathons = async (req, res) => {
  try {
    const { status, mode, search, page = 1, limit = 10, featured } = req.query;

    const query = { isPublic: true };

    if (status) query.status = status;
    if (mode) query.mode = mode;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const hackathons = await Hackathon.find(query)
      .populate('organizer', 'fullName institution')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Hackathon.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      hackathons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single hackathon
// @route   GET /api/hackathons/:id
// @access  Public
exports.getHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('organizer', 'fullName email institution profile')
      .populate('coordinators.user', 'fullName email')
      .populate('judges.user', 'fullName email');

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Increment views
    hackathon.views += 1;
    await hackathon.save();

    res.status(200).json({
      success: true,
      hackathon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Private (Organizer, Admin)
exports.updateHackathon = async (req, res) => {
  try {
    let hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check authorization
    if (hackathon.organizer.toString() !== req.user._id.toString() && 
        !req.user.hasAnyRole(['admin', 'super_admin'])) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hackathon'
      });
    }

    hackathon = await Hackathon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hackathon updated successfully',
      hackathon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private (Organizer, Admin)
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check authorization
    if (hackathon.organizer.toString() !== req.user._id.toString() && 
        !req.user.hasAnyRole(['admin', 'super_admin'])) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this hackathon'
      });
    }

    await hackathon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Hackathon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my hackathons (as organizer)
// @route   GET /api/hackathons/my/organized
// @access  Private
exports.getMyHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({ organizer: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hackathons.length,
      hackathons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my coordinations
// @route   GET /api/hackathons/my/coordinations
// @access  Private
exports.getMyCoordinations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'coordinatorFor.hackathon',
        select: 'title slug status hackathonStartDate hackathonEndDate mode venue'
      });

    const coordinations = user.coordinatorFor.map(coord => ({
      _id: coord._id,
      hackathon: coord.hackathon,
      permissions: coord.permissions,
      status: coord.status,
      invitedAt: coord.invitedAt,
      acceptedAt: coord.acceptedAt
    }));

    res.status(200).json({
      success: true,
      count: coordinations.length,
      coordinations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Invite coordinator
// @route   POST /api/hackathons/:id/coordinators/invite
// @access  Private (Organizer, Admin)
exports.inviteCoordinator = async (req, res) => {
  try {
    console.log('=== inviteCoordinator Debug ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Hackathon from middleware:', req.hackathon ? 'exists' : 'not set');
    
    const { emailOrUsername, permissions } = req.body;
    // Use hackathon from middleware if available, otherwise fetch
    const hackathon = req.hackathon || await Hackathon.findById(req.params.id);

    if (!hackathon) {
      console.log('❌ Hackathon not found');
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    console.log('✅ Hackathon found:', hackathon.title);

    // Find user
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      console.log('❌ User not found:', emailOrUsername);
      return res.status(404).json({
        success: false,
        message: 'User not found. Please make sure the user has an account.'
      });
    }

    console.log('✅ User found:', user.email);

    // Check if user is already a participant in this hackathon (as leader or active member)
    const Team = require('../models/Team');
    const isParticipant = await Team.findOne({
      hackathon: hackathon._id,
      $or: [
        { leader: user._id },
        {
          members: {
            $elemMatch: {
              user: user._id,
              status: 'active'
            }
          }
        }
      ]
    });

    if (isParticipant) {
      console.log('❌ User is participant in this hackathon');
      return res.status(400).json({
        success: false,
        message: 'This user is already a participant in this hackathon and cannot be a coordinator'
      });
    }

    // Check if already a coordinator (pending or accepted)
    const existingCoord = user.coordinatorFor.find(
      c => c.hackathon.toString() === hackathon._id.toString()
    );

    if (existingCoord) {
      console.log('❌ User already has coordinator entry');
      
      if (existingCoord.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'User is already an active coordinator for this hackathon',
          alreadyInvited: true,
          status: 'accepted'
        });
      } else if (existingCoord.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'An invitation has already been sent to this user. Use the "Resend" button to send the email again.',
          alreadyInvited: true,
          status: 'pending'
        });
      }
    }

    // Add to user's coordinatorFor
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    user.coordinatorFor.push({
      hackathon: hackathon._id,
      permissions: permissions || {
        canViewTeams: true,
        canCheckIn: true,
        canAssignTables: false,
        canViewSubmissions: true,
        canEliminateTeams: false,
        canCommunicate: true,
      },
      invitedBy: req.user._id,
      invitedAt: new Date(),
      status: 'pending',
      invitationToken: token
    });
    await user.save();

    console.log('✅ Coordinator added to user');

    // Send invitation email
    try {
      await emailService.sendCoordinatorInvitation(user, hackathon, req.user, token);
      console.log('✅ Invitation email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send invitation email:', emailError);
      // Don't fail the invitation if email fails
    }

    console.log('✅ Invitation sent successfully');

    res.status(200).json({
      success: true,
      message: 'Coordinator invitation sent successfully',
      invitedUser: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('❌ inviteCoordinator error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept coordinator invitation
// @route   POST /api/hackathons/coordinators/accept/:token
// @access  Private
exports.acceptCoordinatorInvitation = async (req, res) => {
  try {
    console.log('=== Accept Coordinator Invitation Debug ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    // Support both old (hackathonId in body) and new (invitationId in params) formats
    const invitationId = req.params.invitationId;
    const hackathonId = req.body.hackathonId;

    console.log('Invitation ID:', invitationId);
    console.log('Hackathon ID:', hackathonId);

    const user = await User.findById(req.user._id);
    console.log('User coordinatorFor count:', user.coordinatorFor.length);

    let coordination;

    if (invitationId) {
      // New format: find by invitation ID
      console.log('Trying to find coordination by invitation ID...');
      console.log('All coordination IDs:', user.coordinatorFor.map(c => c._id.toString()));

      coordination = user.coordinatorFor.id(invitationId);
      console.log('Found coordination by ID?', !!coordination);
    } else if (hackathonId) {
      // Legacy format: find by hackathon ID
      console.log('Trying to find coordination by hackathon ID...');
      coordination = user.coordinatorFor.find(
        c => c.hackathon.toString() === hackathonId && c.status === 'pending'
      );
      console.log('Found coordination by hackathon?', !!coordination);
    }

    if (!coordination) {
      console.log('❌ Invitation not found');
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    console.log('Coordination status:', coordination.status);

    if (coordination.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been responded to'
      });
    }

    const coordinationHackathonId = coordination.hackathon.toString();
    console.log('Coordination hackathon ID:', coordinationHackathonId);

    // Check if user is already a participant in this hackathon
    const Team = require('../models/Team');
    const isParticipant = await Team.findOne({
      hackathon: coordinationHackathonId,
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
    });

    if (isParticipant) {
      console.log('❌ User is already a participant');
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this hackathon. Please leave your team first to accept this coordinator invitation.',
        isParticipant: true,
        teamName: isParticipant.teamName
      });
    }

    coordination.status = 'accepted';
    coordination.acceptedAt = new Date();

    // Add coordinator role if not present
    if (!user.roles.includes('coordinator')) {
      user.roles.push('coordinator');
    }

    await user.save();
    console.log('✅ User saved with accepted coordination');

    // Add to hackathon's coordinators list
    const hackathon = await Hackathon.findById(coordinationHackathonId);
    hackathon.coordinators.push({
      user: user._id,
      permissions: coordination.permissions,
      addedAt: new Date()
    });
    await hackathon.save();
    console.log('✅ Hackathon updated with new coordinator');

    res.status(200).json({
      success: true,
      message: 'Coordinator invitation accepted'
    });
  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Decline coordinator invitation
// @route   POST /api/hackathons/coordinators/invitations/:invitationId/decline
// @access  Private
exports.declineCoordinatorInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const user = await User.findById(req.user._id);
    const coordination = user.coordinatorFor.id(invitationId);

    if (!coordination) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (coordination.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been responded to'
      });
    }

    coordination.status = 'declined';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Coordinator invitation declined'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update coordinator permissions
// @route   PUT /api/hackathons/:id/coordinators/:userId/permissions
// @access  Private (Organizer, Admin)
exports.updateCoordinatorPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const coordinator = hackathon.coordinators.find(
      c => c.user.toString() === req.params.userId
    );

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    coordinator.permissions = { ...coordinator.permissions, ...permissions };
    await hackathon.save();

    // Update in user model
    const user = await User.findById(req.params.userId);
    const userCoord = user.coordinatorFor.find(
      c => c.hackathon.toString() === hackathon._id.toString()
    );
    if (userCoord) {
      userCoord.permissions = coordinator.permissions;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Coordinator permissions updated successfully',
      permissions: coordinator.permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get coordinators for a hackathon
// @route   GET /api/hackathons/:id/coordinators
// @access  Private (Organizer, Admin, Coordinator)
exports.getCoordinators = async (req, res) => {
  try {
    console.log('=== getCoordinators Debug ===');
    console.log('Hackathon ID:', req.params.id);
    console.log('User ID:', req.user._id);

    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      console.log('❌ Hackathon not found');
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    console.log('✅ Hackathon found:', hackathon.title);

    // Get all users who are coordinators for this hackathon
    const User = require('../models/User');
    const allUsers = await User.find({
      'coordinatorFor.hackathon': hackathon._id
    });

    console.log('Found users with coordinator entries:', allUsers.length);

    const allCoordinators = [];

    allUsers.forEach(user => {
      const coordEntry = user.coordinatorFor.find(
        c => c.hackathon.toString() === hackathon._id.toString()
      );

      if (coordEntry) {
        allCoordinators.push({
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture,
          },
          permissions: coordEntry.permissions,
          invitedAt: coordEntry.invitedAt,
          invitedBy: coordEntry.invitedBy,
          status: coordEntry.status,
          acceptedAt: coordEntry.acceptedAt
        });
      }
    });

    console.log('✅ Total coordinators (all statuses):', allCoordinators.length);

    res.status(200).json({
      success: true,
      coordinators: allCoordinators
    });
  } catch (error) {
    console.error('❌ getCoordinators error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove coordinator from hackathon
// @route   DELETE /api/hackathons/:id/coordinators/:userId
// @access  Private (Organizer, Admin)
exports.removeCoordinator = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.coordinatorFor = user.coordinatorFor.filter(
      c => c.hackathon.toString() !== req.params.id
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Coordinator removed successfully'
    });
  } catch (error) {
    console.error('removeCoordinator error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel coordinator invitation
// @route   DELETE /api/hackathons/:id/coordinators/:userId/cancel
// @access  Private (Organizer, Admin)
exports.cancelCoordinatorInvite = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.coordinatorFor = user.coordinatorFor.filter(
      c => c.hackathon.toString() !== req.params.id || c.status === 'accepted'
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('cancelCoordinatorInvite error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resend coordinator invitation
// @route   POST /api/hackathons/:id/coordinators/:userId/resend
// @access  Private (Organizer, Admin)
exports.resendCoordinatorInvite = async (req, res) => {
  try {
    console.log('=== resendCoordinatorInvite ===');
    const User = require('../models/User');
    const hackathon = await Hackathon.findById(req.params.id);
    const user = await User.findById(req.params.userId);
    
    if (!hackathon || !user) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon or user not found'
      });
    }

    const coordEntry = user.coordinatorFor.find(
      c => c.hackathon.toString() === hackathon._id.toString()
    );

    if (!coordEntry || coordEntry.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'No pending invitation found for this user'
      });
    }

    // Generate new token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    coordEntry.invitationToken = token;
    coordEntry.invitedAt = new Date(); // Update invitation date
    await user.save();

    console.log('✅ Resending invitation to:', user.email);

    // Resend email
    try {
      await emailService.sendCoordinatorInvitation(user, hackathon, req.user, token);
      console.log('✅ Invitation email resent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to resend email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation email sent successfully to ' + user.email
    });
  } catch (error) {
    console.error('❌ resendCoordinatorInvite error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Invite judge
// @route   POST /api/hackathons/:id/judges/invite
// @access  Private (Organizer, Admin)
exports.inviteJudge = async (req, res) => {
  try {
    const { emailOrUsername, assignedRounds } = req.body;
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a judge
    const existingJudge = user.judgeFor.find(
      j => j.hackathon.toString() === hackathon._id.toString()
    );

    if (existingJudge) {
      return res.status(400).json({
        success: false,
        message: 'User is already a judge for this hackathon'
      });
    }

    // Add to user's judgeFor
    const token = crypto.randomBytes(32).toString('hex');
    user.judgeFor.push({
      hackathon: hackathon._id,
      invitedBy: req.user._id,
      invitedAt: new Date(),
      status: 'pending'
    });
    await user.save();

    // Send invitation email
    await emailService.sendJudgeInvitation(user, hackathon, req.user, token);

    res.status(200).json({
      success: true,
      message: 'Judge invitation sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept judge invitation
// @route   POST /api/hackathons/judges/accept/:token
// @access  Private
exports.acceptJudgeInvitation = async (req, res) => {
  try {
    const { hackathonId } = req.body;

    const user = await User.findById(req.user._id);
    const judgeEntry = user.judgeFor.find(
      j => j.hackathon.toString() === hackathonId && j.status === 'pending'
    );

    if (!judgeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    judgeEntry.status = 'accepted';
    judgeEntry.acceptedAt = new Date();
    
    // Add judge role if not present
    if (!user.roles.includes('judge')) {
      user.roles.push('judge');
    }

    await user.save();

    // Add to hackathon's judges list
    const hackathon = await Hackathon.findById(hackathonId);
    hackathon.judges.push({
      user: user._id,
      name: user.fullName,
      bio: user.profile?.bio,
      photo: user.profile?.avatar,
      expertise: user.profile?.skills
    });
    await hackathon.save();

    res.status(200).json({
      success: true,
      message: 'Judge invitation accepted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;

// @desc    Search users for coordinator invitation with participant status
// @route   GET /api/hackathons/:id/search-coordinators
// @access  Private (Organizer)
exports.searchCoordinatorsWithStatus = async (req, res) => {
  try {
    const { query } = req.query;
    const hackathonId = req.params.id;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const Team = require('../models/Team');
    
    // Search users by username or email
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id username email fullName')
    .limit(10);

    // Check each user's status for this hackathon
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        // Check if participant
        const team = await Team.findOne({
          hackathon: hackathonId,
          members: user._id
        }).select('teamName');

        // Check if already coordinator
        const userDoc = await User.findById(user._id);
        const coordEntry = userDoc.coordinatorFor?.find(
          c => c.hackathon.toString() === hackathonId.toString()
        );

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isParticipant: !!team,
          teamName: team?.teamName,
          isCoordinator: coordEntry?.status === 'accepted',
          isPendingCoordinator: coordEntry?.status === 'pending'
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithStatus
    });
  } catch (error) {
    console.error('searchCoordinatorsWithStatus error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update round status
// @route   PUT /api/hackathons/:id/rounds/:roundId/status
// @access  Private (Organizer, Admin)
exports.updateRoundStatus = async (req, res) => {
  try {
    const { status, actualStartTime, actualEndTime } = req.body;
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const round = hackathon.rounds.id(req.params.roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    if (status) round.status = status;
    if (actualStartTime) round.actualStartTime = actualStartTime;
    if (actualEndTime) round.actualEndTime = actualEndTime;

    // If marking as ongoing, set currentRound flag and unset others
    if (status === 'ongoing') {
      hackathon.rounds.forEach(r => {
        r.currentRound = r._id.toString() === req.params.roundId;
      });
    } else if (status === 'completed' || status === 'cancelled') {
      round.currentRound = false;
    }

    await hackathon.save();

    res.status(200).json({
      success: true,
      message: 'Round status updated successfully',
      round
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current round for hackathon
// @route   GET /api/hackathons/:id/rounds/current
// @access  Public
exports.getCurrentRound = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const currentRound = hackathon.rounds.find(r => r.currentRound === true);

    res.status(200).json({
      success: true,
      currentRound: currentRound || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get hackathon statistics for organizer dashboard
// @route   GET /api/hackathons/:id/stats
// @access  Private (Organizer, Coordinator, Admin)
exports.getHackathonStats = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const Team = require('../models/Team');

    // Get all teams for this hackathon
    const teams = await Team.find({ hackathon: req.params.id });

    // Calculate statistics
    const totalTeams = teams.length;
    const pendingApproval = teams.filter(t => t.registrationStatus === 'pending').length;
    const approvedTeams = teams.filter(t => t.registrationStatus === 'approved').length;
    const rejectedTeams = teams.filter(t => t.registrationStatus === 'rejected').length;
    const checkedInTeams = teams.filter(t => t.checkIn?.isCheckedIn === true).length;
    const eliminatedTeams = teams.filter(t => t.isEliminated === true).length;

    // Calculate total participants
    const totalParticipants = teams.reduce((sum, team) => {
      return sum + team.getActiveMembers().length;
    }, 0);

    // Calculate revenue if paid event
    const totalRevenue = teams
      .filter(t => t.payment?.status === 'completed')
      .reduce((sum, team) => sum + (team.payment?.amount || 0), 0);

    // Get current round
    const currentRound = hackathon.rounds.find(r => r.currentRound === true);

    // Round statistics
    const roundStats = hackathon.rounds.map(round => {
      const submissions = teams.filter(t =>
        t.submissions.some(s => s.round.toString() === round._id.toString())
      ).length;

      return {
        roundId: round._id,
        name: round.name,
        status: round.status,
        submissions,
        totalTeams: approvedTeams
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalTeams,
          totalParticipants,
          pendingApproval,
          approvedTeams,
          rejectedTeams,
          checkedInTeams,
          eliminatedTeams,
          activeTeams: approvedTeams - eliminatedTeams,
          totalRevenue
        },
        registration: {
          maxTeams: hackathon.maxTeams,
          currentRegistrations: hackathon.currentRegistrations,
          percentFilled: hackathon.maxTeams > 0 ? (hackathon.currentRegistrations / hackathon.maxTeams * 100).toFixed(1) : 0
        },
        currentRound: currentRound || null,
        rounds: roundStats,
        hackathonStatus: hackathon.status
      }
    });
  } catch (error) {
    console.error('getHackathonStats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all participants for a hackathon
// @route   GET /api/hackathons/:id/participants
// @access  Private (Organizer, Coordinator, Admin)
exports.getParticipants = async (req, res) => {
  try {
    const Team = require('../models/Team');

    const teams = await Team.find({ hackathon: req.params.id })
      .populate('members.user', 'fullName email username profilePicture institution')
      .populate('leader', 'fullName email username profilePicture institution');

    const participants = [];

    teams.forEach(team => {
      team.members.forEach(member => {
        if (member.user && member.status === 'active') {
          participants.push({
            _id: member.user._id,
            fullName: member.user.fullName,
            email: member.user.email,
            username: member.user.username,
            profilePicture: member.user.profilePicture,
            institution: member.user.institution,
            teamId: team._id,
            teamName: team.teamName,
            role: member.role,
            isLeader: member.user._id.toString() === team.leader._id.toString(),
            teamStatus: team.registrationStatus,
            checkedIn: member.checkIn?.isCheckedIn || false,
            checkInTime: member.checkIn?.checkInTime
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: participants.length,
      participants
    });
  } catch (error) {
    console.error('getParticipants error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all rounds for a hackathon
// @route   GET /api/hackathons/:id/rounds
// @access  Public
exports.getRounds = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    res.status(200).json({
      success: true,
      rounds: hackathon.rounds.sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new round for a hackathon
// @route   POST /api/hackathons/:id/rounds
// @access  Private (Organizer)
exports.createRound = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Validate required fields
    const { name, type, mode, startTime, endTime } = req.body;
    if (!name || !type || !mode || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, type, mode, startTime, endTime'
      });
    }

    // Set order to next sequential number
    const maxOrder = hackathon.rounds.length > 0
      ? Math.max(...hackathon.rounds.map(r => r.order || 0))
      : 0;

    const newRound = {
      ...req.body,
      order: maxOrder + 1
    };

    hackathon.rounds.push(newRound);
    await hackathon.save();

    const createdRound = hackathon.rounds[hackathon.rounds.length - 1];

    res.status(201).json({
      success: true,
      message: 'Round created successfully',
      round: createdRound
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a round
// @route   PUT /api/hackathons/:id/rounds/:roundId
// @access  Private (Organizer)
exports.updateRound = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const round = hackathon.rounds.id(req.params.roundId);

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Update round fields (excluding status which has its own endpoint)
    const allowedFields = [
      'name', 'type', 'mode', 'description', 'startTime', 'endTime',
      'maxScore', 'judgingCriteria', 'eliminationCount', 'isEliminationRound',
      'location', 'meetingLink', 'instructions', 'submissionConfig'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        round[field] = req.body[field];
      }
    });

    await hackathon.save();

    res.status(200).json({
      success: true,
      message: 'Round updated successfully',
      round
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a round
// @route   DELETE /api/hackathons/:id/rounds/:roundId
// @access  Private (Organizer)
exports.deleteRound = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const round = hackathon.rounds.id(req.params.roundId);

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Check if round is currently active
    if (round.currentRound) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current active round. Please change round status first.'
      });
    }

    // Check if round has submissions
    const Team = require('../models/Team');
    const teamsWithSubmissions = await Team.countDocuments({
      hackathon: req.params.id,
      'submissions.round': req.params.roundId
    });

    if (teamsWithSubmissions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete round with existing submissions (${teamsWithSubmissions} teams have submitted)`,
        submissionCount: teamsWithSubmissions
      });
    }

    // Remove the round
    round.remove();
    await hackathon.save();

    res.status(200).json({
      success: true,
      message: 'Round deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reorder rounds
// @route   PUT /api/hackathons/:id/rounds/reorder
// @access  Private (Organizer)
exports.reorderRounds = async (req, res) => {
  try {
    const { roundIds } = req.body;

    if (!Array.isArray(roundIds)) {
      return res.status(400).json({
        success: false,
        message: 'roundIds must be an array'
      });
    }

    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Update order field for each round
    roundIds.forEach((roundId, index) => {
      const round = hackathon.rounds.id(roundId);
      if (round) {
        round.order = index + 1;
      }
    });

    await hackathon.save();

    res.status(200).json({
      success: true,
      message: 'Rounds reordered successfully',
      rounds: hackathon.rounds.sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};