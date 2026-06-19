import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { getConfig } from '../config/env.js';

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://discifi.app', 'https://api.discifi.app']
      : ['http://localhost:3000', 'http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Signature', 'X-Idempotency-Key', 'X-Timestamp'],
    credentials: true,
    maxAge: 86400,
  });

  const config = getConfig();
  if (config.NODE_ENV === 'production') {
    const helmet = await import('@fastify/helmet');
    await app.register(helmet.default, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
      xFrameOptions: { action: 'deny' },
    });
  }
}
