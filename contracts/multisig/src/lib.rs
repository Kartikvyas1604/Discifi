use anchor_lang::prelude::*;

declare_id!("SeMuLtiSig111111111111111111111111111111111");

#[account]
#[derive(InitSpace)]
pub struct MultisigSession {
    pub initiator_pubkey: Pubkey,
    pub co_signer_pubkey: Pubkey,
    pub transaction_hash: [u8; 32],
    pub initiator_signed: bool,
    pub co_signer_signed: bool,
    pub created_at: i64,
    pub expiry_at: i64,
    pub executed: bool,
    pub bump: u8,
}

#[program]
pub mod sentinel_multisig {
    use super::*;

    pub fn create_multisig_session(
        ctx: Context<CreateMultisigSession>,
        session_nonce: u64,
        transaction_hash: [u8; 32],
    ) -> Result<()> {
        let clock = Clock::get()?;
        let session = &mut ctx.accounts.multisig_session;

        session.initiator_pubkey = ctx.accounts.initiator.key();
        session.co_signer_pubkey = ctx.accounts.co_signer.key();
        session.transaction_hash = transaction_hash;
        session.initiator_signed = true;
        session.co_signer_signed = false;
        session.created_at = clock.unix_timestamp;
        session.expiry_at = clock.unix_timestamp + 600;
        session.executed = false;
        session.bump = ctx.bumps.multisig_session;

        Ok(())
    }

    pub fn co_sign_session(ctx: Context<CoSignSession>) -> Result<()> {
        let clock = Clock::get()?;
        let session = &mut ctx.accounts.multisig_session;

        require!(
            clock.unix_timestamp < session.expiry_at,
            MultisigError::SessionExpired
        );

        require!(
            ctx.accounts.co_signer.key() == session.co_signer_pubkey,
            MultisigError::InvalidCoSigner
        );

        session.co_signer_signed = true;

        Ok(())
    }

    pub fn execute_multisig_transaction(
        ctx: Context<ExecuteMultisigTransaction>,
    ) -> Result<[u8; 32]> {
        let clock = Clock::get()?;
        let session = &ctx.accounts.multisig_session;

        require!(
            session.initiator_signed && session.co_signer_signed,
            MultisigError::MissingSignatures
        );

        require!(!session.executed, MultisigError::AlreadyExecuted);

        require!(
            clock.unix_timestamp < session.expiry_at,
            MultisigError::SessionExpired
        );

        let tx_hash = session.transaction_hash;

        let session_mut = &mut ctx.accounts.multisig_session;
        session_mut.executed = true;

        Ok(tx_hash)
    }

    pub fn expire_session(ctx: Context<ExpireSession>) -> Result<()> {
        let clock = Clock::get()?;
        let session = &ctx.accounts.multisig_session;

        require!(
            clock.unix_timestamp >= session.expiry_at,
            MultisigError::SessionNotExpired
        );

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(session_nonce: u64)]
pub struct CreateMultisigSession<'info> {
    #[account(
        init,
        payer = initiator,
        space = 8 + MultisigSession::INIT_SPACE,
        seeds = [
            initiator.key().as_ref(),
            &session_nonce.to_le_bytes(),
            b"sentinel-multisig",
        ],
        bump,
    )]
    pub multisig_session: Account<'info, MultisigSession>,

    #[account(mut)]
    pub initiator: Signer<'info>,

    /// CHECK: Co-signer pubkey is recorded; they do not sign at creation time.
    pub co_signer: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(session_nonce: u64)]
pub struct CoSignSession<'info> {
    /// CHECK: Used for PDA derivation. Must match the initiator stored in the session.
    pub initiator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            initiator.key().as_ref(),
            &session_nonce.to_le_bytes(),
            b"sentinel-multisig",
        ],
        bump = multisig_session.bump,
    )]
    pub multisig_session: Account<'info, MultisigSession>,

    pub co_signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(session_nonce: u64)]
pub struct ExecuteMultisigTransaction<'info> {
    /// CHECK: Used for PDA derivation.
    pub initiator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            initiator.key().as_ref(),
            &session_nonce.to_le_bytes(),
            b"sentinel-multisig",
        ],
        bump = multisig_session.bump,
    )]
    pub multisig_session: Account<'info, MultisigSession>,
}

#[derive(Accounts)]
#[instruction(session_nonce: u64)]
pub struct ExpireSession<'info> {
    /// CHECK: Used for PDA derivation.
    pub initiator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            initiator.key().as_ref(),
            &session_nonce.to_le_bytes(),
            b"sentinel-multisig",
        ],
        bump = multisig_session.bump,
        close = rent_receiver,
    )]
    pub multisig_session: Account<'info, MultisigSession>,

    /// CHECK: Receives the rent lamports after account closure.
    #[account(mut)]
    pub rent_receiver: UncheckedAccount<'info>,
}

#[error_code]
pub enum MultisigError {
    #[msg("The multisig session has expired.")]
    SessionExpired,
    #[msg("The provided co-signer does not match the session record.")]
    InvalidCoSigner,
    #[msg("Both parties must sign before the transaction can be executed.")]
    MissingSignatures,
    #[msg("This transaction has already been executed.")]
    AlreadyExecuted,
    #[msg("The session has not yet expired.")]
    SessionNotExpired,
}
