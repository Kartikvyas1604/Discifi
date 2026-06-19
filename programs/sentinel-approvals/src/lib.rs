use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod sentinel_approvals {
    use super::*;

    pub fn record_approval(
        ctx: Context<RecordApproval>,
        approved_amount: u64,
        expiry_timestamp: i64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let approval = &mut ctx.accounts.approval_record;

        if approval.created_at == 0 {
            approval.wallet_pubkey = ctx.accounts.wallet.key();
            approval.spender_pubkey = ctx.accounts.spender.key();
            approval.token_mint = ctx.accounts.token_mint.key();
            approval.created_at = clock.unix_timestamp;
            approval.times_used = 0;
            approval.bump = ctx.bumps.approval_record;
        }

        approval.approved_amount = approved_amount;
        approval.expiry_timestamp = expiry_timestamp;
        approval.last_used_at = clock.unix_timestamp;
        approval.times_used = approval
            .times_used
            .checked_add(1)
            .ok_or(ApprovalError::Overflow)?;
        approval.is_active = true;

        Ok(())
    }

    pub fn expire_approval(ctx: Context<ExpireApproval>) -> Result<()> {
        let clock = Clock::get()?;
        let approval = &mut ctx.accounts.approval_record;

        require!(
            clock.unix_timestamp > approval.expiry_timestamp,
            ApprovalError::NotYetExpired
        );
        require!(approval.is_active, ApprovalError::AlreadyInactive);

        approval.is_active = false;
        approval.last_used_at = clock.unix_timestamp;

        let pool = &mut ctx.accounts.revocation_reward_pool;
        if pool.reward_per_expiry == 0 {
            pool.reward_per_expiry = 1_000_000;
            pool.bump = ctx.bumps.revocation_reward_pool;
        }

        let reward = pool.reward_per_expiry;
        if pool.total_rewards >= reward {
            pool.total_rewards = pool
                .total_rewards
                .checked_sub(reward)
                .ok_or(ApprovalError::Overflow)?;

            let pool_lamports = pool.to_account_info().lamports();
            let payer_lamports = ctx.accounts.payer.lamports();

            **pool.to_account_info().try_borrow_mut_lamports()? =
                pool_lamports.checked_sub(reward).ok_or(ApprovalError::Overflow)?;
            **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? =
                payer_lamports.checked_add(reward).ok_or(ApprovalError::Overflow)?;
        }

        Ok(())
    }

    pub fn revoke_approval(ctx: Context<RevokeApproval>) -> Result<()> {
        let clock = Clock::get()?;
        let approval = &mut ctx.accounts.approval_record;

        require!(approval.is_active, ApprovalError::AlreadyInactive);

        approval.is_active = false;
        approval.last_used_at = clock.unix_timestamp;

        emit!(RevokeEvent {
            wallet_pubkey: approval.wallet_pubkey,
            spender_pubkey: approval.spender_pubkey,
            token_mint: approval.token_mint,
            revoked_at: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn get_approval_health(ctx: Context<ApprovalHealth>) -> Result<()> {
        let clock = Clock::get()?;
        let wallet_key = ctx.accounts.wallet.key();
        let mut total_active: u32 = 0;
        let mut stale_count: u32 = 0;

        for info in ctx.remaining_accounts.iter() {
            if info.owner != &crate::ID {
                continue;
            }
            let data = info.try_borrow_data()?;
            if data.len() < 8 + ApprovalRecord::INIT_SPACE {
                continue;
            }
            if let Ok(approval) = ApprovalRecord::try_deserialize(&mut &data[..]) {
                if approval.wallet_pubkey != wallet_key {
                    continue;
                }
                if approval.is_active {
                    total_active = total_active.checked_add(1).unwrap();
                    if clock.unix_timestamp > approval.expiry_timestamp {
                        stale_count = stale_count.checked_add(1).unwrap();
                    }
                }
            }
        }

        let score: u8 = if total_active == 0 {
            100
        } else {
            let pct = (stale_count as u64)
                .checked_mul(100)
                .unwrap()
                .checked_div(total_active as u64)
                .unwrap();
            (100u64).checked_sub(pct).unwrap() as u8
        };

        emit!(ApprovalHealthEvent {
            wallet_pubkey: wallet_key,
            score,
            stale_count,
            total_active,
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct ApprovalRecord {
    pub wallet_pubkey: Pubkey,
    pub spender_pubkey: Pubkey,
    pub token_mint: Pubkey,
    pub approved_amount: u64,
    pub expiry_timestamp: i64,
    pub created_at: i64,
    pub last_used_at: i64,
    pub times_used: u32,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RevocationRewardPool {
    pub total_rewards: u64,
    pub reward_per_expiry: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct RecordApproval<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,
    #[account(
        init_if_needed,
        payer = wallet,
        space = 8 + ApprovalRecord::INIT_SPACE,
        seeds = [wallet.key().as_ref(), spender.key().as_ref(), token_mint.key().as_ref(), b"sentinel-approval"],
        bump,
    )]
    pub approval_record: Account<'info, ApprovalRecord>,
    /// CHECK: Used for PDA seed derivation only
    pub spender: UncheckedAccount<'info>,
    /// CHECK: Used for PDA seed derivation only
    pub token_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExpireApproval<'info> {
    #[account(
        mut,
        seeds = [approval_record.wallet_pubkey.as_ref(), approval_record.spender_pubkey.as_ref(), approval_record.token_mint.as_ref(), b"sentinel-approval"],
        bump = approval_record.bump,
    )]
    pub approval_record: Account<'info, ApprovalRecord>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + RevocationRewardPool::INIT_SPACE,
        seeds = [b"revocation-reward"],
        bump,
    )]
    pub revocation_reward_pool: Account<'info, RevocationRewardPool>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeApproval<'info> {
    pub wallet: Signer<'info>,
    #[account(
        mut,
        seeds = [wallet.key().as_ref(), approval_record.spender_pubkey.as_ref(), approval_record.token_mint.as_ref(), b"sentinel-approval"],
        bump = approval_record.bump,
        constraint = approval_record.wallet_pubkey == wallet.key() @ ApprovalError::WalletMismatch,
    )]
    pub approval_record: Account<'info, ApprovalRecord>,
}

#[derive(Accounts)]
pub struct ApprovalHealth<'info> {
    pub wallet: Signer<'info>,
}

#[event]
pub struct RevokeEvent {
    pub wallet_pubkey: Pubkey,
    pub spender_pubkey: Pubkey,
    pub token_mint: Pubkey,
    pub revoked_at: i64,
}

#[event]
pub struct ApprovalHealthEvent {
    pub wallet_pubkey: Pubkey,
    pub score: u8,
    pub stale_count: u32,
    pub total_active: u32,
}

#[error_code]
pub enum ApprovalError {
    #[msg("Approval has not expired yet")]
    NotYetExpired,
    #[msg("Approval is already inactive")]
    AlreadyInactive,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Wallet does not match the approval record")]
    WalletMismatch,
}
