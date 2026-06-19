export type PubkeyString = string;

export interface SimulationResult {
  simulation_passed: boolean;
  expected_outcome: string;
  actual_outcome: string;
  mismatch_detected: boolean;
  mismatch_details: string | null;
  token_changes: TokenChange[];
  sol_change: number;
  programs_invoked: PubkeyString[];
  new_programs_invoked: PubkeyString[];
  estimated_fee: number;
}

export interface TokenChange {
  mint: PubkeyString;
  amount: number;
  direction: 'in' | 'out';
  symbol?: string;
  decimals?: number;
}

export interface DrainFlag {
  check_name: string;
  triggered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface DrainAnalysisResult {
  overall_risk_score: number;
  risk_level: 'safe' | 'caution' | 'high' | 'critical';
  flags: DrainFlag[];
  recommendation: 'proceed' | 'warn_user' | 'require_override' | 'block';
  block_reason: string | null;
}

export interface RuleEvaluationResult {
  passed: boolean;
  failed_rules: string[];
  rule_events: RuleEvent[];
}

export interface RuleEvent {
  rule_name: string;
  passed: boolean;
  details: string;
}

export interface SigningDecision {
  status: 'approved' | 'requires_override' | 'blocked';
  simulation: SimulationResult;
  drain_analysis: DrainAnalysisResult;
  rule_evaluation: RuleEvaluationResult;
  signed_transaction: string | null;
  block_reason: string | null;
}

export interface DeviceRegistrationRequest {
  device_id: string;
  attestation_certificate: string;
  firmware_version: string;
  platform: 'ios' | 'android';
  app_version: string;
}

export interface DeviceRegistrationResponse {
  device_id: string;
  session_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface DeviceAuthRequest {
  device_id: string;
  signature: string;
  challenge: string;
}

export interface DeviceAuthResponse {
  session_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface WalletConfig {
  owner: PubkeyString;
  device_pubkey: PubkeyString;
  daily_spend_limit: number;
  per_transaction_limit: number;
  daily_spent_so_far: number;
  last_reset_timestamp: number;
  approved_programs: PubkeyString[];
  chain_lock_enabled: boolean;
  chain_lock_chain_id: string;
  vault_mode_enabled: boolean;
  multisig_threshold_lamports: number;
  co_signer_pubkey: PubkeyString | null;
  hodl_lock_amount: number;
  hodl_lock_until: number;
}

export interface RuleSet {
  wallet_config: PubkeyString;
  gas_price_ceiling: number;
  slippage_max_bps: number;
  approval_expiry_seconds: number;
  new_contract_age_threshold_seconds: number;
  velocity_window_seconds: number;
  velocity_max_transactions: number;
  spending_dna_baseline_min: number;
  spending_dna_baseline_max: number;
  quarantine_window_seconds: number;
  quarantine_max_lamports: number;
  time_lock_start_hour: number;
  time_lock_end_hour: number;
  active: boolean;
}

export interface ApprovalRecord {
  wallet_pubkey: PubkeyString;
  spender_pubkey: PubkeyString;
  token_mint: PubkeyString;
  approved_amount: string;
  expiry_timestamp: number;
  created_at: number;
  last_used_at: number;
  times_used: number;
  is_active: boolean;
}

export interface ApprovalHealthResult {
  score: number;
  stale_approvals: ApprovalRecord[];
  total_active: number;
  recommendation: string;
}

export interface StealthMeta {
  spend_pubkey: PubkeyString;
  view_pubkey: PubkeyString;
}

export interface StealthTransfer {
  ephemeral_pubkey: PubkeyString;
  stealth_address: PubkeyString;
  amount: number;
  claimed: boolean;
}

export interface MultisigSession {
  initiator_pubkey: PubkeyString;
  co_signer_pubkey: PubkeyString;
  transaction_hash: string;
  initiator_signed: boolean;
  co_signer_signed: boolean;
  created_at: number;
  expiry_at: number;
  executed: boolean;
}

export enum InheritanceStatus {
  Active = 'Active',
  Claimable = 'Claimable',
}

export interface InheritanceConfig {
  owner_pubkey: PubkeyString;
  beneficiary_pubkey: PubkeyString;
  last_heartbeat_timestamp: number;
  heartbeat_interval_seconds: number;
  grace_period_seconds: number;
  status: InheritanceStatus;
  claimed: boolean;
}

export interface DailyTransactionSummary {
  date: string;
  transaction_count: number;
  total_volume_lamports: number;
  avg_transaction_lamports: number;
  protocols_used: PubkeyString[];
  hour_distribution: number[];
}

export interface DetectedAnomaly {
  detected_at: number;
  transaction_hash: string;
  anomaly_type: string;
  resolved: boolean;
}

export interface SpendingDnaDocument {
  user_wallet_pubkey: PubkeyString;
  daily_averages: DailyTransactionSummary[];
  computed_baseline_min: number;
  computed_baseline_max: number;
  computed_active_hours: number[][];
  last_computed_at: number;
  anomaly_history: DetectedAnomaly[];
}

export type NotificationType =
  | 'rule_blocked' | 'drain_detected' | 'approval_expiring'
  | 'multisig_required' | 'inheritance_heartbeat_due' | 'anomaly_detected';

export type NotificationStatus = 'pending' | 'delivered' | 'failed';

export type ThreatType = 'phishing' | 'drain' | 'fake_mint' | 'malicious_contract';
export type DeviceStatus = 'active' | 'suspended' | 'wiped';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  error_code: string;
  message: string;
  details: string | null;
}
