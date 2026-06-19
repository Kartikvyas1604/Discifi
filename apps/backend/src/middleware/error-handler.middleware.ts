import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { SentinelBaseError } from '../errors/index.js';
import { logger } from '../config/logger.js';

export function errorHandler(error: FastifyError | SentinelBaseError | Error, request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof SentinelBaseError) {
    logger.warn('Sentinel error', {
      error_code: error.error_code, message: error.message, status_code: error.status_code,
      path: request.url, method: request.method, internal_details: error.internal_details,
    });
    reply.status(error.status_code).send({
      success: false,
      error: { error_code: error.error_code, message: error.user_facing_message, details: null },
    });
    return;
  }
  if ('validation' in error) {
    reply.status(400).send({
      success: false,
      error: { error_code: 'VALIDATION_ERROR', message: 'Invalid request parameters', details: error.message },
    });
    return;
  }
  if ('statusCode' in error && typeof error.statusCode === 'number' && error.statusCode === 429) {
    reply.status(429).send({
      success: false,
      error: { error_code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.', details: null },
    });
    return;
  }
  logger.error('Unhandled error', { message: error.message, stack: error.stack, path: request.url, method: request.method });
  reply.status(500).send({
    success: false,
    error: { error_code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.', details: null },
  });
}
