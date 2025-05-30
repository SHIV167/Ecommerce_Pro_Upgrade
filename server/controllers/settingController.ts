import { Request, Response } from 'express';
import SettingModel from '../models/Setting';

// Get store settings (singleton)
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SettingModel.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await SettingModel.create({
        siteName: '',
        maintenanceMode: false,
        supportEmail: '',
        razorpayKeyId: '',
        razorpayKeySecret: '',
        shiprocketApiKey: '',
        shiprocketApiSecret: '',
        shiprocketSourcePincode: '',
        shiprocketPickupLocation: '',
        shiprocketChannelId: 0,
        taxEnabled: false,
        taxPercentage: 0,
      });
    }
    return res.json(settings);
  } catch (error: any) {
    console.error('Error in getSettings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update store settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const settings = await SettingModel.findOneAndUpdate({}, data, { new: true, upsert: true });
    return res.json(settings);
  } catch (error: any) {
    console.error('Error in updateSettings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
