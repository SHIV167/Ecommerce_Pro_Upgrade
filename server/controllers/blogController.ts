import { Request, Response, NextFunction } from 'express';
import BlogModel from '../models/Blog';

// Retrieve all blogs, sorted by publish date descending
export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogs = await BlogModel.find().sort({ publishedAt: -1 });
    res.json(blogs);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single blog by its slug
export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const blog = await BlogModel.findOne({ slug });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    next(error);
  }
};

// Create a new blog post
export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, slug, author, summary, content, imageUrl, publishedAt } = req.body;
    const newBlog = new BlogModel({ title, slug, author, summary, content, imageUrl, publishedAt });
    const saved = await newBlog.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// Update an existing blog by id
export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await BlogModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Blog not found' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete a blog by id
export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await BlogModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    next(error);
  }
};
