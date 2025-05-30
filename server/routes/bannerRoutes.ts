import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import upload from '../utils/upload';
import Banner from '../models/Banner'; 
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured, isCloudinaryEnabled } from '../utils/cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Check if Cloudinary is properly configured
if (!isCloudinaryConfigured) {
  console.warn('[BANNER] WARNING: Cloudinary is not configured. Banner uploads will fail. Please configure Cloudinary.');
}

// Helper function to transform image URLs - only works with Cloudinary URLs now
const transformImageUrl = (url: string): string => {
  if (!url) return url;
  
  // If it's already a Cloudinary URL, ensure it's using HTTPS
  if (url.includes('cloudinary.com')) {
    return url.replace('http://', 'https://');
  }
  
  // We should no longer have any local URLs for banners, but handle them gracefully
  if (url.startsWith('/uploads/')) {
    console.warn(`[BANNER] Found local URL in database: ${url}. This should be updated through the UI.`);
  }
  
  return url;
};

// Function to validate a URL is a Cloudinary URL
const isCloudinaryUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com');
};

// Log that Cloudinary is required
console.log('[BANNER] Cloudinary is now required for all banner operations');

// Local storage setup for banners
const bannerDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });
const localStorage = multer.diskStorage({
  destination: bannerDir,
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const uploadLocal = multer({ storage: localStorage });

// Local routes: if Cloudinary disabled
if (!isCloudinaryEnabled) {
  // Create banner locally
  router.post('/api/banners', authenticateJWT, isAdmin,
    uploadLocal.fields([{ name: 'desktopImage', maxCount: 1 },{ name: 'mobileImage', maxCount: 1 }]),
    async (req, res) => {
      try {
        const { title, subtitle, alt, linkUrl, enabled, position } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const files = req.files as Record<string, Express.Multer.File[]>;
        const desktop = files.desktopImage?.[0];
        if (!desktop) return res.status(400).json({ error: 'Desktop image is required' });
        const desktopUrl = `/uploads/banners/${desktop.filename}`;
        const mobileUrl = files.mobileImage?.[0]
          ? `/uploads/banners/${files.mobileImage[0].filename}`
          : '';
        const banner = new Banner({ id: uuidv4(), title, subtitle: subtitle||'', alt: alt||title,
          linkUrl, enabled: enabled=='true'||enabled===true, position: parseInt(position as string,10)||0,
          desktopImageUrl: desktopUrl, mobileImageUrl: mobileUrl });
        const saved = await banner.save();
        return res.status(201).json({ success: true, message: 'Banner created locally', data: saved });
      } catch (e: any) {
        console.error('[BANNER] Local create error:', e);
        return res.status(500).json({ error: e.message });
      }
    }
  );
  // Update banner locally
  router.put('/api/banners/:id', authenticateJWT, isAdmin,
    uploadLocal.fields([{ name: 'desktopImage', maxCount: 1 },{ name: 'mobileImage', maxCount: 1 }]),
    async (req, res) => {
      try {
        const { title, subtitle, alt, linkUrl, enabled, position } = req.body;
        const files = req.files as Record<string, Express.Multer.File[]>;
        const banner = await Banner.findOne({ $or: [{ id: req.params.id },{ _id: req.params.id }] });
        if (!banner) return res.status(404).json({ error: 'Banner not found' });
        if (title!==undefined) banner.title = title;
        if (subtitle!==undefined) banner.subtitle = subtitle;
        if (alt!==undefined) banner.alt = alt;
        if (linkUrl!==undefined) banner.linkUrl = linkUrl;
        if (enabled!==undefined) banner.enabled = enabled=='true'||enabled===true;
        if (position!==undefined) banner.position = parseInt(position as string,10);
        if (files.desktopImage?.[0]) banner.desktopImageUrl = `/uploads/banners/${files.desktopImage[0].filename}`;
        if (files.mobileImage?.[0]) banner.mobileImageUrl = `/uploads/banners/${files.mobileImage[0].filename}`;
        const updated = await banner.save();
        return res.status(200).json({ success: true, message: 'Banner updated locally', data: updated });
      } catch (e: any) {
        console.error('[BANNER] Local update error:', e);
        return res.status(500).json({ error: e.message });
      }
    }
  );
}

// GET all banners
router.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort('position').lean();
    
    // Log a warning if any banners still have local URLs, but don't replace them
    const localUrlCount = banners.filter(banner => 
      (banner.desktopImageUrl && !banner.desktopImageUrl.includes('cloudinary.com')) ||
      (banner.mobileImageUrl && !banner.mobileImageUrl.includes('cloudinary.com'))
    ).length;
    
    if (localUrlCount > 0) {
      console.warn(`[BANNER] Found ${localUrlCount} banners using non-Cloudinary URLs. These should be updated through the UI.`);
    }
    
    // Only transform the URLs but don't replace with placeholders
    const processedBanners = banners.map(banner => {
      // Just optimize the Cloudinary URLs if they exist
      if (banner.desktopImageUrl?.includes('cloudinary.com')) {
        banner.desktopImageUrl = transformImageUrl(banner.desktopImageUrl);
      }
      
      if (banner.mobileImageUrl?.includes('cloudinary.com')) {
        banner.mobileImageUrl = transformImageUrl(banner.mobileImageUrl);
      }
      
      return banner;
    });
    
    res.json(processedBanners);
  } catch (error: any) {
    console.error('[BANNER] Error fetching banners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET banner by ID
router.get('/api/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }]
    }).lean();

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Optimize Cloudinary URLs
    if (banner.desktopImageUrl?.includes('cloudinary.com')) {
      banner.desktopImageUrl = transformImageUrl(banner.desktopImageUrl);
    }
    
    if (banner.mobileImageUrl?.includes('cloudinary.com')) {
      banner.mobileImageUrl = transformImageUrl(banner.mobileImageUrl);
    }

    res.json(banner);
  } catch (error) {
    console.error('[BANNER] Error fetching banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create banner - always uploads to Cloudinary
router.post('/api/banners', authenticateJWT, isAdmin, (req, res, next) => {
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ])(req as any, res as any, async (err) => {
    if (err) {
      console.error('[BANNER] File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, subtitle, alt, linkUrl, enabled, position } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log('[BANNER] Creating banner with files:', {
        hasFiles: !!files,
        fileFields: files ? Object.keys(files) : [],
        desktopCount: files?.desktopImage?.length,
        mobileCount: files?.mobileImage?.length
      });
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      if (!isCloudinaryConfigured) {
        return res.status(500).json({
          error: 'Cloudinary is not configured. Banner uploads require Cloudinary.'
        });
      }
      
      // Desktop image is required
      if (!files?.desktopImage || files.desktopImage.length === 0) {
        return res.status(400).json({ error: 'Desktop image is required' });
      }
      
      // Upload desktop image to Cloudinary
      let desktopImageUrl = '';
      try {
        const desktopFile = files.desktopImage[0];
        console.log('[BANNER] Processing desktop file:', {
          fieldname: desktopFile.fieldname,
          mimetype: desktopFile.mimetype,
          size: desktopFile.size,
          hasBuffer: !!desktopFile.buffer,
          hasPath: !!desktopFile.path,
          hasSecureUrl: !!desktopFile.secure_url
        });
        
        // Check if the file already has a secure_url (from multer middleware)
        if (desktopFile.secure_url) {
          desktopImageUrl = desktopFile.secure_url;
          console.log('[BANNER] Using desktop secure_url from multer middleware:', desktopImageUrl);
        } else if (desktopFile.path && desktopFile.path.includes('cloudinary.com')) {
          // If path is already a Cloudinary URL
          desktopImageUrl = desktopFile.path;
          console.log('[BANNER] Using desktop path as Cloudinary URL:', desktopImageUrl);
        } else if (desktopFile.buffer) {
          // If we have a buffer, upload it directly to Cloudinary
          console.log('[BANNER] Uploading desktop buffer to Cloudinary');
          const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'banners',
              resource_type: 'auto'
            }, (error, result) => {
              if (error || !result) {
                return reject(error || new Error('No result from Cloudinary'));
              }
              resolve({ secure_url: result.secure_url });
            });
            
            uploadStream.end(desktopFile.buffer);
          });
          
          desktopImageUrl = result.secure_url;
          console.log('[BANNER] Successfully uploaded desktop image to Cloudinary:', desktopImageUrl);
        } else if (desktopFile.path) {
          // If we have a path but no buffer, read the file and upload to Cloudinary
          console.log('[BANNER] Uploading desktop file path to Cloudinary:', desktopFile.path);
          const result = await cloudinary.uploader.upload(desktopFile.path, {
            folder: 'banners',
            resource_type: 'auto'
          });
          desktopImageUrl = result.secure_url;
          console.log('[BANNER] Successfully uploaded desktop image to Cloudinary:', desktopImageUrl);
          
          // Clean up temp file if it exists locally
          try {
            if (fs.existsSync(desktopFile.path)) {
              fs.unlinkSync(desktopFile.path);
            }
          } catch (e) {
            console.warn('[BANNER] Could not delete temp file:', e);
          }
        } else {
          return res.status(400).json({ error: 'Invalid desktop image data - no buffer or path available' });
        }
      } catch (uploadError) {
        console.error('[BANNER] Desktop image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload desktop image to Cloudinary: ' + (uploadError as Error).message });
      }
      
      // Upload mobile image to Cloudinary if provided
      let mobileImageUrl = '';
      if (files?.mobileImage && files.mobileImage.length > 0) {
        try {
          const mobileFile = files.mobileImage[0];
          console.log('[BANNER] Processing mobile file:', {
            fieldname: mobileFile.fieldname,
            mimetype: mobileFile.mimetype,
            size: mobileFile.size,
            hasBuffer: !!mobileFile.buffer,
            hasPath: !!mobileFile.path,
            hasSecureUrl: !!mobileFile.secure_url
          });
          
          // Check if the file already has a secure_url (from multer middleware)
          if (mobileFile.secure_url) {
            mobileImageUrl = mobileFile.secure_url;
            console.log('[BANNER] Using mobile secure_url from multer middleware:', mobileImageUrl);
          } else if (mobileFile.path && mobileFile.path.includes('cloudinary.com')) {
            // If path is already a Cloudinary URL
            mobileImageUrl = mobileFile.path;
            console.log('[BANNER] Using mobile path as Cloudinary URL:', mobileImageUrl);
          } else if (mobileFile.buffer) {
            // If we have a buffer, upload it directly to Cloudinary
            console.log('[BANNER] Uploading mobile buffer to Cloudinary');
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'banners',
                resource_type: 'auto'
              }, (error, result) => {
                if (error || !result) {
                  return reject(error || new Error('No result from Cloudinary'));
                }
                resolve({ secure_url: result.secure_url });
              });
              
              uploadStream.end(mobileFile.buffer);
            });
            
            mobileImageUrl = result.secure_url;
            console.log('[BANNER] Successfully uploaded mobile image to Cloudinary:', mobileImageUrl);
          } else if (mobileFile.path) {
            // If we have a path but no buffer, read the file and upload to Cloudinary
            console.log('[BANNER] Uploading mobile file path to Cloudinary:', mobileFile.path);
            const result = await cloudinary.uploader.upload(mobileFile.path, {
              folder: 'banners',
              resource_type: 'auto'
            });
            mobileImageUrl = result.secure_url;
            console.log('[BANNER] Successfully uploaded mobile image to Cloudinary:', mobileImageUrl);
            
            // Clean up temp file if it exists locally
            try {
              if (fs.existsSync(mobileFile.path)) {
                fs.unlinkSync(mobileFile.path);
              }
            } catch (e) {
              console.warn('[BANNER] Could not delete temp file:', e);
            }
          } else {
            return res.status(400).json({ error: 'Invalid mobile image data - no buffer or path available' });
          }
        } catch (uploadError) {
          console.error('[BANNER] Mobile image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload mobile image to Cloudinary: ' + (uploadError as Error).message });
        }
      } else {
        // Use desktop image if mobile not provided
        mobileImageUrl = desktopImageUrl;
      }
      
      // Validate Cloudinary URLs
      if (!desktopImageUrl.includes('cloudinary.com')) {
        console.error('[BANNER] Invalid desktop image URL (not Cloudinary):', desktopImageUrl);
        return res.status(500).json({ error: 'Failed to get a valid Cloudinary URL for desktop image' });
      }
      
      if (!mobileImageUrl.includes('cloudinary.com')) {
        console.error('[BANNER] Invalid mobile image URL (not Cloudinary):', mobileImageUrl);
        return res.status(500).json({ error: 'Failed to get a valid Cloudinary URL for mobile image' });
      }
      
      console.log('[BANNER] Creating banner with URLs:', {
        desktopImageUrl,
        mobileImageUrl
      });
      
      // Create banner with Cloudinary URLs
      const banner = new Banner({
        id: uuidv4(),
        title,
        subtitle: subtitle || '',
        desktopImageUrl,
        mobileImageUrl,
        alt: alt || title,
        enabled: enabled === 'true' || enabled === true,
        position: position ? parseInt(position as string, 10) : 0
      });
      
      const savedBanner = await banner.save();
      
      return res.status(201).json({
        success: true,
        message: 'Banner created with Cloudinary images',
        data: savedBanner
      });
    } catch (error) {
      console.error('[BANNER] Error creating banner:', error);
      return res.status(500).json({ error: 'Failed to create banner: ' + (error as Error).message });
    }
  });
});

