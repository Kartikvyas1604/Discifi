use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum InheritanceStatus {
    Active,
    Claimable,
}

#[account]
#[derive(InitSpace)]
pub struct InheritanceConfig {
    pub owner_pubkey: Pubkey,
    pub beneficiary_pubkey: Pubkey,
    pub last_heartbeat_timestamp: i64,
    pub heartbeat_interval_seconds: i64,
    pub grace_period_seconds: i64,
    pub status: InheritanceStatus,
    pub claimed: bool,
    pub bump: u8,
}

#[event]
pub struct InheritanceStatusChanged {
    pub owner: Pubkey,
    pub status: InheritanceStatus,
    pub changed_at: i64,
}

#[event]
pub struct InheritanceClaimed {
    pub owner: Pubkey,
    pub beneficiary: Pubkey,
    pub claimed_at: i64,
}

#[derive(Accounts)]
pub struct SetupInheritance<'info> {
    #[account(
        init,
        seeds = [owner.key().as_ref(), b"sentinel-inheritance"],
        bump,
        payer = owner,
        space = 8 + InheritanceConfig::INIT_SPACE,
    )]
    pub config: Account<'info, InheritanceConfig>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendHeartbeat<'info> {
    #[account(
        mut,
        seeds = [owner.key().as_ref(), b"sentinel-inheritance"],
        bump = config.bump,
    )]
    pub config: Account<'info, InheritanceConfig>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckInheritance<'info> {
    #[account(
        mut,
        seeds = [owner.key().as_ref(), b"sentinel-inheritance"],
        bump = config.bump,
    )]
    pub config: Account<'info, InheritanceConfig>,
    /// CHECK: Permissionlessly checkable; owner is read from the config account.
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimInheritance<'info> {
    #[account(
        mut,
        seeds = [config.owner_pubkey.as_ref(), b"sentinel-inheritance"],
        bump = config.bump,
    )]
    pub config: Account<'info, InheritanceConfig>,
    /// CHECK: Beneficiary is read from config; claims permissionlessly.
    pub caller: Signer<'info>,
}

#[program]
pub mod sentinel_inheritance {
    use super::*;

    pub fn setup_inheritance(
        ctx: Context<SetupInheritance>,
        beneficiary_pubkey: Pubkey,
        heartbeat_interval_seconds: Option<i64>,
        grace_period_seconds: Option<i64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        config.owner_pubkey = ctx.accounts.owner.key();
        config.beneficiary_pubkey = beneficiary_pubkey;
        config.last_heartbeat_timestamp = clock.unix_timestamp;
        config.heartbeat_interval_seconds = heartbeat_interval_seconds.unwrap_or(31_536_000);
        config.grace_period_seconds = grace_period_seconds.unwrap_or(2_592_000);
        config.status = InheritanceStatus::Active;
        config.claimed = false;
        config.bump = ctx.bumps.config;

        Ok(())
    }

    pub fn send_heartbeat(ctx: Context<SendHeartbeat>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        config.last_heartbeat_timestamp = clock.unix_timestamp;
        if config.status == InheritanceStatus::Claimable {
            config.status = InheritanceStatus::Active;
        }

        Ok(())
    }

    pub fn check_inheritance(ctx: Context<CheckInheritance>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        let deadline = config
            .last_heartbeat_timestamp
            .checked_add(config.heartbeat_interval_seconds)
            .and_then(|v| v.checked_add(config.grace_period_seconds))
            .ok_or(ProgramError::ArithmeticOverflow)?;

        if clock.unix_timestamp > deadline && config.status != InheritanceStatus::Claimable {
            config.status = InheritanceStatus::Claimable;

            emit!(InheritanceStatusChanged {
                owner: config.owner_pubkey,
                status: InheritanceStatus::Claimable,
                changed_at: clock.unix_timestamp,
            });
        }

        Ok(())
    }

    pub fn claim_inheritance(ctx: Context<ClaimInheritance>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        require!(
            config.status == InheritanceStatus::Claimable,
            InheritanceError::NotClaimable
        );
        require!(!config.claimed, InheritanceError::AlreadyClaimed);

        config.claimed = true;

        emit!(InheritanceClaimed {
            owner: config.owner_pubkey,
            beneficiary: config.beneficiary_pubkey,
            claimed_at: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[error_code]
pub enum InheritanceError {
    #[msg("Inheritance is not in Claimable status")]
    NotClaimable,
    #[msg("Inheritance has already been claimed")]
    AlreadyClaimed,
}
