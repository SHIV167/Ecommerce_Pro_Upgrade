import { createServer, type Server } from "http";
import express, { Application, Request, Response, NextFunction } from "express";
import { MongoDBStorage } from "./storage/MongoDBStorage";
const storage = new MongoDBStorage();
import UserModel from "./models/User";
import SettingModel from "./models/Setting";
import ContactModel from "./models/Contact";
import OrderModel from "./models/Order"; // Import OrderModel
import ProductModel from "./models/Product"; // Import ProductModel
import BannerModel from "./models/Banner"; // Import BannerModel
import ScannerModel from "./models/Scanner"; // Import ScannerModel
import TestimonialModel from "./models/Testimonial"; // Import TestimonialModel for seeding
import FreeProductModel from "./models/FreeProduct"; // Import FreeProductModel



import { v4 as uuidv4 } from "uuid"; // Import uuid
import { z } from "zod";
import { CartItem, Product } from "../shared/schema";
import { categorySchema, collectionSchema, productSchema } from "@shared/schema";

type InsertProduct = Omit<Product, 'id' | '_id' | 'createdAt'>;
import { sendMail } from "./utils/mailer";
import upload from "./utils/upload";
import crypto from "crypto";
import { getServiceability, createShipment, cancelShipment, trackShipment } from "./utils/shiprocket";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { getSettings, updateSettings } from './controllers/settingController';
import { subscribeNewsletter, getNewsletterSubscribers } from "./controllers/newsletterController";
import { getGiftPopupConfig, updateGiftPopupConfig, getGiftProducts } from "./controllers/giftPopupController";
import { getPopupSetting, updatePopupSetting } from './controllers/popupSettingController';
import { backupDatabase } from "./controllers/backupController";
import { getAllUsers, updateUser, deleteUser } from './controllers/userController';
import { getOrders, updateOrder, createOrder } from './controllers/orderController';
import { createRazorpayOrder } from './controllers/razorpayController';
import fs from "fs";
import path, { dirname } from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import PDFDocument from 'pdfkit';
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

// Derive cookie domain: use explicit COOKIE_DOMAIN or fallback to root domain in production
function getCookieDomain(req: Request): string | undefined {
  if (COOKIE_DOMAIN) return COOKIE_DOMAIN;
  if (process.env.NODE_ENV === 'production') {
    const parts = req.hostname.split('.');
    const root = parts.slice(-2).join('.');
    return `.${root}`;
  }
  return undefined;
}

const cartItemInsertSchema = z.object({
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().min(1),
  isFree: z.boolean().optional()
});

// Order input validation
const orderInsertSchema = z.object({
  userId: z.string(),
  status: z.string(),
  totalAmount: z.number(),
  shippingAddress: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  couponCode: z.string().nullable().optional(),
  discountAmount: z.number().optional().default(0),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPincode: z.string().optional(),
  shippingIsBilling: z.boolean().optional(),
  billingCustomerName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPincode: z.string().optional(),
  billingEmail: z.string().optional(),
  billingPhone: z.string().optional(),
});
const orderItemInsertSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  price: z.number(),
});

// Payload schema: nested order and items
const orderPayloadSchema = z.object({
  order: orderInsertSchema,
  items: z.array(orderItemInsertSchema),
});

// Banner input validation schema
const bannerObjectSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  alt: z.string(),
  enabled: z.boolean(),
  position: z.number(),
  desktopImageUrl: z.string().url().optional(),
  mobileImageUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional()
});
const bannerSchema = bannerObjectSchema
  .refine(data => !!(data.desktopImageUrl || data.imageUrl), {
    message: 'desktopImageUrl or imageUrl is required', path: ['desktopImageUrl']
  })
  .refine(data => !!(data.mobileImageUrl || data.imageUrl), {
    message: 'mobileImageUrl or imageUrl is required', path: ['mobileImageUrl']
  });
const bannerUpdateSchema = bannerObjectSchema.partial();

