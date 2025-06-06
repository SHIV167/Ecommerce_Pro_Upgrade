import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';

// Validate and trim Razorpay credentials
const key_id = process.env.RAZORPAY_KEY_ID?.trim();
const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
if (!key_id || !key_secret) {
  throw new Error('Razorpay credentials not set. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}
const razorpay = new Razorpay({ key_id, key_secret });

export default razorpay;
