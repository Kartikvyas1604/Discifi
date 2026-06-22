import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelStealthClient {
  public program: Program;

  constructor(
    connection: Connection,
    wallet: AnchorProvider['wallet'],
    programId: PublicKey,
    idl: Idl,
  ) {
    const provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(idl, programId, provider);
  }

  async createStealthAddress(recipient: PublicKey, ephemeralPubkey: PublicKey) {
    const [stealthPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stealth'), recipient.toBuffer(), ephemeralPubkey.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .createStealthAddress(ephemeralPubkey)
      .accounts({ stealth: stealthPda, recipient, systemProgram: PublicKey.default })
      .rpc();
    return { stealthPda, tx };
  }

  async shieldTokens(owner: PublicKey, stealth: PublicKey, amount: bigint) {
    const tx = await this.program.methods
      .shieldTokens(amount)
      .accounts({ stealth, owner })
      .rpc();
    return { tx };
  }

  async unshieldTokens(owner: PublicKey, stealth: PublicKey, amount: bigint, destination: PublicKey) {
    const tx = await this.program.methods
      .unshieldTokens(amount, destination)
      .accounts({ stealth, owner })
      .rpc();
    return { tx };
  }

  async sweepStealth(owner: PublicKey, stealth: PublicKey, destination: PublicKey) {
    const tx = await this.program.methods
      .sweepStealth(destination)
      .accounts({ stealth, owner })
      .rpc();
    return { tx };
  }
}
