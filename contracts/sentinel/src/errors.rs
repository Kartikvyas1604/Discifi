use anchor_lang::prelude::*;

#[error_code]
pub enum SentinelError {
    #[msg("Transaction would exceed your daily spending limit")]
    DailyLimitExceeded,
    #[msg("Transaction exceeds your per-transaction limit")]
    PerTransactionLimitExceeded,
    #[msg("Too many transactions this hour — velocity limit reached")]
    VelocityLimitExceeded,
    #[msg("Only the wallet owner can perform this action")]
    Unauthorized,
    #[msg("Rules are currently disabled")]
    RulesDisabled,
    #[msg("Invalid basis points value — must be between 0 and 10000")]
    InvalidBasisPoints,
    #[msg("Daily limit must be greater than per-transaction limit")]
    InvalidLimitConfiguration,
}
