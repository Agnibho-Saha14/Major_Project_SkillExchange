const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/certificates/',
  'uploads/videos/',
  'uploads/documents/',
  'uploads/profiles/'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    switch (file.fieldname) {
      case 'certificate':
        uploadPath += 'certificates/';
        break;
      case 'introVideo':
        uploadPath += 'videos/';
        break;
      case 'document':
        uploadPath += 'documents/';
        break;
      case 'profileImage':
        uploadPath += 'profiles/';
        break;
      default:
        uploadPath += 'certificates/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedFilename));
  }
});

// Enhanced file filter with detailed validation
const fileFilter = (req, file, cb) => {
  const fileTypes = {
    certificate: {
      mimetypes: ['image/jpeg', 'image/jpg', 'image/png'],
      extensions: /jpeg|jpg|png/,
      maxSize: 5 * 1024 * 1024, // 5MB
      errorMsg: 'Only images (JPEG, JPG, PNG) files are allowed for certificates'
    },
    introVideo: {
      mimetypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
      extensions: /mp4|mpeg|mov|avi|webm/,
      maxSize: 100 * 1024 * 1024, // 100MB
      errorMsg: 'Only video files (MP4, MPEG, MOV, AVI, WEBM) are allowed'
    },
    document: {
      mimetypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: /pdf|doc|docx/,
      maxSize: 10 * 1024 * 1024, // 10MB
      errorMsg: 'Only PDF, DOC, and DOCX files are allowed for documents'
    },
    profileImage: {
      mimetypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      extensions: /jpeg|jpg|png|webp/,
      maxSize: 2 * 1024 * 1024, // 2MB
      errorMsg: 'Only images (JPEG, JPG, PNG, WEBP) are allowed for profile images'
    }
  };

  const fieldConfig = fileTypes[file.fieldname] || fileTypes.certificate;
  
  const extname = fieldConfig.extensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fieldConfig.mimetypes.includes(file.mimetype);

  if (mimetype && extname) {
    // Store max size in request for later validation
    req.maxFileSize = fieldConfig.maxSize;
    cb(null, true);
  } else {
    cb(new Error(fieldConfig.errorMsg), false);
  }
};

// Initialize multer upload with enhanced configuration
const upload = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, 
    files: 10, 
    fields: 20
  },
  fileFilter
});

// Middleware to validate file size per field type
const validateFileSize = (req, res, next) => {
  if (req.file && req.maxFileSize && req.file.size > req.maxFileSize) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: `File size exceeds the limit of ${req.maxFileSize / (1024 * 1024)}MB`
    });
  }
  
  if (req.files) {
    for (const file of Object.values(req.files).flat()) {
      if (req.maxFileSize && file.size > req.maxFileSize) {
        Object.values(req.files).flat().forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({
          error: `File size exceeds the limit of ${req.maxFileSize / (1024 * 1024)}MB`
        });
      }
    }
  }
  
  next();
};

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field in form' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Export configurations
module.exports = {
  upload,
  validateFileSize,
  handleMulterError,
  
  // Predefined upload configurations
  uploadCertificate: upload.single('certificate'),
  uploadVideo: upload.single('introVideo'),
  uploadDocument: upload.single('document'),
  uploadProfile: upload.single('profileImage'),
  
  // Multiple file uploads
  uploadMultipleCertificates: upload.array('certificates', 5),
  uploadMixed: upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'introVideo', maxCount: 1 },
    { name: 'documents', maxCount: 3 }
  ])
};