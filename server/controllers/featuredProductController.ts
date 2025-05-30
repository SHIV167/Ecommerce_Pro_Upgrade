import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CategoryModel from '../models/Category';

// Add a featured product with minimal data to avoid timeouts
export async function addFeaturedProduct(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    const productData = req.body;
    
    console.log('Adding featured product to category:', categoryId);
    console.log('Featured product data:', JSON.stringify(productData, null, 2));
    
    // Validate minimal required data
    if (!productData.productId || !productData.title) {
      return res.status(400).json({ 
        message: 'Product ID and title are required'
      });
    }
    
    // Find the category using direct MongoDB driver for better performance
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');
    
    // Add the product directly to the featuredProducts array using MongoDB's $push operator
    // This is much more efficient than fetching, modifying and saving the entire document
    const result = await categoriesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(categoryId) },
      { 
        $push: { 
          featuredProducts: {
            productId: productData.productId,
            title: productData.title,
            position: productData.position || 1,
            layout: productData.layout || 'image-right',
            variants: productData.variants || [{ 
              size: 'Default', 
              price: 0, 
              isDefault: true 
            }],
            benefits: productData.benefits || [],
            stats: productData.stats || []
          } 
        },
        $set: { 
          lastUpdated: new Date() 
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to add featured product' });
    }
    
    console.log('Featured product added successfully:', result);
    res.status(200).json({ 
      message: 'Featured product added successfully',
      result
    });
  } catch (error) {
    console.error('Error adding featured product:', error);
    res.status(500).json({ 
      message: 'Error adding featured product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Emergency endpoint for directly adding a minimal featured product
export async function emergencyAddFeaturedProduct(req: Request, res: Response) {
  try {
    const { categoryId, productData } = req.body;
    
    if (!categoryId || !productData || !productData.productId || !productData.title) {
      return res.status(400).json({ message: 'Missing required data' });
    }
    
    console.log('Emergency adding featured product to category:', categoryId);
    
    // Use direct MongoDB commands for maximum performance
    const db = mongoose.connection.db;
    const result = await db.collection('categories').updateOne(
      { _id: new mongoose.Types.ObjectId(categoryId) },
      { 
        $push: { 
          featuredProducts: {
            productId: productData.productId,
            title: productData.title,
            position: 1,
            layout: 'image-right',
            variants: [{ size: 'Default', price: 0, isDefault: true }]
          } 
        }
      }
    );
    
    console.log('Emergency update result:', result);
    
    res.status(200).json({ 
      message: 'Featured product added via emergency method',
      success: true
    });
  } catch (error) {
    console.error('Emergency add featured product failed:', error);
    res.status(500).json({ 
      message: 'Emergency update failed',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
