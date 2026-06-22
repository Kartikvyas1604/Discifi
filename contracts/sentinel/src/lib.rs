use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod state;

pub use errors::*;

use events::*;
use state::*;

declare_id!("FeMeEBKUt7iWk116n5UPm8fZApV91ngqFfQjMV8Zwhaa");

// ---------------------------------------------------------------------------
// Context structs (must be at crate root for Anchor #[program] macro)
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeWallet<'info> {
    #[account(
        init,
        payer = owner,
        space = 88,
        seeds = [b"sentinel", owner.key().as_ref()],
        bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRules<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [b"sentinel", owner.key().as_ref()],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(amount_usd: u64, record_index: u64)]
pub struct EvaluateAndRecordTransaction<'info> {
    #[account(
        mut,
        seeds = [b"sentinel", wallet_config.owner.as_ref()],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    #[account(
        init,
        payer = caller,
        space = 59,
        seeds = [b"record", wallet_config.key().as_ref(), &record_index.to_le_bytes()],
        bump
    )]
    pub spending_record: Account<'info, SpendingRecord>,
    #[account(mut)]
    pub caller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetDailyLimit<'info> {
    #[account(
        mut,
        seeds = [b"sentinel", wallet_config.owner.as_ref()],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
}

#[derive(Accounts)]
pub struct ToggleRules<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [b"sentinel", owner.key().as_ref()],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyFreeze<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [b"sentinel", owner.key().as_ref()],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
}

// ---------------------------------------------------------------------------
// Instruction handlers
// ---------------------------------------------------------------------------

