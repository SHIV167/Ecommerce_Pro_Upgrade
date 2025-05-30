import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Request, Response } from 'express';
import fs from 'fs';
import SettingModel from '../models/Setting';
import { sendMail } from '../utils/mailer';

// Controller to perform database backup and email download link
export async function backupDatabase(req: Request, res: Response) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      return res.status(500).json({ message: 'MongoDB URI is not configured' });
    }

    // Ensure backup directory exists
    const backupDir = path.resolve(__dirname, '../public/uploads/BACKUP');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `db-backup-${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFilename);

    // Execute mongodump command using exec
    const cmd = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        console.error('mongodump exec error:', error, stderr);
        return res.status(500).json({ message: 'Database backup failed', details: error.message });
      }

      // Construct download link
      const apiUrl = process.env.VITE_API_URL || '';
      const downloadLink = `${apiUrl}/uploads/BACKUP/${backupFilename}`;

      // Retrieve support email
      const settings = await SettingModel.findOne();
      const toEmail = settings?.supportEmail || '';

      // Send email with link
      try {
        await sendMail({
          to: toEmail,
          subject: 'Database Backup Available',
          html: `<p>Your database backup is ready. <a href="${downloadLink}">Download here</a>.</p>`
        });
      } catch (emailErr) {
        console.error('Error sending backup email:', emailErr);
      }

      return res.json({ success: true, downloadLink });
    });
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
