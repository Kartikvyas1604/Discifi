import { loadConfig } from '../src/config/env.js';

process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'mongodb://localhost:27017/discifi_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.HELIUS_API_KEY = 'test_helius_key';
process.env.HELIUS_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.QUICKNODE_ENDPOINT = 'https://test.quiknode.pro/test/';
process.env.JWT_SECRET = 'test_jwt_secret_key_that_is_at_least_32_chars_long';
process.env.DEVICE_CA_CERTIFICATE = 'test_ca_cert';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{}';

loadConfig();
