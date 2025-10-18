const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/videos', 'uploads/documents', 'uploads/assignments', 'uploads/thumbnails'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (file.fieldname === 'profilePicture') {
      folder += 'profiles/';
    } else if (file.fieldname === 'video') {
      folder += 'videos/';
    } else if (file.fieldname === 'document') {
      folder += 'documents/';
    } else if (file.fieldname === 'assignment') {
      folder += 'assignments/';
    } else if (file.fieldname === 'thumbnail') {
      folder += 'thumbnails/';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Define allowed file types by category
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
  const documentTypes = /pdf|doc|docx|txt/;
  
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  const mimeType = file.mimetype.toLowerCase();
  
  let isValid = false;
  
  if (file.fieldname === 'video') {
    // For video uploads, be more permissive
    isValid = videoTypes.test(fileExtension) || 
              mimeType.startsWith('video/') ||
              mimeType === 'application/octet-stream'; // Some browsers send this for video files
  } else if (file.fieldname === 'thumbnail' || file.fieldname === 'profilePicture') {
    isValid = imageTypes.test(fileExtension) || mimeType.startsWith('image/');
  } else if (file.fieldname === 'document' || file.fieldname === 'assignment') {
    isValid = documentTypes.test(fileExtension) || 
              mimeType.startsWith('application/') || 
              mimeType.startsWith('text/');
  } else {
    // General file upload
    isValid = imageTypes.test(fileExtension) || 
              videoTypes.test(fileExtension) || 
              documentTypes.test(fileExtension) ||
              mimeType.startsWith('image/') ||
              mimeType.startsWith('video/') ||
              mimeType.startsWith('application/') ||
              mimeType.startsWith('text/');
  }

  console.log('File validation result:', { 
    fileExtension, 
    mimeType, 
    fieldname: file.fieldname,
    isValid 
  });

  if (isValid) {
    return cb(null, true);
  } else {
    const error = new Error(`Invalid file type for ${file.fieldname}. Allowed: images, videos, documents.`);
    console.error('File filter error:', error.message);
    cb(error);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter
});

module.exports = upload;
