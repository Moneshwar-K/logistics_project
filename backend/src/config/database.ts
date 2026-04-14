import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// MongoDB connection options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
export async function connectDatabase(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<cluster>')) {
    const errorMsg = 'MONGODB_URI environment variable is required. Please:\n' +
      '1. Create a .env file in the backend directory\n' +
      '2. Add your MongoDB Atlas connection string:\n' +
      '   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority\n' +
      'See MONGODB_SETUP.md or SETUP_ENV.md for detailed instructions.';
    throw new Error(errorMsg);
  }

  try {
    await mongoose.connect(MONGODB_URI, options);
    logger.info('✅ Connected to MongoDB Atlas');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Disconnect from MongoDB
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

export default mongoose;