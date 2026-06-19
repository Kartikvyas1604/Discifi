import Fastify from 'fastify';
import { loadConfig, getConfig } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { closeRedis } from './config/redis.js';
import { registerPlugins } from './plugins/index.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import {
  deviceRoutes, transactionRoutes, walletRoutes, privacyRoutes,
  analyticsRoutes, multisigRoutes, inheritanceRoutes, healthRoutes,
} from './routes/index.js';

async function buildApp() {
  loadConfig();
  const config = getConfig();

  const app = Fastify({
    logger: false,
    bodyLimit: 1048576,
    requestTimeout: 30000,
  });

  app.setErrorHandler(errorHandler);

  await registerPlugins(app);

  await app.register(healthRoutes);
  await app.register(deviceRoutes);
  await app.register(transactionRoutes);
  await app.register(walletRoutes);
  await app.register(privacyRoutes);
  await app.register(analyticsRoutes);
  await app.register(multisigRoutes);
  await app.register(inheritanceRoutes);

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    const config = getConfig();

    await connectDatabase();
    const { getRedisClient } = await import('./config/redis.js');
    getRedisClient();

    const address = await app.listen({ port: config.PORT, host: config.HOST });
    logger.info(`DisciFi Sentinel backend running`, { address, environment: config.NODE_ENV });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await disconnectDatabase();
      await closeRedis();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return app;
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();

export { buildApp };
