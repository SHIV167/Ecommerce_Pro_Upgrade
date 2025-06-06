import { Request, Response } from 'express';
import razorpay from '../utils/razorpay';

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;
    const options: any = { amount, currency };
    // Create order via Razorpay SDK
    const order = await razorpay.orders.create(options);
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ message: 'Error creating razorpay order', error: error.message });
  }
};