// Update banner - always uploads to Cloudinary
router.put('/api/banners/:id', authenticateJWT, isAdmin, (req, res, next) => {
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ])(req as any, res as any, async (err) => {
    if (err) {
      console.error('[BANNER] File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, subtitle, alt, linkUrl, enabled, position } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log('[BANNER] Updating banner with files:', {
        bannerId: req.params.id,
        hasFiles: !!files,
        fileFields: files ? Object.keys(files) : [],
        desktopCount: files?.desktopImage?.length,
        mobileCount: files?.mobileImage?.length
      });
      
      // Find banner
      const bannerId = req.params.id;
      const filter = mongoose.Types.ObjectId.isValid(bannerId)
        ? { $or: [{ id: bannerId }, { _id: bannerId }] }
        : { id: bannerId };
      const banner = await Banner.findOne(filter);
      
      if (!banner) {
        return res.status(404).json({ error: 'Banner not found' });
      }
      
      if (!isCloudinaryConfigured) {
        return res.status(500).json({
          error: 'Cloudinary is not configured. Banner updates require Cloudinary.'
        });
      }
      
      // Update text fields
      if (title) banner.title = title;
      if (subtitle !== undefined) banner.subtitle = subtitle || '';
      if (alt !== undefined) banner.alt = alt || banner.title;

      if (enabled !== undefined) banner.enabled = enabled === 'true' || enabled === true;
      if (position !== undefined) banner.position = parseInt(position as string, 10);
      
      // Upload desktop image to Cloudinary if provided
      if (files?.desktopImage && files.desktopImage.length > 0) {
        try {
          const desktopFile = files.desktopImage[0];
          
          // Check if the file already has a secure_url (from multer middleware)
          if (desktopFile.secure_url) {
            banner.desktopImageUrl = desktopFile.secure_url;
            console.log('[BANNER] Using secure_url from multer middleware:', desktopFile.secure_url);
          } else if (desktopFile.buffer) {
            // If we have a buffer, upload it directly to Cloudinary
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'banners',
                resource_type: 'auto'
              }, (error, result) => {
                if (error || !result) {
                  return reject(error || new Error('No result from Cloudinary'));
                }
                resolve({ secure_url: result.secure_url });
              });
              
              uploadStream.end(desktopFile.buffer);
            });
            
            banner.desktopImageUrl = result.secure_url;
            console.log('[BANNER] Uploaded desktop image buffer to Cloudinary:', result.secure_url);
          } else {
            console.error('[BANNER] Invalid desktop image data - no buffer or secure_url');
            return res.status(400).json({ error: 'Invalid desktop image data' });
          }
        } catch (uploadError) {
          console.error('[BANNER] Desktop image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload desktop image to Cloudinary' });
        }
      }
      
      // Upload mobile image to Cloudinary if provided
      if (files?.mobileImage && files.mobileImage.length > 0) {
        try {
          const mobileFile = files.mobileImage[0];
          
          // Check if the file already has a secure_url (from multer middleware)
          if (mobileFile.secure_url) {
            banner.mobileImageUrl = mobileFile.secure_url;
            console.log('[BANNER] Using secure_url from multer middleware:', mobileFile.secure_url);
          } else if (mobileFile.buffer) {
            // If we have a buffer, upload it directly to Cloudinary
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'banners',
                resource_type: 'auto'
              }, (error, result) => {
                if (error || !result) {
                  return reject(error || new Error('No result from Cloudinary'));
                }
                resolve({ secure_url: result.secure_url });
              });
              
              uploadStream.end(mobileFile.buffer);
            });
            
            banner.mobileImageUrl = result.secure_url;
            console.log('[BANNER] Uploaded mobile image buffer to Cloudinary:', result.secure_url);
          } else {
            console.error('[BANNER] Invalid mobile image data - no buffer or secure_url');
            return res.status(400).json({ error: 'Invalid mobile image data' });
          }
        } catch (uploadError) {
          console.error('[BANNER] Mobile image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload mobile image to Cloudinary' });
        }
      }
      
      // Validate Cloudinary URLs
      if (!banner.desktopImageUrl?.includes('cloudinary.com')) {
        console.error('[BANNER] Non-Cloudinary desktop URL detected:', banner.desktopImageUrl);
      }
      
      if (!banner.mobileImageUrl?.includes('cloudinary.com')) {
        console.error('[BANNER] Non-Cloudinary mobile URL detected:', banner.mobileImageUrl);
      }
      
      const updatedBanner = await banner.save();
      
      return res.status(200).json({
        success: true,
        message: 'Banner updated with Cloudinary images',
        data: updatedBanner
      });
    } catch (error) {
      console.error('[BANNER] Error updating banner:', error);
      return res.status(500).json({ error: 'Failed to update banner' });
    }
  });
});

// Delete banner
router.delete('/api/banners/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const bannerId = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(bannerId)
      ? { $or: [{ id: bannerId }, { _id: bannerId }] }
      : { id: bannerId };
    const banner = await Banner.findOneAndDelete(filter);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('[BANNER] Error deleting banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
