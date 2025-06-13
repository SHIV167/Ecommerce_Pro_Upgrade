import { Request, Response } from 'express';
import SpinCampaign from '../models/SpinCampaign';
import SpinHistory from '../models/SpinHistory';
import mongoose from 'mongoose';

// Admin: list all campaigns
export const getAdminSpinCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await SpinCampaign.find();
    res.status(200).json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching spin campaigns' });
  }
};

// Public: list active campaigns
export const getAllSpinCampaigns = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const campaigns = await SpinCampaign.find({ startDate: { $lte: now }, endDate: { $gte: now } });
    res.status(200).json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching spin campaigns' });
  }
};

// Admin & Public: get by id
export const getSpinCampaignByIdAdmin = async (req: Request, res: Response) => {
  try {
    const campaign = await SpinCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.status(200).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching campaign' });
  }
};
export const getSpinCampaignById = getSpinCampaignByIdAdmin;

// Admin: create
export const createSpinCampaign = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const campaign = new SpinCampaign(data);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating campaign' });
  }
};

// Admin: update
export const updateSpinCampaign = async (req: Request, res: Response) => {
  try {
    const update = req.body;
    const campaign = await SpinCampaign.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.status(200).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating campaign' });
  }
};

// Admin: delete
export const deleteSpinCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await SpinCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.status(200).json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting campaign' });
  }
};

// User: spin
export const spinCampaign = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const campaign = await SpinCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const now = new Date();
    if (now < campaign.startDate || now > campaign.endDate) {
      return res.status(400).json({ message: 'Campaign not active' });
    }

    const count = await SpinHistory.countDocuments({ userId, campaignId: campaign._id });
    if (count >= campaign.maxSpinsPerUser) {
      return res.status(400).json({ message: 'No spins left' });
    }

    // filter available prizes
    const available = campaign.prizes.filter(p => p.quantity !== 0);
    if (!available.length) return res.status(400).json({ message: 'No prizes available' });

    // weighted random
    const total = available.reduce((sum, p) => sum + p.weight, 0);
    let rnd = Math.random() * total;
    let selected = available[0];
    for (const prize of available) {
      rnd -= prize.weight;
      if (rnd <= 0) {
        selected = prize;
        break;
      }
    }

    // decrement quantity
    if (selected.quantity > 0) {
      await SpinCampaign.updateOne(
        { _id: campaign._id, 'prizes._id': selected._id },
        { $inc: { 'prizes.$.quantity': -1 } }
      );
    }

    const history = new SpinHistory({ userId, campaignId: campaign._id, prize: selected });
    await history.save();
    res.status(200).json(selected);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during spin' });
  }
};
