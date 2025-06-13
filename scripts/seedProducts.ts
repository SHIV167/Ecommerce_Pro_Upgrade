import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../server/models/Product';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/newecom';

const sampleProducts = [
  {
    name: "Organic Sunscreen SPF 50",
    sku: "SUN-001",
    description: "A natural, organic sunscreen with SPF 50 protection.",
    shortDescription: "Protect your skin naturally with our organic sunscreen.",
    price: 499,
    stock: 100,
    categoryId: "64b7f5e2c8b7f5e2c8b7f5e2",
    featured: true,
    bestseller: true,
    isNew: true,
    textSliderItems: [
      {
        text: "Clinically Tested SPF 50",
        duration: 3
      },
      {
        text: "100% Natural Ingredients",
        duration: 3
      },
      {
        text: "Water Resistant Formula",
        duration: 3
      }
    ],
    images: [
      "/uploads/products/sunscreen-1.jpg",
      "/uploads/products/sunscreen-2.jpg"
    ]
  },
  {
    name: "Organic Face Serum",
    sku: "SER-001",
    description: "A rejuvenating face serum made with organic ingredients.",
    shortDescription: "Nourish your skin with our organic face serum.",
    price: 999,
    stock: 50,
    categoryId: "64b7f5e2c8b7f5e2c8b7f5e3",
    textSliderItems: [
      {
        text: "Anti-Aging Formula",
        duration: 3
      },
      {
        text: "Vitamin C Rich",
        duration: 3
      },
      {
        text: "Glow-Boosting",
        duration: 3
      }
    ],
    images: [
      "/uploads/products/serum-1.jpg",
      "/uploads/products/serum-2.jpg"
    ]
  },
  {
    name: "Organic Body Lotion",
    sku: "LOT-001",
    description: "A hydrating body lotion made with natural ingredients.",
    shortDescription: "Moisturize your skin naturally with our organic lotion.",
    price: 299,
    stock: 150,
    categoryId: "64b7f5e2c8b7f5e2c8b7f5e4",
    textSliderItems: [
      {
        text: "24hr Hydration",
        duration: 3
      },
      {
        text: "Non-Greasy Formula",
        duration: 3
      },
      {
        text: "Natural Fragrance",
        duration: 3
      }
    ],
    images: [
      "/uploads/products/lotion-1.jpg",
      "/uploads/products/lotion-2.jpg"
    ]
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} products`);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedProducts();
