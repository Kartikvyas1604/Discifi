import mongoose from 'mongoose';
import { getConfig } from './env.js';
import { logger } from './logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;
  const { DATABASE_URL } = getConfig();

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority',
    });
    isConnected = true;
    logger.info('MongoDB connected', { host: new URL(DATABASE_URL).hostname });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
      isConnected = false;
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting MongoDB', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function getDatabaseStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
}
