use anchor_lang::prelude::*;

declare_id!("Ru1eSet1111111111111111111111111111111111111");

pub const RULE_SET_SEED: &[u8] = b"sentinel-rules";
pub const VELOCITY_TRACKER_SEED: &[u8] = b"velocity-tracker";
pub const MAX_TIMESTAMPS: usize = 20;

pub const RULE_SET_SPACE: usize = 8  // discriminator
    + 32                               // wallet_config
    + 32                               // authority
    + 8                                // gas_price_ceiling
    + 2                                // slippage_max_bps
    + 8                                // approval_expiry_seconds
    + 8                                // new_contract_age_threshold_seconds
    + 8                                // velocity_window_seconds
    + 1                                // velocity_max_transactions
    + 8                                // spending_dna_baseline_min
    + 8                                // spending_dna_baseline_max
    + 8                                // quarantine_window_seconds
    + 8                                // quarantine_max_lamports
    + 1                                // time_lock_start_hour
    + 1                                // time_lock_end_hour
    + 1                                // active
    + 1;                               // bump

pub const VELOCITY_TRACKER_SPACE: usize = 8  // discriminator
    + 32                                      // wallet_config
    + 4                                       // vec length
    + MAX_TIMESTAMPS * 8                      // timestamps
    + 1;                                      // bump

#[account]
pub struct RuleSet {
    pub wallet_config: Pubkey,
    pub authority: Pubkey,
    pub gas_price_ceiling: u64,
    pub slippage_max_bps: u16,
    pub approval_expiry_seconds: u64,
    pub new_contract_age_threshold_seconds: u64,
    pub velocity_window_seconds: u64,
    pub velocity_max_transactions: u8,
    pub spending_dna_baseline_min: u64,
    pub spending_dna_baseline_max: u64,
    pub quarantine_window_seconds: u64,
    pub quarantine_max_lamports: u64,
    pub time_lock_start_hour: u8,
    pub time_lock_end_hour: u8,
    pub active: bool,
    pub bump: u8,
}

