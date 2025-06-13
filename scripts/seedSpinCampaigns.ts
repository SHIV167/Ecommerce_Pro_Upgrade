import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SpinCampaign from '../server/models/SpinCampaign';

dotenv.config();

// Change this to your MongoDB URI if needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Remove old campaigns
  await SpinCampaign.deleteMany({});
  console.log('Cleared SpinCampaigns');

  const campaigns = [
    {
      name: 'Summer Fest',
      description: 'Win cool summer prizes!',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7d
      maxSpinsPerUser: 3,
      prizes: [
        { title: '10% OFF Coupon', weight: 50, prizeType: 'coupon', payload: 'SUMMER10', quantity: 100 },
        { title: 'Free Mug',     weight: 30, prizeType: 'product', payload: 'mug-product-id', quantity: 10 },
        { title: '$5 Credit',    weight: 20, prizeType: 'credit', payload: '5', quantity: -1 },
      ],
    },
    {
      name: 'Holiday Spin',
      description: 'Holiday season giveaways',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14d
      maxSpinsPerUser: 1,
      prizes: [
        { title: '20% OFF',    weight: 40, prizeType: 'coupon', payload: 'HOLIDAY20', quantity: 50 },
        { title: 'Notebook',   weight: 40, prizeType: 'product', payload: 'notebook-id', quantity: 25 },
        { title: '$10 Credit', weight: 20, prizeType: 'credit', payload: '10', quantity: -1 },
      ],
    },
  ];

  for (const c of campaigns) {
    const doc = new SpinCampaign(c);
    await doc.save();
    console.log(`Created campaign: ${doc.name} (${doc._id})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