fn initialize_wallet_handler(
    ctx: Context<InitializeWallet>,
    daily_limit_usd: u64,
    per_tx_limit_usd: u64,
    velocity_max: u8,
    auto_save_bps: u16,
    slippage_max_bps: u16,
) -> Result<()> {
    require!(auto_save_bps <= 10000, SentinelError::InvalidBasisPoints);
    require!(
        daily_limit_usd >= per_tx_limit_usd,
        SentinelError::InvalidLimitConfiguration
    );

    let clock = Clock::get()?;
    let config = &mut ctx.accounts.wallet_config;

    config.owner = ctx.accounts.owner.key();
    config.daily_limit_usd = daily_limit_usd;
    config.per_tx_limit_usd = per_tx_limit_usd;
    config.daily_spent_usd = 0;
    config.last_reset_slot = clock.unix_timestamp;
    config.velocity_max = velocity_max;
    config.velocity_count = 0;
    config.velocity_window_start = clock.unix_timestamp;
    config.auto_save_bps = auto_save_bps;
    config.slippage_max_bps = slippage_max_bps;
    config.is_active = true;
    config.bump = ctx.bumps.wallet_config;

    emit!(WalletInitialized {
        owner: ctx.accounts.owner.key(),
        daily_limit_usd,
        per_tx_limit_usd,
        velocity_max,
        auto_save_bps,
        slippage_max_bps,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

fn update_rules_handler(
    ctx: Context<UpdateRules>,
    daily_limit_usd: Option<u64>,
    per_tx_limit_usd: Option<u64>,
    velocity_max: Option<u8>,
    auto_save_bps: Option<u16>,
    slippage_max_bps: Option<u16>,
) -> Result<()> {
    let config = &mut ctx.accounts.wallet_config;

    if let Some(bps) = auto_save_bps {
        require!(bps <= 10000, SentinelError::InvalidBasisPoints);
    }

    let old_daily_limit = config.daily_limit_usd;
    let old_per_tx_limit = config.per_tx_limit_usd;
    let old_velocity_max = config.velocity_max;
    let old_auto_save_bps = config.auto_save_bps;
    let old_slippage_max_bps = config.slippage_max_bps;

    if let Some(v) = daily_limit_usd { config.daily_limit_usd = v; }
    if let Some(v) = per_tx_limit_usd { config.per_tx_limit_usd = v; }
    if let Some(v) = velocity_max { config.velocity_max = v; }
    if let Some(v) = auto_save_bps { config.auto_save_bps = v; }
    if let Some(v) = slippage_max_bps { config.slippage_max_bps = v; }

    require!(
        config.daily_limit_usd >= config.per_tx_limit_usd,
        SentinelError::InvalidLimitConfiguration
    );

    emit!(RulesUpdated {
        owner: ctx.accounts.owner.key(),
        old_daily_limit_usd: old_daily_limit,
        new_daily_limit_usd: config.daily_limit_usd,
        old_per_tx_limit_usd: old_per_tx_limit,
        new_per_tx_limit_usd: config.per_tx_limit_usd,
        old_velocity_max,
        new_velocity_max: config.velocity_max,
        old_auto_save_bps,
        new_auto_save_bps: config.auto_save_bps,
        old_slippage_max_bps,
        new_slippage_max_bps: config.slippage_max_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

fn evaluate_transaction_handler(
    ctx: Context<EvaluateAndRecordTransaction>,
    amount_usd: u64,
    _record_index: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    let config = &mut ctx.accounts.wallet_config;
    let now = clock.unix_timestamp;

    if now - config.last_reset_slot > 86400 {
        config.daily_spent_usd = 0;
        config.last_reset_slot = now;
    }

    if now - config.velocity_window_start > 3600 {
        config.velocity_count = 0;
        config.velocity_window_start = now;
    }

    if config.is_active
        && config.daily_spent_usd.checked_add(amount_usd).unwrap() > config.daily_limit_usd
    {
        emit!(TransactionBlocked {
            owner: config.owner,
            amount_usd,
            reason: "DailyLimitExceeded".to_string(),
            rule_type: 1,
            timestamp: now,
        });
        return err!(SentinelError::DailyLimitExceeded);
    }

    if config.is_active && amount_usd > config.per_tx_limit_usd {
        emit!(TransactionBlocked {
            owner: config.owner,
            amount_usd,
            reason: "PerTransactionLimitExceeded".to_string(),
            rule_type: 2,
            timestamp: now,
        });
        return err!(SentinelError::PerTransactionLimitExceeded);
    }

    if config.is_active
        && (config.velocity_count as u64).checked_add(1).unwrap() > config.velocity_max as u64
    {
        emit!(TransactionBlocked {
            owner: config.owner,
            amount_usd,
            reason: "VelocityLimitExceeded".to_string(),
            rule_type: 3,
            timestamp: now,
        });
        return err!(SentinelError::VelocityLimitExceeded);
    }

    config.daily_spent_usd = config.daily_spent_usd.checked_add(amount_usd).unwrap();
    config.velocity_count = config.velocity_count.checked_add(1).unwrap();

    let remaining = if config.daily_limit_usd > config.daily_spent_usd {
        config.daily_limit_usd - config.daily_spent_usd
    } else {
        0
    };

    let record = &mut ctx.accounts.spending_record;
    record.wallet = config.owner;
    record.amount_usd = amount_usd;
    record.timestamp = now;
    record.rule_triggered = false;
    record.rule_type = 0;
    record.bump = ctx.bumps.spending_record;

    emit!(TransactionApproved {
        owner: config.owner,
        amount_usd,
        remaining_daily_limit: remaining,
        timestamp: now,
    });

    Ok(())
}

fn reset_daily_limit_handler(ctx: Context<ResetDailyLimit>) -> Result<()> {
    let clock = Clock::get()?;
    let config = &mut ctx.accounts.wallet_config;
    let now = clock.unix_timestamp;
    let before_reset = config.daily_spent_usd;

    config.daily_spent_usd = 0;
    config.last_reset_slot = now;

    emit!(DailyLimitReset {
        owner: config.owner,
        daily_spent_before_reset: before_reset,
        timestamp: now,
    });

    Ok(())
}

fn toggle_rules_handler(ctx: Context<ToggleRules>, is_active: bool) -> Result<()> {
    let config = &mut ctx.accounts.wallet_config;
    config.is_active = is_active;

    emit!(RulesToggled {
        owner: ctx.accounts.owner.key(),
        is_active,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

fn emergency_freeze_handler(ctx: Context<EmergencyFreeze>) -> Result<()> {
    let clock = Clock::get()?;
    let config = &mut ctx.accounts.wallet_config;

    config.is_active = false;
    config.daily_limit_usd = 0;
    config.per_tx_limit_usd = 0;

    emit!(EmergencyFreezeActivated {
        owner: ctx.accounts.owner.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

// ---------------------------------------------------------------------------
// Program entrypoint
// ---------------------------------------------------------------------------

#[program]
pub mod discifi_sentinel {
    use super::*;

    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        daily_limit_usd: u64,
        per_tx_limit_usd: u64,
        velocity_max: u8,
        auto_save_bps: u16,
        slippage_max_bps: u16,
    ) -> Result<()> {
        initialize_wallet_handler(ctx, daily_limit_usd, per_tx_limit_usd, velocity_max, auto_save_bps, slippage_max_bps)
    }

    pub fn update_rules(
        ctx: Context<UpdateRules>,
        daily_limit_usd: Option<u64>,
        per_tx_limit_usd: Option<u64>,
        velocity_max: Option<u8>,
        auto_save_bps: Option<u16>,
        slippage_max_bps: Option<u16>,
    ) -> Result<()> {
        update_rules_handler(ctx, daily_limit_usd, per_tx_limit_usd, velocity_max, auto_save_bps, slippage_max_bps)
    }

    pub fn evaluate_and_record_transaction(
        ctx: Context<EvaluateAndRecordTransaction>,
        amount_usd: u64,
        record_index: u64,
    ) -> Result<()> {
        evaluate_transaction_handler(ctx, amount_usd, record_index)
    }

    pub fn reset_daily_limit(ctx: Context<ResetDailyLimit>) -> Result<()> {
        reset_daily_limit_handler(ctx)
    }

    pub fn toggle_rules(ctx: Context<ToggleRules>, is_active: bool) -> Result<()> {
        toggle_rules_handler(ctx, is_active)
    }

    pub fn emergency_freeze(ctx: Context<EmergencyFreeze>) -> Result<()> {
        emergency_freeze_handler(ctx)
    }
}
