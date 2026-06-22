use anchor_lang::prelude::*;

#[account]
pub struct WalletConfig {
    pub owner: Pubkey,
    pub daily_limit_usd: u64,
    pub per_tx_limit_usd: u64,
    pub daily_spent_usd: u64,
    pub last_reset_slot: i64,
    pub velocity_max: u8,
    pub velocity_count: u8,
    pub velocity_window_start: i64,
    pub auto_save_bps: u16,
    pub slippage_max_bps: u16,
    pub is_active: bool,
    pub bump: u8,
}
