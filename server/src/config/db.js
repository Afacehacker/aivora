import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let cachedPromise = null;

/**
 * Connect to MongoDB with retry logic and serverless connection caching
 */
const connectDB = async (attempt = 1) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    const conn = await cachedPromise;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

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