// Import routes
import couponRoutes from './routes/couponRoutes';
import giftCardRoutes from './routes/giftCardRoutes';
import giftCardTemplateRoutes from './routes/giftCardTemplateRoutes';
import giftPopupRoutes from './routes/giftPopupRoutes'; // Import gift popup routes
import authRoutes from './routes/authRoutes'; // Import auth routes
import scannerRoutes from './routes/scannerRoutes'; // Import scanner routes
import testimonialRoutes from './routes/testimonialRoutes'; // Import testimonial routes
import freeProductRoutes from './routes/freeProductRoutes'; // Import freeProduct routes
import reviewRoutes from './routes/reviewRoutes'; // Import review routes
import cartRoutes from './routes/cartRoutes'; // Import cart routes
import bannerRoutes from './routes/bannerRoutes.new'; // Add banner routes
import categoryRoutes from './routes/categoryRoutes';
import uploadRoutes from './routes/uploadRoutes';
import blogRoutes from './routes/blogRoutes';
import featuredProductRoutes from './routes/featuredProductRoutes'; // Import optimized featured product routes

// Import controllers for coupons


export async function registerRoutes(app: Application): Promise<Server> {
  // Enable JSON and URL-encoded body parsing for incoming requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Mount admin API routers
  app.use('/api', authRoutes);
  app.use('/api', blogRoutes);
  app.use('/api', couponRoutes);
  app.use('/api', giftCardRoutes);
  app.use('/api', bannerRoutes); // Add banner routes
  app.use('/api', giftCardTemplateRoutes);
  app.use('/api', giftPopupRoutes); // Add gift popup routes
  app.use('/api', scannerRoutes);
  app.use('/api', testimonialRoutes);
  app.use('/api', freeProductRoutes);
  app.use('/api', reviewRoutes); // Add review routes
  app.use('/api', cartRoutes); // Add cart routes
  app.use('/api', featuredProductRoutes); // Add optimized featured product routes
  // Order routes
  app.get('/api/orders', getOrders);
  app.post('/api/orders', createOrder);
  app.put('/api/orders/:id', updateOrder);
  app.use('/api', categoryRoutes);
  // User management routes
  app.get('/api/users', getAllUsers);
  app.put('/api/users/:id', updateUser);
  app.delete('/api/users/:id', deleteUser);
  // Settings endpoints
  app.get('/api/admin/settings', getSettings);
  app.put('/api/admin/settings', updateSettings);
  // Database backup endpoint
  app.post('/api/admin/backup', backupDatabase);
  app.use(uploadRoutes);
  // ensure upload directory exists in public/uploads
  const uploadDir = path.join(__dirname, '../public/uploads');
  const productsDir = path.join(uploadDir, 'products');
  if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
  // serve uploaded images
  app.use('/uploads', express.static(uploadDir));
  app.use('/admin/uploads', express.static(uploadDir));

  // local storage for product image uploads
  const localStorage = multer.diskStorage({
    destination: productsDir,
    filename: (req, file, cb) => {
      console.log('[UPLOAD] Saving file:', file.originalname);
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const uploadLocal = multer({ storage: localStorage });

  // Admin image upload endpoint
  app.post('/api/admin/upload', async (req, res) => {
    // Set content type header early
    res.setHeader('Content-Type', 'application/json');

    try {
      // Handle the file upload
      await new Promise<void>((resolve, reject) => {
        uploadLocal.single('file')(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              console.error('[MULTER ERROR]:', err);
              reject(new Error(`File upload error: ${err.message}`));
            } else {
              console.error('[UPLOAD ERROR]:', err);
              reject(err);
            }
          } else {
            resolve();
          }
        });
      });

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      // Return the URL to the uploaded file
      const imageUrl = `/uploads/products/${req.file.filename}`;
      console.log('[ADMIN UPLOAD] File saved:', imageUrl);
      
      return res.status(200).json({ 
        success: true,
        imageUrl 
      });

    } catch (error) {
      console.error('[ADMIN UPLOAD] Error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to upload file', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Seed sample testimonials if none exist
  const testimonialCount = await TestimonialModel.estimatedDocumentCount();
  if (testimonialCount === 0) {
    await TestimonialModel.create([
      { name: 'Priya S.', content: 'The Kumkumadi face oil has transformed my skin.', rating: 5, featured: true },
      { name: 'Rahul M.', content: 'I was skeptical about Ayurvedic hair care but Bringadi oil has proven me wrong.', rating: 5, featured: true },
      { name: 'Anita K.', content: 'The Rose Jasmine face cleanser is gentle yet effective.', rating: 4, featured: true }
    ]);
  }

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = req.body; // add validation with Zod schema
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const hashed = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({ ...validatedData, password: hashed });
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      // Send welcome email (async)
      sendMail({
        to: userWithoutPassword.email,
        subject: "Welcome to EcommercePro!",
        html: `<p>Hi ${userWithoutPassword.name || ''}, welcome to EcommercePro!</p>`
      }).catch(err => console.error("Email send error:", err));
      
      const token = jwt.sign(
        { id: userWithoutPassword.id, isAdmin: userWithoutPassword.isAdmin },
        process.env.JWT_SECRET as Secret,
        { expiresIn: process.env.JWT_EXPIRES_IN as any }
      );
      const maxAge = Number(process.env.COOKIE_MAX_AGE) || 86400000;
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'none', maxAge, domain: getCookieDomain(req) });
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log(`Login attempt with email: ${email}`);
      
      if (!email || !password) {
        console.log("Login error: Email and password are required");
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log(`User found: ${user ? 'Yes' : 'No'}`);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log("Login error: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we would use JWT tokens
      const { password: _, ...userWithoutPassword } = user;
      
      console.log("Login successful");
      const token = jwt.sign(
        { id: userWithoutPassword.id, isAdmin: userWithoutPassword.isAdmin },
        process.env.JWT_SECRET as Secret,
        { expiresIn: process.env.JWT_EXPIRES_IN as any }
      );
      const maxAge = Number(process.env.COOKIE_MAX_AGE) || 86400000;
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'none', maxAge, domain: getCookieDomain(req) });
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Auth: logout (clear token)
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'none', domain: getCookieDomain(req) });
    return res.status(200).json({ message: 'Logged out' });
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      // Fetch user document directly from MongoDB to ensure persistence
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(200).json({ message: "If that email is registered, you will receive a password reset link" });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as Secret, { expiresIn: process.env.RESET_PASSWORD_EXPIRES_IN as any || "1h" });
      // Save token and expiry on Mongoose document
      if (!user) {
        console.error('Forgot-password: no user found for update', email);
      } else {
        user.resetPasswordToken = token;
        user.resetPasswordExpire = new Date(Date.now() + parseInt(process.env.RESET_PASSWORD_EXPIRES_IN || '3600', 10) * 1000);
        await user.save();
        console.log('Forgot-password: reset token saved for user', email);
      }
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      const html = `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. If you did not request this, ignore this email.</p>`;
      await sendMail({ to: user.email, subject: "Password Reset Request", html });
      return res.status(200).json({ message: "If that email is registered, you will receive a password reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET as Secret) as { id: string };
      } catch (err) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      const userRecord = await UserModel.findOne({
        id: payload.id,
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: new Date() },
      });
      if (!userRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      const hashed = await bcrypt.hash(password, 10);
      userRecord.password = hashed;
      userRecord.resetPasswordToken = undefined;
      userRecord.resetPasswordExpire = undefined;
      await userRecord.save();
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(400).json({ message: "Invalid or expired token" });
    }
  });

  // Popup settings endpoints
  app.get('/api/popup-settings', getPopupSetting);
  app.put('/api/popup-settings', updatePopupSetting);

  // Newsletter subscription routes
  app.post('/api/newsletter/subscribe', subscribeNewsletter);
  app.get('/api/newsletter/subscribers', getNewsletterSubscribers);

  // Collection products route
  app.get('/api/collections/:slug/products', async (req, res) => {
    try {
      const { slug } = req.params;
      const collection = await storage.getCollectionBySlug(slug);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }
      const products = await storage.getCollectionProducts(collection._id!);
      return res.status(200).json(products);
    } catch (error) {
      console.error('Get collection products error:', error);
      return res.status(500).json({ message: 'Error fetching products for collection' });
    }
  });

  // Collection routes
  app.get('/api/collections', async (req, res) => {
    try {
      const collections = await storage.getCollections();
      return res.status(200).json(collections);
    } catch (err) {
      console.error('Fetch collections error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  app.get('/api/collections/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      const col = await storage.getCollectionBySlug(slug);
      if (!col) return res.status(404).json({ message: 'Collection not found' });
      return res.status(200).json(col);
    } catch (err) {
      console.error('Fetch collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // Admin: create collection
  app.post('/api/collections', async (req, res) => {
    try {
      const newCol = collectionSchema.parse(req.body);
      const created = await storage.createCollection(newCol);
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.errors });
      }
      console.error('Create collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // Admin: update collection
  app.put('/api/collections/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const update = collectionSchema.partial().parse(req.body);
      const updated = await storage.updateCollection(id, update);
      if (!updated) return res.status(404).json({ message: 'Collection not found' });
      return res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.errors });
      }
      console.error('Update collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // Admin: delete collection
  app.delete('/api/collections/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteCollection(id);
      if (!success) return res.status(404).json({ message: 'Collection not found' });
      return res.status(204).end();
    } catch (err) {
      console.error('Delete collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Fetch products in a collection
  app.get('/api/collections/:slug/products', async (req, res) => {
    try {
      const { slug } = req.params;
      const col = await storage.getCollectionBySlug(slug);
      if (!col) return res.status(404).json({ message: 'Collection not found' });
      // use getProducts with collectionId to fetch from Mongo
      const products = await storage.getProducts({ collectionId: col._id! });
      return res.status(200).json(products);
    } catch (err) {
      console.error('Fetch collection products error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // Add product to collection
  app.post('/api/collections/:slug/products', async (req, res) => {
    try {
      const { slug } = req.params;
      const { productId } = req.body;
      const col = await storage.getCollectionBySlug(slug);
      if (!col) return res.status(404).json({ message: 'Collection not found' });
      const mapping = await storage.addProductToCollection({ productId, collectionId: col._id! });
      return res.status(201).json(mapping);
    } catch (err) {
      console.error('Add product to collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // Remove product from collection
  app.delete('/api/collections/:slug/products/:productId', async (req, res) => {
    try {
      const { slug, productId } = req.params;
      const col = await storage.getCollectionBySlug(slug);
      if (!col) return res.status(404).json({ message: 'Collection not found' });
      const removed = await storage.removeProductFromCollection(productId, col._id!);
      if (!removed) return res.status(404).json({ message: 'Mapping not found' });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Remove product from collection error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Product routes
  app.get('/api/products/featured', async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '', 10) || undefined;
      const products = await storage.getFeaturedProducts(limit);
      return res.status(200).json(products);
    } catch (error) {
      console.error('Fetch featured products error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  app.get('/api/products/bestsellers', async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '', 10) || undefined;
      const products = await storage.getBestsellerProducts(limit);
      return res.status(200).json(products);
    } catch (error) {
      console.error('Fetch bestseller products error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  app.get('/api/products/new', async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '', 10) || undefined;
      const products = await storage.getNewProducts(limit);
      return res.status(200).json(products);
    } catch (error) {
      console.error('Fetch new products error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  app.get('/api/products', async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const categoryId = req.query.categoryId as string | undefined;
      const collectionId = req.query.collectionId as string | undefined;

      // Fetch all matching products for accurate count and search
      const allProducts = await storage.getProducts({ categoryId, collectionId });
      let filteredProducts = allProducts;
      if (search) {
        const lower = search.toLowerCase();
        filteredProducts = allProducts.filter(p =>
          p.name.toLowerCase().includes(lower) ||
          (p.description?.toLowerCase().includes(lower))
        );
      }

      const totalProducts = filteredProducts.length;
      const totalPages = Math.ceil(totalProducts / limit);
      // Paginate results
      const pageProducts = filteredProducts.slice(offset, offset + limit);

      return res.status(200).json({
        products: pageProducts,
        total: totalProducts,
        page,
        totalPages,
        totalItems: totalProducts
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:idOrSlug", async (req, res, next) => {
    // Skip CSV endpoints to allow dedicated handlers
    if (req.params.idOrSlug === 'export' || req.params.idOrSlug === 'sample-csv') {
      return next();
    }
    try {
      const idOrSlug = req.params.idOrSlug;
    let product;

    // Try as MongoDB ObjectId first
    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      product = await storage.getProductById(idOrSlug);
    }

    // If not found, try as slug
    if (!product) {
      product = await storage.getProductBySlug(idOrSlug);
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
    } catch (error) {
      console.error('Fetch product detail error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Export products as CSV
  app.get('/api/products/export', async (req, res) => {
    try {
      const products = await storage.getProducts();
      const header = ['sku','name','description','shortDescription','price','discountedPrice','stock','slug','featured','bestseller','isNew','videoUrl','imageUrl','images','categoryId','_id','rating','totalReviews'].join(',');
      const rows = products.map(p => [
        p.sku || '',
        `"${(p.name || '').replace(/"/g,'"\"')}"`,
        `"${(p.description || '').replace(/"/g,'"\"')}"`,
        `"${(p.shortDescription || '').replace(/"/g,'"\"')}"`,
        p.price || 0,
        p.discountedPrice || '',
        p.stock || 0,
        p.slug || '',
        p.featured || false,
        p.bestseller || false,
        p.isNew || false,
        p.videoUrl || '',
        p.imageUrl || '',
        `"${(p.images || []).join('|')}"`,
        p.categoryId || '',
        p._id || '',
        p.rating || 0,
        p.totalReviews || 0
      ].join(',')).join('\n');
      const csv = header + '\n' + rows;
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename="products.csv"');
      res.send(csv);
    } catch (err) {
      console.error('Export error:', err);
      res.status(500).json({ message: 'Export failed' });
    }
  });

  // Sample CSV for product import
  app.get('/api/products/sample-csv', (req, res) => {
    const header = ['sku','name','description','shortDescription','price','discountedPrice','stock','slug','featured','bestseller','isNew','videoUrl','imageUrl','images','categoryId','rating','totalReviews'].join(',');
    const example = ['EXAMPLE-SKU','Example Product','A sample description','Short desc','9.99','7.99','100','example-product','false','false','true','https://example.com/video.mp4','https://example.com/image.jpg','https://example.com/image1.jpg|https://example.com/image2.jpg','60f6e5b3c7c9126b8e3c1234','4.5','10'];
    const csv = header + '\n' + example.join(',');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="sample-products.csv"');
    res.send(csv);
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const userData = req.body;
      
      // Debug: log incoming update profile call
      console.log(`[PUT] /api/users/${userId}`, userData);
       
      // In a real app, verify the user is authorized
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Product routes
  // Update product
  app.put("/api/products/:id", async (req, res) => {
    console.log('Updating product with ID:', req.params.id);
    console.log('Request body:', req.body);

    const productId = req.params.id;
    const updateData = req.body;

    // Ensure custom HTML sections are properly formatted
    if (updateData.customHtmlSections) {
      updateData.customHtmlSections = updateData.customHtmlSections.map((section: any) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        displayOrder: section.displayOrder || 0,
        enabled: section.enabled
      }));
    }

    // Parse structured ingredients if provided
    let structuredIngredients = [];
    if (updateData.structuredIngredients) {
      try {
        structuredIngredients = JSON.parse(updateData.structuredIngredients);
        console.log('Parsed structuredIngredients:', structuredIngredients);
      } catch (e) {
        console.error('Error parsing structuredIngredients:', e);
      }
    }
    
    // Parse howToUseSteps if provided
    let howToUseSteps = [];
    if (updateData.howToUseSteps) {
      try {
        howToUseSteps = JSON.parse(updateData.howToUseSteps);
        console.log('Parsed howToUseSteps:', howToUseSteps);
      } catch (e) {
        console.error('Error parsing howToUseSteps:', e);
      }
    }
    
    // Parse structuredBenefits if provided
    let structuredBenefits = [];
    if (updateData.structuredBenefits) {
      try {
        structuredBenefits = JSON.parse(updateData.structuredBenefits);
        console.log('Parsed structuredBenefits:', structuredBenefits);
      } catch (e) {
        console.error('Error parsing structuredBenefits:', e);
      }
    }
    
    // Parse customHtmlSections if provided
    let customHtmlSections = [];
    if (updateData.customHtmlSections) {
      try {
        customHtmlSections = JSON.parse(updateData.customHtmlSections);
        console.log('Parsed customHtmlSections:', customHtmlSections);
      } catch (e) {
        console.error('Error parsing customHtmlSections:', e);
      }
    }
    
    // Parse variants if provided for update
    let variants = [];
    if (updateData.variants) {
      try {
        variants = typeof updateData.variants === 'string'
          ? JSON.parse(updateData.variants)
          : updateData.variants;
        console.log('Parsed variants for update:', variants);
      } catch (e) {
        console.error('Error parsing variants for update:', e);
      }
      updateData.variants = variants;
    }

    // Update the product
    const updatedProduct = await storage.updateProduct(productId, updateData);
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  });

  app.get("/api/products", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string || "1");
      const limit = parseInt(req.query.limit as string || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const categoryId = req.query.categoryId as string | undefined;
      const collectionId = req.query.collectionId as string | undefined;

      // Fetch all matching products for accurate count and search
      const allProducts = await storage.getProducts({ categoryId, collectionId });
      let filteredProducts = allProducts;
      if (search) {
        filteredProducts = allProducts.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description?.toLowerCase().includes(search.toLowerCase()))
        );
      }

      const totalProducts = filteredProducts.length;
      const totalPages = Math.ceil(totalProducts / limit);
      // Paginate results
      const pageProducts = filteredProducts.slice(offset, offset + limit);

      return res.status(200).json({
        products: pageProducts,
        total: totalProducts,
        page,
        totalPages,
        totalItems: totalProducts
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:idOrSlug", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      let product;

      // Try as MongoDB ObjectId first
      if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
        product = await storage.getProductById(idOrSlug);
      }

      // If not found, try as slug
      if (!product) {
        product = await storage.getProductBySlug(idOrSlug);
      }

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create product with multiple images (robust handling for images and type conversion)
  app.post("/api/products", uploadLocal.array('images', 5), async (req, res) => {
    console.log('[PRODUCT CREATE] Incoming request:', {
      body: req.body,
      files: req.files,
      headers: req.headers
    });
    
    // Debug specifically for custom HTML sections
    console.log('[DEBUG] Custom HTML Sections data:', {
      customHtmlSections: req.body.customHtmlSections,
      product: req.body.product ? JSON.parse(req.body.product).customHtmlSections : undefined
    });
    try {
      const productData = req.body;
      const files = req.files as Express.Multer.File[];
      // New uploaded images
      const newImages = files && files.length > 0 ? files.map(f => `/uploads/${f.filename}`) : [];
      // Parse existingImages from form (can be string or array)
      let existingImages: string[] = [];
      if (productData.existingImages) {
        if (Array.isArray(productData.existingImages)) {
          existingImages = productData.existingImages;
        } else if (typeof productData.existingImages === 'string') {
          existingImages = productData.existingImages.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      // Final images array: merge existing + new
      const images = [...existingImages, ...newImages];
      // Always set imageUrl to first image (if any)
      const imageUrl = images.length > 0 ? images[0] : undefined;
      // Convert types as needed
      const price = productData.price ? Number(productData.price) : undefined;
      const stock = productData.stock ? Number(productData.stock) : undefined;
      const discountedPrice = productData.discountedPrice ? Number(productData.discountedPrice) : undefined;
      if (!productData.name || price === undefined || !productData.slug) {
        console.error('[PRODUCT CREATE ERROR] Missing required fields:', { name: productData.name, price, slug: productData.slug });
        return res.status(400).json({ error: "Missing required fields" });
      }
      const existingProduct = await storage.getProductBySlug(productData.slug);
      if (existingProduct) {
        console.error('[PRODUCT CREATE ERROR] Duplicate slug:', productData.slug);
        return res.status(400).json({ error: "Product with this slug already exists" });
      }
      // Parse FAQs if provided
      let faqs = [];
      if (productData.faqs) {
        try {
          faqs = JSON.parse(productData.faqs);
        } catch (e) {
          console.error('Error parsing FAQs:', e);
        }
      }
      
      // Parse structured ingredients if provided
      let structuredIngredients = [];
      if (productData.structuredIngredients) {
        try {
          structuredIngredients = JSON.parse(productData.structuredIngredients);
          console.log('Parsed structuredIngredients:', structuredIngredients);
        } catch (e) {
          console.error('Error parsing structuredIngredients:', e);
        }
      }
      
      // Parse howToUseSteps if provided
      let howToUseSteps = [];
      if (productData.howToUseSteps) {
        try {
          howToUseSteps = JSON.parse(productData.howToUseSteps);
          console.log('Parsed howToUseSteps:', howToUseSteps);
        } catch (e) {
          console.error('Error parsing howToUseSteps:', e);
        }
      }
      
      // Parse customHtmlSections if provided
      let customHtmlSections = [];
      if (productData.customHtmlSections) {
        try {
          customHtmlSections = JSON.parse(productData.customHtmlSections);
          console.log('Parsed customHtmlSections:', customHtmlSections);
        } catch (e) {
          console.error('Error parsing customHtmlSections:', e);
        }
      }

      // Parse structuredBenefits if provided
      let structuredBenefits = [];
      if (productData.structuredBenefits) {
        try {
          structuredBenefits = JSON.parse(productData.structuredBenefits);
          console.log('Parsed structuredBenefits:', structuredBenefits);
        } catch (e) {
          console.error('Error parsing structuredBenefits:', e);
        }
      }

      // Parse variants if provided
      let variants = [];
      if (productData.variants) {
        try {
          variants = typeof productData.variants === 'string'
            ? JSON.parse(productData.variants)
            : productData.variants;
          console.log('Parsed variants:', variants);
        } catch (e) {
          console.error('Error parsing variants:', e);
        }
      }

      const newProduct = await storage.createProduct({
        ...productData,
        price,
        stock,
        discountedPrice,
        images,
        imageUrl,
        faqs,
        structuredIngredients,
        howToUseSteps,
        howToUse: productData.howToUse || '',
        howToUseVideo: productData.howToUseVideo || '',
        structuredBenefits,
        benefits: productData.benefits || '',
        customHtmlSections,
        variants
      });
      console.log('[PRODUCT CREATE] Success:', newProduct);
      return res.status(201).json(newProduct);
    } catch (error) {
      console.error('[PRODUCT CREATE ERROR]:', error);
      return res.status(500).json({ error: "Failed to create product", details: error instanceof Error ? error.message : error });
    }
  });

  // Update product with multiple images (MERGE EXISTING/NEW IMAGES)
  app.put("/api/products/:id", uploadLocal.array('images', 5), async (req, res) => {
    console.log('[PRODUCT UPDATE] Incoming request:', {
      params: req.params,
      body: {
        ...req.body,
        howToUse: req.body.howToUse,
        howToUseVideo: req.body.howToUseVideo,
        howToUseSteps: req.body.howToUseSteps,
        customHtmlSections: req.body.customHtmlSections
      },
      files: req.files,
      headers: req.headers
    });
    
    // Debug specifically for custom HTML sections
    console.log('[DEBUG] Custom HTML Sections update data:', {
      customHtmlSections: req.body.customHtmlSections,
      product: req.body.product ? JSON.parse(req.body.product).customHtmlSections : undefined
    });
    
    // Debug log specifically for howToUse data
    console.log('[DEBUG] HOW TO USE DATA:', {
      howToUse: req.body.howToUse,
      howToUseVideo: req.body.howToUseVideo,
      howToUseSteps: req.body.howToUseSteps
    });
    try {
      const productId = req.params.id;
      const productData = req.body;
      const files = req.files as Express.Multer.File[];
      // Parse existingImages from form (can be string or array)
      let existingImages: string[] = [];
      if (productData.existingImages) {
        if (Array.isArray(productData.existingImages)) {
          existingImages = productData.existingImages;
        } else if (typeof productData.existingImages === 'string') {
          existingImages = productData.existingImages.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      // New uploaded images with correct path
      const newImages = files && files.length > 0 ? files.map(f => `/uploads/products/${f.filename}`) : [];
      
      // Clean existing images to ensure they have correct path
      const cleanExistingImages = existingImages.map(img => {
        if (img.startsWith('/uploads/products/')) return img;
        const filename = img.split('/').pop();
        return `/uploads/products/${filename}`;
      });
      
      // Final images array: merge cleaned existing + new
      const images = [...cleanExistingImages, ...newImages];
      
      // Always set imageUrl to first image in the array
      const imageUrl = images.length > 0 ? images[0] : undefined;
      
      console.log('[DEBUG] Image paths:', {
        existingImages,
        cleanExistingImages,
        newImages,
        finalImages: images,
        imageUrl
      });
      const existingProduct = await storage.getProductById(productId);
      if (!existingProduct) {
        console.error('[PRODUCT UPDATE ERROR] Product not found:', productId);
        return res.status(404).json({ error: "Product not found" });
      }
      // Parse FAQs if provided
      let faqs = [];
      if (productData.faqs) {
        try {
          faqs = JSON.parse(productData.faqs);
        } catch (e) {
          console.error('Error parsing FAQs:', e);
        }
      }
      
      // Parse structured ingredients if provided
      let structuredIngredients = [];
      if (productData.structuredIngredients) {
        try {
          structuredIngredients = JSON.parse(productData.structuredIngredients);
          console.log('Parsed structuredIngredients:', structuredIngredients);
        } catch (e) {
          console.error('Error parsing structuredIngredients:', e);
        }
      }
      
      // Parse howToUseSteps if provided
      let howToUseSteps = [];
      if (productData.howToUseSteps) {
        try {
          howToUseSteps = JSON.parse(productData.howToUseSteps);
          console.log('Parsed howToUseSteps:', howToUseSteps);
        } catch (e) {
          console.error('Error parsing howToUseSteps:', e);
        }
      }
      
      // Parse structuredBenefits if provided
      let structuredBenefits = [];
      if (productData.structuredBenefits) {
        try {
          structuredBenefits = JSON.parse(productData.structuredBenefits);
          console.log('Parsed structuredBenefits:', structuredBenefits);
        } catch (e) {
          console.error('Error parsing structuredBenefits:', e);
        }
      }
      
      // Parse customHtmlSections if provided
      let customHtmlSections = [];
      if (productData.customHtmlSections) {
        try {
          customHtmlSections = JSON.parse(productData.customHtmlSections);
          console.log('Parsed customHtmlSections:', customHtmlSections);
        } catch (e) {
          console.error('Error parsing customHtmlSections:', e);
        }
      }

      // Parse variants if provided for update
      let variants = [];
      if (productData.variants) {
        try {
          variants = typeof productData.variants === 'string'
            ? JSON.parse(productData.variants)
            : productData.variants;
          console.log('Parsed variants for update:', variants);
        } catch (e) {
          console.error('Error parsing variants for update:', e);
        }
        productData.variants = variants;
      }

      // Log the extracted data before creating the final update object
      console.log('[DEBUG] Extracted data for update:', {
        howToUseSteps,
        howToUse: productData.howToUse || '',
        howToUseVideo: productData.howToUseVideo || '',
        structuredBenefits,
        benefits: productData.benefits || ''
      });
      
      // Always set imageUrl to first image in the array
      const finalImages = [...existingImages, ...newImages].filter(Boolean);
      const finalImageUrl = finalImages.length > 0 ? finalImages[0] : undefined;
      
      const updateData = { 
        ...productData, 
        images: finalImages,
        imageUrl: finalImageUrl, // Set primary thumbnail to first image
        faqs, 
        structuredIngredients,
        howToUseSteps,
        howToUse: productData.howToUse || '',
        howToUseVideo: productData.howToUseVideo || '',
        structuredBenefits,
        benefits: productData.benefits || '',
        customHtmlSections,
        variants
      };
      
      // Log the final update data object before saving to DB
      console.log('[DEBUG] Final update data:', {
        howToUseSteps: updateData.howToUseSteps,
        howToUse: updateData.howToUse,
        howToUseVideo: updateData.howToUseVideo
      });
      const updatedProduct = await storage.updateProduct(productId, updateData);
      console.log('[PRODUCT UPDATE] Success:', updatedProduct);
      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('[PRODUCT UPDATE ERROR]:', error);
      return res.status(500).json({ error: "Failed to update product", details: error instanceof Error ? error.message : error });
    }
  });

  // Product-Collection routes
  app.get("/api/product-collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      return res.status(200).json(collections);
    } catch (error) {
      console.error('[COLLECTIONS ERROR]:', error);
      return res.status(500).json({ error: "Failed to fetch product collections" });
    }
  });

  // Razorpay order creation endpoint
  app.post('/api/razorpay/order', createRazorpayOrder);

  // Create and return HTTP server
  return createServer(app);
}