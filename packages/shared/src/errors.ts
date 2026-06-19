export class SentinelBaseError extends Error {
  public readonly error_code: string;
  public readonly user_facing_message: string;
  public readonly internal_details: Record<string, unknown>;
  public readonly status_code: number;

  constructor(
    error_code: string,
    message: string,
    user_facing_message: string,
    status_code: number = 500,
    internal_details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.error_code = error_code;
    this.user_facing_message = user_facing_message;
    this.status_code = status_code;
    this.internal_details = internal_details;
  }
}

export class BlockchainError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'A blockchain error occurred. Please try again.',
  ) {
    super('BLOCKCHAIN_ERROR', message, user_facing_message, 502, internal_details);
  }
}

export class SimulationError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Transaction simulation failed. Proceed with caution.',
  ) {
    super('SIMULATION_ERROR', message, user_facing_message, 502, internal_details);
  }
}

export class DrainDetectedError extends SentinelBaseError {
  constructor(
    message: string,
    public readonly drain_result: import('./types.js').DrainAnalysisResult,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Potential drain attack detected. Transaction blocked.',
  ) {
    super('DRAIN_DETECTED', message, user_facing_message, 403, internal_details);
  }
}

export class RuleViolationError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Transaction violates security rules.',
  ) {
    super('RULE_VIOLATION', message, user_facing_message, 403, internal_details);
  }
}

export class AuthenticationError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Authentication failed. Please re-pair your device.',
  ) {
    super('AUTHENTICATION_ERROR', message, user_facing_message, 401, internal_details);
  }
}

export class DeviceError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Device error. Ensure your hardware card is connected.',
  ) {
    super('DEVICE_ERROR', message, user_facing_message, 400, internal_details);
  }
}

export class PrivacyRoutingError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Privacy routing failed. Please try again.',
  ) {
    super('PRIVACY_ROUTING_ERROR', message, user_facing_message, 502, internal_details);
  }
}

export class ValidationError extends SentinelBaseError {
  constructor(
    message: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'Invalid request. Please check your input.',
  ) {
    super('VALIDATION_ERROR', message, user_facing_message, 400, internal_details);
  }
}

export class RateLimitError extends SentinelBaseError {
  constructor(user_facing_message = 'Too many requests. Please wait before trying again.') {
    super('RATE_LIMITED', 'Rate limit exceeded', user_facing_message, 429);
  }
}

export class NotFoundError extends SentinelBaseError {
  constructor(
    resource: string,
    internal_details: Record<string, unknown> = {},
    user_facing_message = 'The requested resource was not found.',
  ) {
    super('NOT_FOUND', `${resource} not found`, user_facing_message, 404, internal_details);
  }
}
