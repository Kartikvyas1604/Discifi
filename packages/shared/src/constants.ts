export const SOLANA_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const AVERAGE_SLOT_TIME_MS = 400;
export const MAX_TRANSACTION_BYTES = 1232;

export const SEED_WALLET = 'sentinel-wallet';
export const SEED_RULES = 'sentinel-rules';
export const SEED_APPROVAL = 'sentinel-approval';
export const SEED_STEALTH_META = 'sentinel-stealth-meta';
export const SEED_STEALTH_TRANSFER = 'sentinel-stealth-transfer';
export const SEED_MULTISIG_SESSION = 'sentinel-multisig';
export const SEED_INHERITANCE = 'sentinel-inheritance';
export const SEED_REVOCATION_REWARD = 'revocation-reward';

export const HOUR_IN_SECONDS = 3600;
export const DAY_IN_SECONDS = 86400;
export const WEEK_IN_SECONDS = 604800;
export const MONTH_IN_SECONDS = 2592000;
export const YEAR_IN_SECONDS = 31536000;

export const DEFAULT_DAILY_SPEND_LIMIT = 10_000_000_000;
export const DEFAULT_PER_TX_LIMIT = 1_000_000_000;
export const DEFAULT_VELOCITY_WINDOW = 60;
export const DEFAULT_VELOCITY_MAX_TX = 3;
export const DEFAULT_NEW_CONTRACT_AGE_THRESHOLD = 30 * DAY_IN_SECONDS;
export const DEFAULT_APPROVAL_EXPIRY = 90 * DAY_IN_SECONDS;
export const DEFAULT_QUARANTINE_WINDOW = 7 * DAY_IN_SECONDS;
export const DEFAULT_QUARANTINE_MAX_LAMPORTS = 100_000_000;
export const DEFAULT_HEARTBEAT_INTERVAL = YEAR_IN_SECONDS;
export const DEFAULT_GRACE_PERIOD = 30 * DAY_IN_SECONDS;
export const DEFAULT_MULTISIG_THRESHOLD = 50_000_000_000;
export const DEFAULT_SLIPPAGE_MAX_BPS = 100;
export const DEFAULT_GAS_PRICE_CEILING = 1_000_000;
export const DRAIN_RISK_THRESHOLD_CAUTION = 30;
export const DRAIN_RISK_THRESHOLD_HIGH = 60;
export const DRAIN_RISK_THRESHOLD_CRITICAL = 85;

export const API_RATE_LIMIT_AUTHENTICATED = 100;
export const API_RATE_LIMIT_UNAUTHENTICATED = 10;
export const API_RATE_LIMIT_WINDOW_MS = 60_000;
export const JWT_EXPIRY_SECONDS = 900;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const SIMULATION_CACHE_TTL_SECONDS = 30;
export const RULES_CACHE_TTL_SECONDS = 60;
export const IDEMPOTENCY_TTL_SECONDS = 60;
export const FAILED_ATTEMPT_THRESHOLD = 5;
export const FAILED_ATTEMPT_WINDOW_MINUTES = 10;

export const QUEUE_SPENDING_DNA = 'spending-dna-computation';
export const QUEUE_INHERITANCE_HEARTBEAT = 'inheritance-heartbeat';
export const QUEUE_PHISHING_UPDATE = 'phishing-registry-update';
export const QUEUE_APPROVAL_EXPIRY = 'approval-expiry-cleanup';
export const QUEUE_SIMULATION = 'transaction-simulation';

export const REDIS_SESSION = 'discifi:session';
export const REDIS_REFRESH = 'discifi:refresh';
export const REDIS_RULES_CACHE = 'discifi:rules';
export const REDIS_FAILED_ATTEMPTS = 'discifi:failed-attempts';
export const REDIS_IDEMPOTENCY = 'discifi:idempotency';
export const REDIS_RPC_HEALTH = 'discifi:rpc-health';
export const REDIS_RATE_LIMIT = 'discifi:ratelimit';

export const COLLECTION_DEVICE_REGISTRY = 'device_registry';
export const COLLECTION_SIMULATION_CACHE = 'simulation_cache';
export const COLLECTION_PHISHING_REGISTRY = 'phishing_registry';
export const COLLECTION_NOTIFICATION_QUEUE = 'notification_queue';
export const COLLECTION_SPENDING_DNA = 'spending_dna';
