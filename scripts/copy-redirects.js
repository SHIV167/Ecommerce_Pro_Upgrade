import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory if it doesn't exist
const targetDir = path.resolve(__dirname, '../dist/public/admin');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Create _redirects file
fs.writeFileSync(
  path.resolve(targetDir, '_redirects'),
  '/* /index.html 200'
);

console.log('Created _redirects file in dist/public/admin');
