import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import upload from '../utils/upload';
import { isCloudinaryConfigured } from '../utils/cloudinary';

const router = express.Router();

// Debug: log incoming upload request made website
router.use((req, res, next) => {
  console.log('[UPLOAD ROUTE] Received', req.method, req.originalUrl);
  next();
});

router.post('/api/admin/upload', authenticateJWT, isAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Get the URL based on storage type
  let imageUrl;
  if (isCloudinaryConfigured) {
    // For Cloudinary, use secure_url if available, fallback to path
    imageUrl = (req.file as any).secure_url || req.file.path;
    // Ensure HTTPS
    if (imageUrl && !imageUrl.startsWith('https://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }
    console.log('[UPLOAD] Cloudinary URL:', imageUrl);
  } else {
    // For local storage
    imageUrl = `/uploads/products/${req.file.filename}`;
    console.log('[UPLOAD] Local URL:', imageUrl);
  }

  res.json({ success: true, imageUrl });
});

router.post('/api/upload/images', authenticateJWT, isAdmin, upload.array('images', 10), async (req, res) => {
  // Ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  try {
    console.log('[UPLOAD ROUTE] req.files:', req.files);
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = (req.files as any[]).map(file => {
      // Handle Cloudinary vs local file paths
      let url;
      if (isCloudinaryConfigured) {
        // For Cloudinary, prefer secure_url, fallback to path
        url = (file as any).secure_url || file.path;
        // Ensure we're using HTTPS
        if (url && !url.startsWith('https://')) {
          url = url.replace('http://', 'https://');
        }
      } else {
        // For local storage, construct the URL
        url = `/uploads/products/${file.filename}`;
      }
      
      // Debug logging
      console.log('[UPLOAD ROUTE] File URL:', {
        secure_url: (file as any).secure_url,
        path: file.path,
        final_url: url
      });
      
      return {
        filename: file.filename,
        path: url,
        size: file.size,
        mimetype: file.mimetype,
        // Add source information for debugging
        storage: isCloudinaryConfigured ? 'cloudinary' : 'local'
      };
    });
    console.log('[UPLOAD ROUTE] Responding with uploadedFiles:', uploadedFiles);
    return res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Error uploading files'
    });
  }
});

export default router;
