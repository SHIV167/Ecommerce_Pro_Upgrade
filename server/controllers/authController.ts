import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../models/User';

type CookieOptions = {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict' | boolean;
  maxAge?: number;
  domain?: string;
};

/**
 * Get cookie options based on the current environment
 */
function getCookieOptions(req: Request, options: { maxAge?: number } = {}): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = getCookieDomain(req);
  
  const cookieOptions: CookieOptions = {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
  
  if (options.maxAge !== undefined) {
    cookieOptions.maxAge = options.maxAge;
  }
  
  if (domain) {
    cookieOptions.domain = domain;
  }
  
  return cookieOptions;
}

// Helper to get cookie domain
function getCookieDomain(req: Request): string | undefined {
  // If running in development or test environment, don't set domain
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }
  
  // For production, use the COOKIE_DOMAIN environment variable if set
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  if (COOKIE_DOMAIN) return COOKIE_DOMAIN;
  
  // Otherwise, try to derive from hostname
  const hostname = req.hostname;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return undefined;
  }
  
  // For production, use the root domain
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  
  return undefined;
}

// Admin Login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt received with body:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the admin user by email
    console.log('Searching for user with email:', email);
    const admin = await UserModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    console.log('User found, checking admin status:', admin.isAdmin);
    if (!admin.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    // Verify password
    console.log('Verifying password');
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    console.log('Generating JWT token');
    const token = jwt.sign(
      { id: admin._id, isAdmin: admin.isAdmin, email: admin.email },
      (process.env.JWT_SECRET as Secret) || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // Set token as cookie
    console.log('Setting token cookie');
    const cookieOptions = getCookieOptions(req, {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('token', token, cookieOptions);

    // Return user data (excluding password)
    console.log('Returning user data');
    const { password: _, ...userWithoutPassword } = admin.toObject();
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Admin login error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Server error during login', error: error.message });
    }
    return res.status(500).json({ message: 'Server error during login', error: 'Unknown error' });
  }
};

// Admin Logout
export const adminLogout = (req: Request, res: Response) => {
  const clearOptions = getCookieOptions(req);
  res.clearCookie('token', clearOptions);
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Verify Admin Token
export const verifyAdminToken = (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated', isAuthenticated: false });
    }

    const decoded = jwt.verify(token, (process.env.JWT_SECRET as Secret) || 'default_secret');
    return res.status(200).json({ 
      message: 'Authenticated', 
      isAuthenticated: true, 
      user: decoded 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    const clearOptions = getCookieOptions(req);
    res.clearCookie('token', clearOptions);
    return res.status(401).json({ message: 'Invalid token', isAuthenticated: false });
  }
};
