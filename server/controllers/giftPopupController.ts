import { Request, Response } from 'express';
import GiftPopup from '../models/GiftPopup';
import Product from '../models/Product';

// Get current gift popup configuration
export const getGiftPopupConfig = async (req: Request, res: Response) => {
  // Set proper content type header
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    console.log('Fetching gift popup configuration...');
    
    // Find or create default configuration if it doesn't exist
    let config = await GiftPopup.findOne({});
    console.log('Existing config found:', config ? 'Yes' : 'No');
    
    if (!config) {
      console.log('Creating default gift popup configuration...');
      const defaultConfig = {
        title: 'Claim Your Complimentary Gift',
        subTitle: 'Choose Any 2',
        active: false,
        minCartValue: 1000,
        maxCartValue: null,
        maxSelectableGifts: 2,
        giftProducts: []
      };
      
      config = await GiftPopup.create(defaultConfig);
      console.log('Default config created successfully');
    }
    
    return res.status(200).json(config);
  } catch (error: any) {
    console.error('Error fetching gift popup configuration:', error);
    return res.status(500).json({ 
      message: 'Error fetching gift popup configuration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update gift popup configuration
export const updateGiftPopupConfig = async (req: Request, res: Response) => {
  // Set proper content type header
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const { title, subTitle, active, minCartValue, maxCartValue, maxSelectableGifts, giftProducts } = req.body;
    
    // Validate maxSelectableGifts doesn't exceed giftProducts length
    if (maxSelectableGifts > giftProducts.length && giftProducts.length > 0) {
      return res.status(400).json({ 
        message: `Maximum selectable gifts (${maxSelectableGifts}) cannot exceed the number of available gift products (${giftProducts.length})` 
      });
    }
    
    // Find or create default configuration if it doesn't exist
    let config = await GiftPopup.findOne({});
    
    if (!config) {
      config = await GiftPopup.create({
        title,
        subTitle,
        active,
        minCartValue,
        maxCartValue,
        maxSelectableGifts,
        giftProducts
      });
    } else {
      config = await GiftPopup.findOneAndUpdate(
        {},
        {
          title,
          subTitle,
          active,
          minCartValue,
          maxCartValue,
          maxSelectableGifts,
          giftProducts
        },
        { new: true }
      );
    }
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error updating gift popup configuration:', error);
    return res.status(500).json({ message: 'Error updating gift popup configuration' });
  }
};

// Get available gift products with details
export const getGiftProducts = async (req: Request, res: Response) => {
  // Set proper content type header
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    console.log('Fetching gift products...');
    
    // Get all products first for admin interface
    if (req.path.includes('/admin/gift-products') || req.originalUrl.includes('/admin/gift-products')) {
      console.log('Fetching all products for admin interface');
      const allProducts = await Product.find({}).select('_id name price images');
      return res.status(200).json(allProducts);
    }
    
    // For frontend, get only configured gift products
    const config = await GiftPopup.findOne({});
    
    if (!config) {
      console.log('No gift popup configuration found');
      return res.status(404).json({ message: 'Gift popup configuration not found' });
    }
    
    // If no gift products configured, return empty array
    if (!config.giftProducts || config.giftProducts.length === 0) {
      console.log('No gift products configured');
      return res.status(200).json([]);
    }
    
    console.log(`Fetching details for ${config.giftProducts.length} gift products`);
    
    // Get product details for all gift products
    const productDetails = await Product.find({
      _id: { $in: config.giftProducts }
    }).select('_id name price images description');
    
    console.log(`Found ${productDetails.length} gift products`);
    return res.status(200).json(productDetails);
  } catch (error: any) {
    console.error('Error fetching gift products:', error);
    return res.status(500).json({ 
      message: 'Error fetching gift products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
