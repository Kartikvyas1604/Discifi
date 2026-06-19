use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod sentinel_wallet {
    use super::*;

    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        chain_lock_chain_id: String,
    ) -> Result<()> {
        require!(
            chain_lock_chain_id.len() <= 32,
            WalletError::ChainIdTooLong
        );

        let config = &mut ctx.accounts.wallet_config;
        config.owner = ctx.accounts.owner.key();
        config.device_pubkey = ctx.accounts.device_pubkey.key();
        config.daily_spend_limit = 0;
        config.per_transaction_limit = 0;
        config.daily_spent_so_far = 0;
        config.last_reset_timestamp = Clock::get()?.unix_timestamp;
        config.approved_programs = Vec::new();
        config.chain_lock_enabled = false;
        config.chain_lock_chain_id = chain_lock_chain_id;
        config.vault_mode_enabled = false;
        config.multisig_threshold_lamports = 0;
        config.co_signer_pubkey = None;
        config.hodl_lock_amount = 0;
        config.hodl_lock_until = 0;
        config.bump = ctx.bumps.wallet_config;

        Ok(())
    }

    pub fn update_spending_limits(
        ctx: Context<UpdateSpendingLimits>,
        daily_spend_limit: u64,
        per_transaction_limit: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        config.daily_spend_limit = daily_spend_limit;
        config.per_transaction_limit = per_transaction_limit;
        Ok(())
    }

    pub fn add_approved_program(ctx: Context<AddApprovedProgram>, program: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        require!(
            config.approved_programs.len() < 50,
            WalletError::MaxApprovedPrograms
        );
        require!(
            !config.approved_programs.contains(&program),
            WalletError::ProgramAlreadyApproved
        );
        config.approved_programs.push(program);
        Ok(())
    }

    pub fn remove_approved_program(
        ctx: Context<RemoveApprovedProgram>,
        program: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        let position = config
            .approved_programs
            .iter()
            .position(|p| *p == program)
            .ok_or(WalletError::ProgramNotApproved)?;
        config.approved_programs.remove(position);
        Ok(())
    }

    pub fn enable_vault_mode(ctx: Context<EnableVaultMode>) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        require!(
            config.co_signer_pubkey.is_some(),
            WalletError::CoSignerNotSet
        );
        config.vault_mode_enabled = true;
        Ok(())
    }

    pub fn disable_vault_mode(ctx: Context<DisableVaultMode>) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        let expected_co_signer = config
            .co_signer_pubkey
            .ok_or(WalletError::CoSignerNotSet)?;
        require_keys_eq!(
            expected_co_signer,
            ctx.accounts.co_signer.key(),
            WalletError::InvalidCoSigner
        );
        config.vault_mode_enabled = false;
        Ok(())
    }

    pub fn set_hodl_lock(
        ctx: Context<SetHodlLock>,
        hodl_lock_amount: u64,
        hodl_lock_until: i64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        config.hodl_lock_amount = hodl_lock_amount;
        config.hodl_lock_until = hodl_lock_until;
        Ok(())
    }

    pub fn reset_daily_limit(ctx: Context<ResetDailyLimit>) -> Result<()> {
        let config = &mut ctx.accounts.wallet_config;
        let now = Clock::get()?.unix_timestamp;
        if now > config.last_reset_timestamp + 86_400 {
            config.daily_spent_so_far = 0;
            config.last_reset_timestamp = now;
        }
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct WalletConfig {
    pub owner: Pubkey,
    pub device_pubkey: Pubkey,
    pub daily_spend_limit: u64,
    pub per_transaction_limit: u64,
    pub daily_spent_so_far: u64,
    pub last_reset_timestamp: i64,
    #[max_len(50)]
    pub approved_programs: Vec<Pubkey>,
    pub chain_lock_enabled: bool,
    #[max_len(32)]
    pub chain_lock_chain_id: String,
    pub vault_mode_enabled: bool,
    pub multisig_threshold_lamports: u64,
    pub co_signer_pubkey: Option<Pubkey>,
    pub hodl_lock_amount: u64,
    pub hodl_lock_until: i64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeWallet<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + WalletConfig::INIT_SPACE,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub device_pubkey: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSpendingLimits<'info> {
    #[account(
        mut,
        has_one = owner,
        has_one = device_pubkey,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
    pub device_pubkey: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddApprovedProgram<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
    /// CHECK: Used for PDA seed derivation only
    pub device_pubkey: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RemoveApprovedProgram<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
    /// CHECK: Used for PDA seed derivation only
    pub device_pubkey: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct EnableVaultMode<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
    /// CHECK: Used for PDA seed derivation only
    pub device_pubkey: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct DisableVaultMode<'info> {
    #[account(
        mut,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub device_pubkey: Signer<'info>,
    pub co_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetHodlLock<'info> {
    #[account(
        mut,
        has_one = owner,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    pub owner: Signer<'info>,
    /// CHECK: Used for PDA seed derivation only
    pub device_pubkey: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ResetDailyLimit<'info> {
    #[account(
        mut,
        seeds = [device_pubkey.key().as_ref(), b"sentinel-wallet"],
        bump = wallet_config.bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
    /// CHECK: Used for PDA seed derivation only
    pub device_pubkey: UncheckedAccount<'info>,
}

#[error_code]
pub enum WalletError {
    #[msg("Chain ID exceeds maximum length of 32 characters")]
    ChainIdTooLong,
    #[msg("Maximum of 50 approved programs reached")]
    MaxApprovedPrograms,
    #[msg("Program is already in the approved list")]
    ProgramAlreadyApproved,
    #[msg("Program is not in the approved list")]
    ProgramNotApproved,
    #[msg("Co-signer pubkey has not been configured")]
    CoSignerNotSet,
    #[msg("Provided co-signer does not match the configured co-signer pubkey")]
    InvalidCoSigner,
}
