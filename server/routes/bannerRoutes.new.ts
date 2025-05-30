import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import upload from '../utils/upload';
import Banner from '../models/Banner'; 
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../utils/cloudinary';
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

// GET all banners
router.get('/banners', async (req, res) => {
  try {
    // Respect `enabled` filter if provided
    const { enabled } = req.query;
    let queryBuilder = Banner.find();
    if (enabled === 'true') queryBuilder = queryBuilder.where('enabled').equals(true);
    else if (enabled === 'false') queryBuilder = queryBuilder.where('enabled').equals(false);
    const banners = await queryBuilder.sort('position').lean();
    
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
router.get('/banners/:id', async (req, res) => {
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
router.post('/banners', authenticateJWT, isAdmin, (req, res, next) => {
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ])(req as any, res as any, async (err) => {
    if (err) {
      console.error('[BANNER] File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, subtitle, alt, enabled, position } = req.body;
      const linkUrl = req.body.linkUrl;
      console.log('[BANNER] POST linkUrl received:', linkUrl);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      if (!isCloudinaryConfigured) {
        return res.status(500).json({
          error: 'Cloudinary is not configured. Banner uploads require Cloudinary.'
        });
      }
      
      // Desktop image is required
      if (!files.desktopImage || files.desktopImage.length === 0) {
        return res.status(400).json({ error: 'Desktop image is required' });
      }
      
      // Upload desktop image to Cloudinary
      let desktopImageUrl;
      try {
        const desktopFile = files.desktopImage[0];
        const result = await cloudinary.uploader.upload(`data:${desktopFile.mimetype};base64,${desktopFile.buffer.toString('base64')}`, {
          folder: 'banners',
          use_filename: true,
          unique_filename: true,
          secure: true
        });
        desktopImageUrl = result.secure_url;
        console.log('[BANNER] Desktop image uploaded to Cloudinary:', desktopImageUrl);
      } catch (uploadError) {
        console.error('[BANNER] Desktop image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload desktop image to Cloudinary' });
      }
      
      // Upload mobile image to Cloudinary if provided
      let mobileImageUrl;
      if (files.mobileImage && files.mobileImage.length > 0) {
        try {
          const mobileFile = files.mobileImage[0];
          const result = await cloudinary.uploader.upload(`data:${mobileFile.mimetype};base64,${mobileFile.buffer.toString('base64')}`, {
            folder: 'banners',
            use_filename: true,
            unique_filename: true,
            secure: true
          });
          mobileImageUrl = result.secure_url;
          console.log('[BANNER] Mobile image uploaded to Cloudinary:', mobileImageUrl);
        } catch (uploadError) {
          console.error('[BANNER] Mobile image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload mobile image to Cloudinary' });
        }
      } else {
        // Use desktop image if mobile not provided
        mobileImageUrl = desktopImageUrl;
      }
      
      if (!desktopImageUrl || !mobileImageUrl) {
        return res.status(500).json({ error: 'Failed to get Cloudinary URLs for images' });
      }
      
      // Create banner with Cloudinary URLs
      console.log('[BANNER] Creating banner with URLs:', { desktopImageUrl, mobileImageUrl });
      // Ensure we have valid Cloudinary URLs
      if (!desktopImageUrl?.includes('cloudinary.com')) {
        console.error('[BANNER] Invalid desktop image URL:', desktopImageUrl);
        return res.status(400).json({ error: 'Invalid desktop image URL' });
      }

      if (!mobileImageUrl?.includes('cloudinary.com')) {
        console.error('[BANNER] Invalid mobile image URL:', mobileImageUrl);
        return res.status(400).json({ error: 'Invalid mobile image URL' });
      }

      const bannerData = {
        id: uuidv4(),
        title,
        subtitle: subtitle || '',
        desktopImageUrl,
        mobileImageUrl,
        alt: alt || title,
        enabled: enabled === 'true' || enabled === true,
        position: position ? parseInt(position as string, 10) : 0,
        linkUrl: linkUrl || ''
      };

      console.log('[BANNER] Creating banner with data:', bannerData);
      const banner = new Banner(bannerData);
      
      const savedBanner = await banner.save();
      console.log('[BANNER] POST savedBanner.linkUrl:', savedBanner.linkUrl);
      
      return res.status(201).json({
        success: true,
        message: 'Banner created with Cloudinary images',
        data: savedBanner
      });
    } catch (error) {
      console.error('[BANNER] Error creating banner:', error);
      return res.status(500).json({ error: 'Failed to create banner' });
    }
  });
});

// Update banner - always uploads to Cloudinary
router.put('/banners/:id', authenticateJWT, isAdmin, (req, res, next) => {
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ])(req as any, res as any, async (err) => {
    if (err) {
      console.error('[BANNER] File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, subtitle, alt, enabled, position } = req.body;
      const linkUrl = req.body.linkUrl;
      console.log('[BANNER] PUT linkUrl received:', linkUrl);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Find banner by UUID or ObjectId
      const bannerId = req.params.id;
      let banner;
      if (mongoose.Types.ObjectId.isValid(bannerId)) {
        banner = await Banner.findOne({ $or: [{ id: bannerId }, { _id: bannerId }] });
      } else {
        banner = await Banner.findOne({ id: bannerId });
      }
      
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
      if (linkUrl !== undefined) banner.linkUrl = linkUrl;

      if (enabled !== undefined) banner.enabled = enabled === 'true' || enabled === true;
      if (position !== undefined) banner.position = parseInt(position as string, 10);
      
      // Upload desktop image to Cloudinary if provided
      if (files.desktopImage && files.desktopImage.length > 0) {
        try {
          const desktopFile = files.desktopImage[0];
          const result = await cloudinary.uploader.upload(desktopFile.path, {
            folder: 'banners',
            use_filename: true,
            unique_filename: true
          });
          banner.desktopImageUrl = result.secure_url;
          
          // Clean up temp file
          fs.unlinkSync(desktopFile.path);
        } catch (uploadError) {
          console.error('[BANNER] Desktop image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload desktop image to Cloudinary' });
        }
      }
      
      // Upload mobile image to Cloudinary if provided
      if (files.mobileImage && files.mobileImage.length > 0) {
        try {
          const mobileFile = files.mobileImage[0];
          const result = await cloudinary.uploader.upload(mobileFile.path, {
            folder: 'banners',
            use_filename: true,
            unique_filename: true
          });
          banner.mobileImageUrl = result.secure_url;
          
          // Clean up temp file
          fs.unlinkSync(mobileFile.path);
        } catch (uploadError) {
          console.error('[BANNER] Mobile image upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload mobile image to Cloudinary' });
        }
      }
      
      const updatedBanner = await banner.save();
      console.log('[BANNER] PUT updatedBanner.linkUrl:', updatedBanner.linkUrl);
      
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
router.delete('/banners/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Determine filter to avoid casting invalid ObjectId
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
