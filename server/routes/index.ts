import express from 'express';
import uploadRoutes from './uploadRoutes';
import bannerRoutes from './bannerRoutes.new';
import { errorHandler } from '../middleware/errorHandler';

const router = express.Router();

// Register routes
router.use(uploadRoutes);
router.use(bannerRoutes);

// Error handling middleware should be last
router.use(errorHandler);

export default router;
