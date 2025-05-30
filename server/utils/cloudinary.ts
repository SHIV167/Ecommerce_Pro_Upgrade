import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

export const isCloudinaryEnabled = process.env.CLOUDINARY_ENABLED === 'true';
export const isCloudinaryConfigured =
  isCloudinaryEnabled &&
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

console.log('[CLOUDINARY] Configuration status:', {
  enabled: isCloudinaryEnabled,
  configured: isCloudinaryConfigured,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasSecret: !!process.env.CLOUDINARY_API_SECRET
});

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[CLOUDINARY] Configured successfully');
} else {
  console.warn('[CLOUDINARY] Not configured. Check environment variables.');
}

export default cloudinary;
