import { Request, Response } from 'express';
import FreeProductModel from '../models/FreeProduct';

// Get all free products
export async function getAllFreeProducts(req: Request, res: Response) {
  try {
    const isAdminRoute = req.path.startsWith('/admin');
    const query = isAdminRoute ? {} : { enabled: true };
    const freeProducts = await FreeProductModel.find(query);
    res.json(freeProducts);
  } catch (error) {
    console.error('Get free products error:', error);
    res.status(500).json({ message: 'Error fetching free products' });
  }
}

// Get a single free product by ID
export async function getFreeProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const isAdminRoute = req.path.startsWith('/admin');
    const freeProduct = await FreeProductModel.findById(id);
    
    if (!freeProduct) {
      return res.status(404).json({ message: 'Free product not found' });
    }

    // If it's not an admin route and the product is disabled, return 404
    if (!isAdminRoute && !freeProduct.enabled) {
      return res.status(404).json({ message: 'Free product not found' });
    }
    res.json(freeProduct);
  } catch (error) {
    console.error('Get free product error:', error);
    res.status(500).json({ message: 'Error fetching free product' });
  }
}

// Create a new free product
export async function createFreeProduct(req: Request, res: Response) {
  try {
    const { productId, minOrderValue, maxOrderValue, enabled = true } = req.body;
    
    // Validate min and max order values
    if (minOrderValue <= 0) {
      return res.status(400).json({ message: 'Minimum order value must be greater than zero' });
    }
    
    if (maxOrderValue !== null && maxOrderValue <= minOrderValue) {
      return res.status(400).json({ 
        message: 'Maximum order value must be greater than minimum order value' 
      });
    }

    // Check if product is already a free product
    const existingProduct = await FreeProductModel.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({ 
        message: 'This product is already set up as a free product' 
      });
    }

    const freeProduct = new FreeProductModel({ 
      productId, 
      minOrderValue, 
      maxOrderValue: maxOrderValue || null, 
      enabled 
    });
    
    await freeProduct.save();
    res.status(201).json(freeProduct);
  } catch (error) {
    console.error('Create free product error:', error);
    res.status(500).json({ message: 'Error creating free product' });
  }
}

// Update a free product
export async function updateFreeProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { productId, minOrderValue, maxOrderValue, enabled } = req.body;

    // Validate min and max order values if provided
    if (minOrderValue !== undefined && minOrderValue <= 0) {
      return res.status(400).json({ message: 'Minimum order value must be greater than zero' });
    }
    
    // Only validate max value if it's actually provided and not null
    if (maxOrderValue !== null && maxOrderValue !== undefined && minOrderValue !== undefined && maxOrderValue < minOrderValue) {
      return res.status(400).json({ 
        message: 'Maximum order value must be greater than minimum order value' 
      });
    }

    // Check if the product is already a free product (for a different entry) only if productId is provided
    if (productId) {
      const existingProduct = await FreeProductModel.findOne({ 
        productId,
        _id: { $ne: id } // Exclude the current product being updated
      });
      
      if (existingProduct) {
        return res.status(400).json({ 
          message: 'This product is already set up as a free product in another entry' 
        });
      }
    }

    const updateData: any = {};
    // Only update fields that are explicitly provided
    if (productId !== undefined) updateData.productId = productId;
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue;
    if (maxOrderValue !== undefined) updateData.maxOrderValue = maxOrderValue || null;
    if (enabled !== undefined) updateData.enabled = enabled;

    const freeProduct = await FreeProductModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!freeProduct) {
      return res.status(404).json({ message: 'Free product not found' });
    }
    
    res.json(freeProduct);
  } catch (error) {
    console.error('Update free product error:', error);
    res.status(500).json({ message: 'Error updating free product' });
  }
}

// Delete a free product
export async function deleteFreeProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const freeProduct = await FreeProductModel.findByIdAndDelete(id);
    if (!freeProduct) {
      return res.status(404).json({ message: 'Free product not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete free product error:', error);
    res.status(500).json({ message: 'Error deleting free product' });
  }
}
