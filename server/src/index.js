import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { serveStoredMedia } from './controllers/upload.controller.js';
import errorHandler, { AppError } from './middleware/errorHandler.js';

const app = express();

// Trust proxy (for Render / reverse proxies)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection & XSS
app.use(mongoSanitize());
app.use(xss());

// Media streaming options with complete cross-origin & byte-range support
const staticMediaOptions = {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
};

// Serve uploaded media files before compression() so video byte-range headers are never altered
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), staticMediaOptions));
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads'), staticMediaOptions));
app.all('/uploads/:folder/:filename', async (req, res, next) => {
  try {
    await connectDB();
    return serveStoredMedia(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Response compression (completely skip all media and video streams to guarantee range requests succeed)
app.use(
  compression({
    filter: (req, res) => {
      if (
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/api/v1/media') ||
        req.originalUrl.includes('/videos/') ||
        req.originalUrl.includes('/media/') ||
        req.originalUrl.includes('/uploads/')
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'AIVORA API Server',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Ensure MongoDB connection is established before handling API requests (serverless-ready)
app.use('/api/v1', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// API v1 Routes
app.use('/api/v1', routes);

// Serve built React frontend (client/dist) on Render and spa-index.html for SPA route reloads on Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateDistDirs = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDistDir = candidateDistDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
const spaFallbackFile = path.join(__dirname, 'spa-index.html');
const serverAssetsDir = path.join(__dirname, 'assets');

// Serve static assets from both server/src/assets and client/dist/assets
if (fs.existsSync(serverAssetsDir)) {
  app.use('/assets', express.static(serverAssetsDir, { maxAge: '30d', immutable: true }));
}
if (clientDistDir) {
  app.use(express.static(clientDistDir, { maxAge: '1d', redirect: false }));
}

const inlineFallbackHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#fff1f5" />
    <title>AIVORA — AI Creative Education Platform</title>
    <script type="module" crossorigin src="/assets/app.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return next();
  }
  if (clientDistDir && fs.existsSync(path.join(clientDistDir, 'index.html'))) {
    return res.status(200).sendFile(path.join(clientDistDir, 'index.html'));
  }
  if (fs.existsSync(spaFallbackFile)) {
    return res.status(200).sendFile(spaFallbackFile);
  }
  return res.status(200).type('html').send(inlineFallbackHtml);
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`🚀 AIVORA Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message);
  if (server) {
    server.close(() => process.exit(1));
  }
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => console.log('💥 Process terminated!'));
  }
});

export default app;
