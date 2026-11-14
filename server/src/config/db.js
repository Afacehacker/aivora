import mongoose from 'mongoose';
import { ensureInitialData } from '../utils/autoSeed.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const DEFAULT_MONGODB_URI =
  'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';

let cachedPromise = null;

/**
 * Connect to MongoDB with retry logic, serverless connection caching, and automatic initial seeding
 */
const connectDB = async (attempt = 1) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cachedPromise) {
    const conn = await cachedPromise;
    return conn.connection;
  }

  try {
    const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    const conn = await cachedPromise;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Run auto-seed non-blockingly in the background so API requests respond immediately
    ensureInitialData().catch(() => {});

    // Log connection events
    mongoose.connection.on('disconnected', () => {
      cachedPromise = null;
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      cachedPromise = null;
      console.error(`❌ MongoDB error: ${err.message}`);
    });

    return conn.connection;
  } catch (err) {
    cachedPromise = null;
    console.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);

    if (attempt < MAX_RETRIES && !process.env.VERCEL) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    if (process.env.VERCEL) {
      throw err;
    }

    console.error('💀 Max retries reached. Exiting process.');
    process.exit(1);
  }
};

export default connectDB;
