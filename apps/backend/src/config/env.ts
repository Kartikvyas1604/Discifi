import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'staging', 'development']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url().min(1),
  REDIS_URL: z.string().url().min(1),
  HELIUS_API_KEY: z.string().min(1),
  HELIUS_WEBHOOK_SECRET: z.string().min(1),
  QUICKNODE_ENDPOINT: z.string().url().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 256 bits (32 characters)'),
  DEVICE_CA_CERTIFICATE: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  CHAINABUSE_API_KEY: z.string().optional(),
  ELUSIV_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (_config) return _config;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missingFields = result.error.issues
      .filter((i) => i.code === 'invalid_type' && i.received === 'undefined')
      .map((i) => i.path.join('.'));
    const msg = missingFields.length > 0
      ? `Missing required env vars: ${missingFields.join(', ')}`
      : `Config validation failed: ${result.error.message}`;
    console.error('CONFIG ERROR:', msg);
    process.exit(1);
  }
  _config = result.data;
  return _config;
}

export function getConfig(): EnvConfig {
  if (!_config) return loadConfig();
  return _config;
}
