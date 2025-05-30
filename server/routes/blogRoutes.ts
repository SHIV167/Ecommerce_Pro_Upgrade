import express, { Request, Response, NextFunction } from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog } from '../controllers/blogController';

const router = express.Router();

// Public blog endpoints
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

// Admin blog endpoints
router.post('/blogs', authenticateJWT, isAdmin, createBlog);
router.put('/blogs/:id', authenticateJWT, isAdmin, updateBlog);
router.delete('/blogs/:id', authenticateJWT, isAdmin, deleteBlog);

export default router;
