// Script to add featuredProducts field to all categories
import mongoose from 'mongoose';
import CategoryModel from '../models/Category';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function addFeaturedProductsField() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all categories
    const categories = await CategoryModel.find({});
    console.log(`Found ${categories.length} categories`);

    // Update each category to add empty featuredProducts array if not exists
    let updated = 0;
    for (const category of categories) {
      if (!category.featuredProducts) {
        category.featuredProducts = [];
        await category.save();
        updated++;
        console.log(`Added featuredProducts to category: ${category.name}`);
      }
    }

    console.log(`Updated ${updated} categories with featuredProducts field`);
    
    // Update a specific category with a test featured product
    const testCategory = await CategoryModel.findOne({ slug: 'skin-care' });
    if (testCategory) {
      console.log('Adding test featured product to skin-care category');
      
      // Only add if not already present
      if (!testCategory.featuredProducts || testCategory.featuredProducts.length === 0) {
        testCategory.featuredProducts = [{
          productId: "test-product-id",
          title: "Test Featured Product",
          subtitle: "Test Subtitle",
          description: "This is a test featured product",
          imageUrl: "https://example.com/test.jpg",
          position: 1,
          layout: "image-right",
          variants: [{
            size: "Default",
            price: 1000,
            isDefault: true
          }],
          benefits: ["Test benefit 1", "Test benefit 2"],
          stats: [{
            percent: 95,
            text: "People saw results"
          }]
        }];
        
        await testCategory.save();
        console.log('Added test featured product successfully');
      } else {
        console.log('Category already has featured products');
      }
    }

    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
addFeaturedProductsField()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
