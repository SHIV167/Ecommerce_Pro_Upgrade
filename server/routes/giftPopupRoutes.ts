import express from 'express';
import { getGiftPopupConfig, updateGiftPopupConfig, getGiftProducts } from '../controllers/giftPopupController';
import { authenticateJWT as authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes for client frontend
router.get('/gift-popup', getGiftPopupConfig);
router.get('/gift-products', getGiftProducts);

// Admin gift-popup routes now public (no auth required)
router.get('/admin/gift-popup', getGiftPopupConfig);
router.post('/admin/gift-popup', updateGiftPopupConfig);
router.put('/admin/gift-popup', updateGiftPopupConfig); // Add PUT method support
router.get('/admin/gift-products', getGiftProducts);

// Development routes for testing without admin authentication
router.get('/dev/gift-popup', getGiftPopupConfig);
router.post('/dev/gift-popup', updateGiftPopupConfig);
router.put('/dev/gift-popup', updateGiftPopupConfig);
router.get('/dev/gift-products', getGiftProducts);

export default router;
