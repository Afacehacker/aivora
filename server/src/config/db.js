import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });
  } catch (err) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    console.error('💀 Max retries reached. Exiting process.');
    process.exit(1);
  }
};

export default connectDB;
