import express from 'express';
import {
  getAdminSpinCampaigns,
  getAllSpinCampaigns,
  getSpinCampaignByIdAdmin,
  getSpinCampaignById,
  createSpinCampaign,
  updateSpinCampaign,
  deleteSpinCampaign,
  spinCampaign
} from '../controllers/spinCampaignController';
import { isAuthenticated, isAdmin } from './authRoutes';

const router = express.Router();

// Admin CRUD
router.get('/admin/spin-campaigns', getAdminSpinCampaigns);
router.get('/admin/spin-campaigns/:id', getSpinCampaignByIdAdmin);
router.post('/admin/spin-campaigns', createSpinCampaign);
router.put('/admin/spin-campaigns/:id', isAuthenticated, isAdmin, updateSpinCampaign);
router.delete('/admin/spin-campaigns/:id', isAuthenticated, isAdmin, deleteSpinCampaign);

// Public endpoints
router.get('/spin-campaigns', getAllSpinCampaigns);
router.get('/spin-campaigns/:id', getSpinCampaignById);

// User spin action
router.post('/spin-campaigns/:id/spin', isAuthenticated, spinCampaign);

export default router;
