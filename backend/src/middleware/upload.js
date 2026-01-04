const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../../uploads/submissions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Get allowed types from round config if available
  const allowedTypes = req.roundConfig?.submissionConfig?.allowedFileTypes || [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'video/mp4',
    'video/mpeg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB default, can be overridden
  }
});

// Middleware to set file limits based on round config
const configureUploadLimits = async (req, res, next) => {
  try {
    if (req.body.roundId) {
      const Hackathon = require('../models/Hackathon');
      const Team = require('../models/Team');

      // Get team to find hackathon
      const team = await Team.findById(req.params.id);
      if (team) {
        const hackathon = await Hackathon.findById(team.hackathon);
        if (hackathon) {
          const round = hackathon.rounds.id(req.body.roundId);
          if (round && round.submissionConfig) {
            req.roundConfig = round;
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('Error configuring upload limits:', error);
    next(); // Continue even if config fails
  }
};

module.exports = {
  upload,
  configureUploadLimits
};
