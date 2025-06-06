import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import SettingModel from '../models/Setting';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    // fetch Razorpay credentials from DB settings
    const settings = await SettingModel.findOne();
    if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
      return res.status(500).json({ message: 'Razorpay credentials not set in settings' });
    }
    // create SDK instance with dynamic credentials
    const razorpay = new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret });
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

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const settings = await SettingModel.findOne();
    if (!settings?.razorpayKeySecret) {
      return res.status(500).json({ message: 'Razorpay secret not set in settings' });
    }
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const generatedSignature = crypto
      .createHmac('sha256', settings.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (generatedSignature === razorpay_signature) {
      return res.json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, message: 'Invalid signature' });
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};
