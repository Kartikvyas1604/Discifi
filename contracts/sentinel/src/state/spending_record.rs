use anchor_lang::prelude::*;

#[account]
pub struct SpendingRecord {
    pub wallet: Pubkey,
    pub amount_usd: u64,
    pub timestamp: i64,
    pub rule_triggered: bool,
    pub rule_type: u8,
    pub bump: u8,
}
