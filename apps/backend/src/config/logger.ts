import winston from 'winston';
import { getConfig } from './env.js';

const { NODE_ENV, LOG_LEVEL } = getConfig();

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'discifi-sentinel', environment: NODE_ENV },
  transports: [
    new winston.transports.Console({
      format: NODE_ENV === 'development'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 2
                ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            }),
          )
        : winston.format.json(),
    }),
  ],
});
