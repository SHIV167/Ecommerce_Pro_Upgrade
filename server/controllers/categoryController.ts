import { Request, Response } from 'express';
import { MongoDBStorage } from '../storage/MongoDBStorage';
import CategoryModel from '../models/Category';
import cloudinary from '../utils/cloudinary';

const storage = new MongoDBStorage();

// Get all categories
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
}

// Get featured categories
export async function getFeaturedCategories(req: Request, res: Response) {
  try {
    const categories = await storage.getFeaturedCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    res.status(500).json({ message: 'Error fetching featured categories' });
  }
}

// Get category by slug
export async function getCategoryBySlug(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    console.log('Fetching category by slug:', slug);
    
    // Direct MongoDB query to ensure we get all fields including featuredProducts
    const CategoryModel = await import('../models/Category').then(m => m.default);
    const category = await CategoryModel.findOne({ slug }).lean();
    
    if (!category) {
      console.log('Category not found for slug:', slug);
      return res.status(404).json({ message: 'Category not found' });
    }
    
    console.log('Found category:', category._id);
    console.log('Featured products in category:', 
      category.featuredProducts ? `${category.featuredProducts.length} items` : 'none');
    
    // Ensure featuredProducts is at least an empty array
    if (!category.featuredProducts) {
      category.featuredProducts = [];
    }
    
    // Return the complete category with featuredProducts
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      message: 'Error fetching category', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Get category by ID (for admin dashboard)
export async function getCategoryById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    console.log('Fetching category by ID for admin dashboard:', id);
    
    // Direct MongoDB query with lean() to get plain object instead of Mongoose document
    const category = await CategoryModel.findById(id).lean();
    
    if (!category) {
      console.log('Category not found for ID:', id);
      return res.status(404).json({ message: 'Category not found' });
    }
    
    console.log('Found category by ID:', id);
    console.log('Number of featured products:', category.featuredProducts?.length || 0);
    
    // Important: Ensure featuredProducts is always an array
    if (!category.featuredProducts) {
      category.featuredProducts = [];
    }
    
    // Return the complete category with featuredProducts
    res.json(category);
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    res.status(500).json({ 
      message: 'Error fetching category', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Create category
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description, slug, featured } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Upload desktop image to Cloudinary
    let desktopImageUrl;
    if (files.desktopImage && files.desktopImage.length > 0) {
      try {
        const desktopFile = files.desktopImage[0];
        const result = await cloudinary.uploader.upload(
          `data:${desktopFile.mimetype};base64,${desktopFile.buffer.toString('base64')}`,
          {
            folder: 'categories',
            use_filename: true,
            unique_filename: true,
            secure: true
          }
        );
        desktopImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Desktop image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload desktop image' });
      }
    }

    // Upload mobile image to Cloudinary
    let mobileImageUrl;
    if (files.mobileImage && files.mobileImage.length > 0) {
      try {
        const mobileFile = files.mobileImage[0];
        const result = await cloudinary.uploader.upload(
          `data:${mobileFile.mimetype};base64,${mobileFile.buffer.toString('base64')}`,
          {
            folder: 'categories',
            use_filename: true,
            unique_filename: true,
            secure: true
          }
        );
        mobileImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Mobile image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload mobile image' });
      }
    }

    // Create category with uploaded images
    const category = new CategoryModel({
      name,
      description,
      slug,
      featured: featured === 'true' || featured === true,
      desktopImageUrl,
      mobileImageUrl: mobileImageUrl || desktopImageUrl // Use desktop image as fallback
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
}

// Update category
export async function updateCategory(req: Request, res: Response) {
  try {
    // Increased timeout for large payload operations
    req.setTimeout(30000);
    
    const { name, description, slug, featured, featuredProducts } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    console.log('Category update request received for ID:', req.params.id);
    console.log('Featured products included in request:', featuredProducts ? 'Yes' : 'No');

    // Find the category first
    const existingCategory = await CategoryModel.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update basic fields if provided
    if (name) existingCategory.name = name;
    if (description !== undefined) existingCategory.description = description;
    if (slug) existingCategory.slug = slug;
    if (featured !== undefined) existingCategory.featured = featured === 'true' || featured === true;
    
    // Handle featured products specifically
    if (featuredProducts !== undefined) {
      let parsedProducts;
      
      // Parse string if needed
      if (typeof featuredProducts === 'string') {
        try {
          parsedProducts = JSON.parse(featuredProducts);
        } catch (e) {
          console.error('Failed to parse featuredProducts JSON string:', e);
          return res.status(400).json({ message: 'Invalid featuredProducts format' });
        }
      } else {
        parsedProducts = featuredProducts;
      }
      
      // Validate array
      if (!Array.isArray(parsedProducts)) {
        console.error('featuredProducts is not an array');
        return res.status(400).json({ message: 'featuredProducts must be an array' });
      }
      
      console.log('Setting featured products:', parsedProducts.length, 'items');
      existingCategory.featuredProducts = parsedProducts;
    }
    
    // Handle image uploads if provided
    if (files && files.desktopImage && files.desktopImage.length > 0) {
      try {
        const desktopFile = files.desktopImage[0];
        const result = await cloudinary.uploader.upload(
          `data:${desktopFile.mimetype};base64,${desktopFile.buffer.toString('base64')}`,
          {
            folder: 'categories',
            use_filename: true,
            unique_filename: true,
            secure: true
          }
        );
        existingCategory.desktopImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Desktop image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload desktop image' });
      }
    }
    
    if (files && files.mobileImage && files.mobileImage.length > 0) {
      try {
        const mobileFile = files.mobileImage[0];
        const result = await cloudinary.uploader.upload(
          `data:${mobileFile.mimetype};base64,${mobileFile.buffer.toString('base64')}`,
          {
            folder: 'categories',
            use_filename: true,
            unique_filename: true,
            secure: true
          }
        );
        existingCategory.mobileImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Mobile image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload mobile image' });
      }
    }
    
    // Save the updated category
    try {
      const savedCategory = await existingCategory.save();
      console.log('Category updated successfully');
      return res.json(savedCategory);
    } catch (saveError) {
      console.error('Error saving category:', saveError);
      return res.status(500).json({ error: 'Failed to save category updates' });
    }
  } catch (error) {
    console.error('Category update error:', error);
    return res.status(500).json({ 
      message: 'Error updating category', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Delete category
export async function deleteCategory(req: Request, res: Response) {
  try {
    const category = await CategoryModel.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
}
