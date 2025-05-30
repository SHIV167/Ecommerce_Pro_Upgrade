import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Configure Cloudinary
const isCloudinaryEnabled = process.env.CLOUDINARY_ENABLED === 'true';
const isCloudinaryConfigured =
  isCloudinaryEnabled &&
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

async function testCloudinaryConfig() {
  console.log('\n=== Testing Cloudinary Configuration ===');
  console.log('Cloudinary Enabled:', process.env.CLOUDINARY_ENABLED);
  console.log('Cloudinary Configured:', isCloudinaryConfigured);
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set');
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');
}

async function testDirectUpload() {
  console.log('\n=== Testing Direct Cloudinary Upload ===');
  if (!isCloudinaryConfigured) {
    console.log('Cloudinary is not configured. Skipping upload test.');
    return;
  }

  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testFilePath, 'Test content for upload');

    console.log('Attempting to upload test file...');
    const result = await cloudinary.uploader.upload(testFilePath, {
      folder: 'ecommerce/test',
      resource_type: 'raw'
    });

    console.log('Upload successful!');
    console.log('Upload URL:', result.secure_url);
    console.log('Public ID:', result.public_id);

    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    // Delete the uploaded file from Cloudinary
    await cloudinary.uploader.destroy(result.public_id);
    console.log('Test file cleaned up successfully');
  } catch (error: any) {
    console.error('Upload test failed:', error.message);
  }
}

async function runTests() {
  await testCloudinaryConfig();
  await testDirectUpload();
}

runTests().catch(console.error);
