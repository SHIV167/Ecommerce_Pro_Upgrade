import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PopupSetting from '../models/PopupSetting';

// Get popup settings (singleton)
export async function getPopupSetting(req: Request, res: Response) {
  try {
    // Ensure we have a valid database connection before querying
    if (!mongoose.connection.readyState) {
      console.warn('MongoDB not connected');
      return res.status(503).json({ 
        message: 'Database connection unavailable',
        data: {
          enabled: false,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          bgImage: ''
        }
      });
    }
    
    let setting = await PopupSetting.findOne();
    if (!setting) {
      console.log('No popup settings found, creating default');
      try {
        // Create default if not found
        setting = await PopupSetting.create({
          enabled: false,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          bgImage: '',
        });
      } catch (createError) {
        console.error('Failed to create default popup settings:', createError);
        return res.status(500).json({
          message: 'Failed to create default popup settings',
          error: createError instanceof Error ? createError.message : 'Unknown error',
          data: {
            enabled: false,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            bgImage: ''
          }
        });
      }
    }

    return res.json({
      success: true,
      data: setting.toObject()
    });
  } catch (error) {
    console.error('Error in getPopupSetting:', error);
    return res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        enabled: false,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        bgImage: ''
      }
    });
  }
}

// Update popup settings (singleton)
export async function updatePopupSetting(req: Request, res: Response) {
  try {
    // Check database connection
    if (!mongoose.connection.readyState) {
      console.warn('MongoDB not connected', { readyState: mongoose.connection.readyState, uri: process.env.MONGODB_URI ? 'MONGODB_URI set' : 'MONGODB_URI not set' });
      return res.status(503).json({ message: 'Database connection unavailable' });
    }

    console.log('Popup settings update request:', req.body);
    const { enabled, startDate, endDate, bgImage } = req.body;

    // Debug: Log types and values
    console.log('enabled:', enabled, typeof enabled);
    console.log('startDate:', startDate, typeof startDate);
    console.log('endDate:', endDate, typeof endDate);
    console.log('bgImage:', bgImage, typeof bgImage);

    // Strict validation
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }
    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({ message: 'startDate is required and must be a string' });
    }
    if (!endDate || typeof endDate !== 'string') {
      return res.status(400).json({ message: 'endDate is required and must be a string' });
    }
    if (!bgImage || typeof bgImage !== 'string') {
      return res.status(400).json({ message: 'bgImage is required and must be a string' });
    }

    const setting = await PopupSetting.findOneAndUpdate(
      {},
      { enabled, startDate, endDate, bgImage },
      { new: true, upsert: true }
    );

    if (!setting) {
      return res.status(500).json({ message: 'Failed to update popup settings' });
    }

    return res.json({
      success: true,
      data: setting.toObject()
    });
  } catch (error) {
    console.error('Popup settings update error:', error, { stack: error instanceof Error ? error.stack : 'No stack available' });
    return res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
