import { Request, Response } from 'express';
import mongoose from 'mongoose';
import NewsletterSubscriber from '../models/NewsletterSubscriber';

// Subscribe to newsletter
export async function subscribeNewsletter(req: Request, res: Response) {
  try {
    // Check database connection
    if (!mongoose.connection.readyState) {
      console.warn('MongoDB not connected');
      return res.status(503).json({ 
        success: false,
        message: 'Database connection unavailable'
      });
    }

    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Check if email already exists
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({ 
        success: true,
        message: 'Already subscribed' 
      });
    }

    // Create new subscription
    const subscription = await NewsletterSubscriber.create({
      email,
      subscribedAt: new Date(),
    });

    // Send thank-you email
    import('../utils/mailer').then(({ sendMail }) => {
      sendMail({
        to: email,
        subject: 'Thank you for subscribing!',
        html: '<p>Thanks for subscribing to our newsletter!</p>'
      }).catch(err => console.error('Email send error:', err));
    });

    return res.status(201).json({ 
      success: true,
      message: 'Subscribed successfully', 
      subscription: subscription.toObject() 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get all newsletter subscribers
export async function getNewsletterSubscribers(req: Request, res: Response) {
  try {
    // Check database connection
    if (!mongoose.connection.readyState) {
      console.warn('MongoDB not connected');
      return res.status(503).json({ 
        success: false,
        message: 'Database connection unavailable',
        data: []
      });
    }

    const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
    // Convert to plain objects to avoid serialization issues
    const plainSubscribers = subscribers.map(sub => sub.toObject());

    return res.json({
      success: true,
      data: plainSubscribers
    });
  } catch (error) {
    console.error('Get newsletter subscribers error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    });
  }
}
