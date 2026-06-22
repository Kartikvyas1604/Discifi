use anchor_lang::prelude::*;

#[event]
pub struct WalletInitialized {
    pub owner: Pubkey,
    pub daily_limit_usd: u64,
    pub per_tx_limit_usd: u64,
    pub velocity_max: u8,
    pub auto_save_bps: u16,
    pub slippage_max_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct RulesUpdated {
    pub owner: Pubkey,
    pub old_daily_limit_usd: u64,
    pub new_daily_limit_usd: u64,
    pub old_per_tx_limit_usd: u64,
    pub new_per_tx_limit_usd: u64,
    pub old_velocity_max: u8,
    pub new_velocity_max: u8,
    pub old_auto_save_bps: u16,
    pub new_auto_save_bps: u16,
    pub old_slippage_max_bps: u16,
    pub new_slippage_max_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct TransactionApproved {
    pub owner: Pubkey,
    pub amount_usd: u64,
    pub remaining_daily_limit: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransactionBlocked {
    pub owner: Pubkey,
    pub amount_usd: u64,
    pub reason: String,
    pub rule_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct DailyLimitReset {
    pub owner: Pubkey,
    pub daily_spent_before_reset: u64,
    pub timestamp: i64,
}

#[event]
pub struct RulesToggled {
    pub owner: Pubkey,
    pub is_active: bool,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyFreezeActivated {
    pub owner: Pubkey,
    pub timestamp: i64,
}
