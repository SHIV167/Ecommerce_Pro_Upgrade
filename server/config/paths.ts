import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

export const paths = {
  uploads: isProd 
    ? path.join(process.cwd(), 'storage', 'uploads')
    : path.join(process.cwd(), 'public', 'uploads'),
  
  // URL path for uploaded files
  uploadsUrl: isProd
    ? 'https://ecommercepromernadmin.onrender.com/uploads'
    : '/uploads',
};

// Ensure upload directories exist
import fs from 'fs';
import { mkdirp } from 'mkdirp';

// Create upload directory if it doesn't exist
mkdirp.sync(paths.uploads);

export default paths;
