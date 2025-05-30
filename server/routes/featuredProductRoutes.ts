import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { 
  addFeaturedProduct,
  emergencyAddFeaturedProduct
} from '../controllers/featuredProductController';

const router = express.Router();

// Special optimized routes for featured products to avoid timeouts
router.post('/categories/:categoryId/featured-product', authenticateJWT, isAdmin, addFeaturedProduct);

// Emergency direct endpoint
router.post('/add-featured-product', authenticateJWT, isAdmin, emergencyAddFeaturedProduct);

export default router;
