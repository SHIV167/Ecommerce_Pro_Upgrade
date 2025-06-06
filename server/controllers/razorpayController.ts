import { Request, Response } from 'express';
import razorpay from '../utils/razorpay';
import { v4 as uuidv4 } from 'uuid';

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;
    const receipt = uuidv4();
    const options: any = { amount, currency, receipt, payment_capture: 1 };
    // Create order via Razorpay SDK
    const order = await razorpay.orders.create(options);
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ message: 'Error creating razorpay order', error: error.message });
  }
};