#[account]
pub struct VelocityTracker {
    pub wallet_config: Pubkey,
    pub transaction_timestamps: Vec<i64>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRulesParams {
    pub gas_price_ceiling: Option<u64>,
    pub slippage_max_bps: Option<u16>,
    pub approval_expiry_seconds: Option<u64>,
    pub new_contract_age_threshold_seconds: Option<u64>,
    pub velocity_window_seconds: Option<u64>,
    pub velocity_max_transactions: Option<u8>,
    pub spending_dna_baseline_min: Option<u64>,
    pub spending_dna_baseline_max: Option<u64>,
    pub quarantine_window_seconds: Option<u64>,
    pub quarantine_max_lamports: Option<u64>,
    pub time_lock_start_hour: Option<u8>,
    pub time_lock_end_hour: Option<u8>,
    pub active: Option<bool>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TransactionProposal {
    pub gas_price: u64,
    pub slippage_bps: u16,
    pub amount: u64,
    pub is_new_contract: bool,
}

#[event]
pub struct RuleEvaluationEvent {
    pub wallet_config: Pubkey,
    pub passed: bool,
    pub failed_rules: Vec<String>,
    pub evaluated_at: i64,
}

#[program]
pub mod sentinel_rules {
    use super::*;

    pub fn initialize_rules(
        ctx: Context<InitializeRules>,
        wallet_config: Pubkey,
    ) -> Result<()> {
        let rule_set = &mut ctx.accounts.rule_set;
        rule_set.wallet_config = wallet_config;
        rule_set.authority = ctx.accounts.authority.key();
        rule_set.gas_price_ceiling = 500_000; // 0.0005 SOL in lamports
        rule_set.slippage_max_bps = 100;       // 1%
        rule_set.approval_expiry_seconds = 300; // 5 minutes
        rule_set.new_contract_age_threshold_seconds = 86_400; // 24 hours
        rule_set.velocity_window_seconds = 3_600; // 1 hour
        rule_set.velocity_max_transactions = 10;
        rule_set.spending_dna_baseline_min = 0;
        rule_set.spending_dna_baseline_max = 1_000_000_000; // 1 SOL
        rule_set.quarantine_window_seconds = 86_400; // 24 hours
        rule_set.quarantine_max_lamports = 10_000_000; // 0.01 SOL
        rule_set.time_lock_start_hour = 6;  // 6 AM
        rule_set.time_lock_end_hour = 22;   // 10 PM
        rule_set.active = true;
        rule_set.bump = ctx.bumps.rule_set;
        Ok(())
    }

    pub fn update_rules(
        ctx: Context<UpdateRules>,
        params: UpdateRulesParams,
    ) -> Result<()> {
        let rule_set = &mut ctx.accounts.rule_set;

        if let Some(v) = params.gas_price_ceiling {
            rule_set.gas_price_ceiling = v;
        }
        if let Some(v) = params.slippage_max_bps {
            rule_set.slippage_max_bps = v;
        }
        if let Some(v) = params.approval_expiry_seconds {
            rule_set.approval_expiry_seconds = v;
        }
        if let Some(v) = params.new_contract_age_threshold_seconds {
            rule_set.new_contract_age_threshold_seconds = v;
        }
        if let Some(v) = params.velocity_window_seconds {
            rule_set.velocity_window_seconds = v;
        }
        if let Some(v) = params.velocity_max_transactions {
            rule_set.velocity_max_transactions = v;
        }
        if let Some(v) = params.spending_dna_baseline_min {
            rule_set.spending_dna_baseline_min = v;
        }
        if let Some(v) = params.spending_dna_baseline_max {
            rule_set.spending_dna_baseline_max = v;
        }
        if let Some(v) = params.quarantine_window_seconds {
            rule_set.quarantine_window_seconds = v;
        }
        if let Some(v) = params.quarantine_max_lamports {
            rule_set.quarantine_max_lamports = v;
        }
        if let Some(v) = params.time_lock_start_hour {
            rule_set.time_lock_start_hour = v;
        }
        if let Some(v) = params.time_lock_end_hour {
            rule_set.time_lock_end_hour = v;
        }
        if let Some(v) = params.active {
            rule_set.active = v;
        }
        Ok(())
    }

    pub fn evaluate_transaction_rules(
        ctx: Context<EvaluateTransactionRules>,
        tx: TransactionProposal,
    ) -> Result<()> {
        let rule_set = &ctx.accounts.rule_set;
        let clock = Clock::get()?;
        let mut failed_rules: Vec<String> = Vec::new();

        if !rule_set.active {
            emit!(RuleEvaluationEvent {
                wallet_config: rule_set.wallet_config,
                passed: true,
                failed_rules: Vec::new(),
                evaluated_at: clock.unix_timestamp,
            });
            return Ok(());
        }

        if tx.gas_price > rule_set.gas_price_ceiling {
            failed_rules.push("gas_price_ceiling".to_string());
        }

        if tx.slippage_bps > rule_set.slippage_max_bps {
            failed_rules.push("slippage_max_bps".to_string());
        }

        if tx.amount < rule_set.spending_dna_baseline_min
            || tx.amount > rule_set.spending_dna_baseline_max
        {
            failed_rules.push("spending_dna_baseline".to_string());
        }

        if tx.is_new_contract {
            failed_rules.push("new_contract_age_threshold".to_string());
        }

        let current_hour = Self::current_hour(clock.unix_timestamp);
        if rule_set.time_lock_start_hour < rule_set.time_lock_end_hour {
            if current_hour < rule_set.time_lock_start_hour
                || current_hour >= rule_set.time_lock_end_hour
            {
                failed_rules.push("time_lock".to_string());
            }
        } else {
            if current_hour >= rule_set.time_lock_end_hour
                && current_hour < rule_set.time_lock_start_hour
            {
                failed_rules.push("time_lock".to_string());
            }
        }

        if let Some(velocity_tracker) = &ctx.accounts.velocity_tracker {
            let window_start = clock.unix_timestamp - rule_set.velocity_window_seconds as i64;
            let recent = velocity_tracker
                .transaction_timestamps
                .iter()
                .filter(|&&ts| ts >= window_start)
                .count();
            if recent >= rule_set.velocity_max_transactions as usize {
                failed_rules.push("velocity".to_string());
            }
        }

        let passed = failed_rules.is_empty();
        emit!(RuleEvaluationEvent {
            wallet_config: rule_set.wallet_config,
            passed,
            failed_rules,
            evaluated_at: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn record_transaction(ctx: Context<RecordTransaction>) -> Result<()> {
        let clock = Clock::get()?;
        let tracker = &mut ctx.accounts.velocity_tracker;
        tracker.transaction_timestamps.push(clock.unix_timestamp);
        if tracker.transaction_timestamps.len() > MAX_TIMESTAMPS {
            tracker.transaction_timestamps.remove(0);
        }
        Ok(())
    }

    fn current_hour(timestamp: i64) -> u8 {
        let secs_in_day = timestamp.rem_euclid(86_400);
        (secs_in_day / 3_600) as u8
    }
}

#[derive(Accounts)]
pub struct InitializeRules<'info> {
    #[account(
        init,
        payer = payer,
        space = RULE_SET_SPACE,
        seeds = [wallet_config.key().as_ref(), RULE_SET_SEED],
        bump
    )]
    pub rule_set: Account<'info, RuleSet>,
    /// Wallet config pubkey to link — used as PDA seed
    pub wallet_config: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRules<'info> {
    #[account(
        mut,
        seeds = [rule_set.wallet_config.as_ref(), RULE_SET_SEED],
        bump = rule_set.bump,
        constraint = authority.key() == rule_set.authority @ SentinelRulesError::Unauthorized
    )]
    pub rule_set: Account<'info, RuleSet>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EvaluateTransactionRules<'info> {
    #[account(
        seeds = [rule_set.wallet_config.as_ref(), RULE_SET_SEED],
        bump = rule_set.bump
    )]
    pub rule_set: Account<'info, RuleSet>,
    pub velocity_tracker: Option<Account<'info, VelocityTracker>>,
}

#[derive(Accounts)]
pub struct RecordTransaction<'info> {
    #[account(
        seeds = [rule_set.wallet_config.as_ref(), RULE_SET_SEED],
        bump = rule_set.bump
    )]
    pub rule_set: Account<'info, RuleSet>,
    #[account(
        init_if_needed,
        payer = payer,
        space = VELOCITY_TRACKER_SPACE,
        seeds = [rule_set.wallet_config.as_ref(), VELOCITY_TRACKER_SEED],
        bump
    )]
    pub velocity_tracker: Account<'info, VelocityTracker>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum SentinelRulesError {
    #[msg("The signer is not authorized to update these rules")]
    Unauthorized,
}
