use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[event]
pub struct StealthTransferAnnounced {
    pub ephemeral_pubkey: Pubkey,
    pub stealth_address: Pubkey,
    pub amount: u64,
}

#[event]
pub struct StealthTransferClaimed {
    pub stealth_address: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StealthMeta {
    pub owner: Pubkey,
    pub spend_pubkey: [u8; 32],
    pub view_pubkey: [u8; 32],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StealthTransfer {
    pub sender: Pubkey,
    pub ephemeral_pubkey: Pubkey,
    pub stealth_address: Pubkey,
    pub amount: u64,
    pub claimed: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct RegisterStealthMeta<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + StealthMeta::INIT_SPACE,
        seeds = [owner.key().as_ref(), b"sentinel-stealth-meta"],
        bump,
    )]
    pub stealth_meta: Account<'info, StealthMeta>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ephemeral_pubkey: Pubkey)]
pub struct AnnounceStealthTransfer<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + StealthTransfer::INIT_SPACE,
        seeds = [ephemeral_pubkey.as_ref(), b"sentinel-stealth-transfer"],
        bump,
    )]
    pub stealth_transfer: Account<'info, StealthTransfer>,
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: The computed one-time stealth address; receives the transferred SOL
    #[account(mut)]
    pub stealth_address: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ephemeral_pubkey: Pubkey)]
pub struct ClaimStealthTransfer<'info> {
    #[account(
        mut,
        seeds = [ephemeral_pubkey.as_ref(), b"sentinel-stealth-transfer"],
        bump,
    )]
    pub stealth_transfer: Account<'info, StealthTransfer>,
    /// CHECK: Proves stealth address ownership via Ed25519 transaction signature
    #[account(mut)]
    pub stealth_address: Signer<'info>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ScanStealthTransfers {}

#[program]
pub mod sentinel_stealth {
    use super::*;

    pub fn register_stealth_meta(
        ctx: Context<RegisterStealthMeta>,
        spend_pubkey: [u8; 32],
        view_pubkey: [u8; 32],
    ) -> Result<()> {
        let meta = &mut ctx.accounts.stealth_meta;
        meta.owner = ctx.accounts.owner.key();
        meta.spend_pubkey = spend_pubkey;
        meta.view_pubkey = view_pubkey;
        meta.bump = ctx.bumps.stealth_meta;
        Ok(())
    }

    pub fn announce_stealth_transfer(
        ctx: Context<AnnounceStealthTransfer>,
        ephemeral_pubkey: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let stealth_address = ctx.accounts.stealth_address.key();
        let clock = Clock::get()?;

        let transfer = &mut ctx.accounts.stealth_transfer;
        transfer.sender = ctx.accounts.sender.key();
        transfer.ephemeral_pubkey = ephemeral_pubkey;
        transfer.stealth_address = stealth_address;
        transfer.amount = amount;
        transfer.claimed = false;
        transfer.created_at = clock.unix_timestamp;
        transfer.bump = ctx.bumps.stealth_transfer;

        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.sender.key(),
                &stealth_address,
                amount,
            ),
            &[
                ctx.accounts.sender.to_account_info(),
                ctx.accounts.stealth_address.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(StealthTransferAnnounced {
            ephemeral_pubkey,
            stealth_address,
            amount,
        });

        Ok(())
    }

    pub fn claim_stealth_transfer(
        ctx: Context<ClaimStealthTransfer>,
        _ephemeral_pubkey: Pubkey,
    ) -> Result<()> {
        let stealth_transfer = &mut ctx.accounts.stealth_transfer;

        require!(!stealth_transfer.claimed, StealthError::AlreadyClaimed);

        require!(
            ctx.accounts.stealth_address.key() == stealth_transfer.stealth_address,
            StealthError::InvalidStealthAddress
        );

        let amount = stealth_transfer.amount;

        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.stealth_address.key(),
                &ctx.accounts.recipient.key(),
                amount,
            ),
            &[
                ctx.accounts.stealth_address.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        stealth_transfer.claimed = true;

        emit!(StealthTransferClaimed {
            stealth_address: stealth_transfer.stealth_address,
            recipient: ctx.accounts.recipient.key(),
            amount,
        });

        Ok(())
    }

    pub fn scan_stealth_transfers(
        _ctx: Context<ScanStealthTransfers>,
        _stealth_address: Pubkey,
    ) -> Result<()> {
        // Client-side query: use getProgramAccounts with memcmp filters:
        //   - offset 8 (discriminator) + 32 (sender) + 32 (ephemeral_pubkey) for stealth_address [u8; 32]
        //   - offset 8 + 32 + 32 + 32 + 8 (amount) for claimed [u8; 1] (value 0x00)
        // Deserialize and return all StealthTransfer accounts where claimed == false.
        Ok(())
    }
}

#[error_code]
pub enum StealthError {
    #[msg("Transfer has already been claimed")]
    AlreadyClaimed,
    #[msg("Stealth address does not match the transfer record")]
    InvalidStealthAddress,
}
