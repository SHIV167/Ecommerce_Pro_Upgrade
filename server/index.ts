import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import promoTimerRoutes from './routes/promoTimerRoutes';
import storeRoutes from './routes/storeRoutes';
import promoMessageRoutes from './routes/promomessageRoutes';
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, closeDatabaseConnection } from "./db";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import SettingModel from './models/Setting';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from public/uploads directory
app.use('/uploads', express.static('public/uploads'));

const allowedOriginsEnv = process.env.CORS_ORIGINS;
if (!allowedOriginsEnv) {
  console.warn('CORS_ORIGINS environment variable is not set. Defaulting to localhost:3000');
}

// Parse allowed origins from environment variable
const allowedOrigins = allowedOriginsEnv 
  ? [...new Set(allowedOriginsEnv.split(',').map(s => s.trim()))]
  : []; // If CORS_ORIGINS not set, allow any origin by default in origin callback

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
      // If no specific allowed origins env, allow all origins
      if (!allowedOriginsEnv) return callback(null, true);
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Allowing all origins in development');
      return callback(null, true);
    }
    
    // Normalize the origin by removing protocol and trailing slashes
    const normalizeOrigin = (url: string) => {
      return url
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/\/*$/, ''); // Remove trailing slashes
    };
    
    const normalizedOrigin = normalizeOrigin(origin);
    
    // Check if origin is in the allowed list
    const isAllowed = allowedOrigins.some((allowedOrigin: string) => {
      const normalizedAllowed = normalizeOrigin(allowedOrigin);
      return normalizedOrigin === normalizedAllowed || 
             normalizedOrigin.endsWith(`.${normalizedAllowed}`);
    });
    
    if (isAllowed) {
      console.log('CORS allowed for origin:', origin);
      return callback(null, true);
    }
    
    console.log('CORS blocked for origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 600 // Cache preflight request for 10 minutes
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Add CORS headers to all responses
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some((allowed: string) => origin.endsWith(allowed.replace(/^https?:\/\//, '')))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.url;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  // @ts-ignore - We need to override the json method
  res.json = function(bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    // @ts-ignore - Apply with arguments
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // @ts-ignore - Express types are incomplete
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      // @ts-ignore - Express types are incomplete
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let dbConnected = false;
  
  // Connect to MongoDB but continue even if it fails
  try {
    const connection = await connectToDatabase();
    if (connection) {
      log('MongoDB connected successfully', 'mongodb');
      dbConnected = true;
    } else {
      log('MongoDB connection failed but continuing with limited functionality', 'mongodb');
    }
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    // Continue even without MongoDB
  }
  // Initialize demo data regardless of database connection
  try {
    const { initDemoData } = await import('./initData');
    await initDemoData();
  } catch (error) {
    log(`Error initializing demo data: ${error}`, 'initData');
  }
  
  // Add a health check route
  app.get('/api/health', (req, res) => {
    // @ts-ignore - Express types are incomplete
    res.status(200).json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  });

  // Add test endpoint for CORS and auth testing
  app.get('/api/test/auth', (req: Request, res: Response) => {
    console.log('Test endpoint hit, cookies:', req.cookies);
    
    // Check if user is authenticated
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'No token provided' 
      });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      return res.status(200).json({ 
        authenticated: true, 
        user: decoded,
        cookies: req.cookies,
        headers: req.headers
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Invalid token',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.use('/api/promotimers', promoTimerRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/promomessages', promoMessageRoutes);

  // Migration: ensure existing settings have taxEnabled and taxPercentage
  try {
    await SettingModel.updateMany(
      { taxEnabled: { $exists: false } },
      { $set: { taxEnabled: false, taxPercentage: 0 } }
    );
    log('[MIGRATION] Added taxEnabled/taxPercentage to existing settings', 'migration');
  } catch (e) {
    console.error('[MIGRATION] error updating settings tax fields:', e);
  }

  // Register API routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // @ts-ignore - Express types are incomplete
    res.status(status).json({ message });
    console.error(err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log('NODE_ENV=', process.env.NODE_ENV, 'express env=', app.get('env'));

  if (process.env.NODE_ENV === "development") {
    try {
      await setupVite(app, server);
      log('Vite dev server initialized successfully', 'vite');
    } catch (error) {
      console.error('Failed to initialize Vite dev server:', error);
    }
  } else {
    serveStatic(app);
  }

  // Serve the app on the port provided by the environment (Render requires dynamic port binding) or fallback to 5000
  const port = parseInt(process.env.PORT as string, 10) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running at http://localhost:${port}`, 'express');
    log('Frontend available at http://localhost:5000', 'express');
    log('Admin panel available at http://localhost:5000/admin', 'express');
  });
})();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process running but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running but log the error
});