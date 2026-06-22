import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelWalletClient {
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

  async initializeWallet(owner: PublicKey, deviceId: string) {
    const [walletPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('wallet'), owner.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .initializeWallet(deviceId)
      .accounts({ wallet: walletPda, owner, systemProgram: PublicKey.default })
      .rpc();
    return { walletPda, tx };
  }

  async approveTransfer(from: PublicKey, to: PublicKey, amount: bigint) {
    const tx = await this.program.methods
      .approveTransfer(to, amount)
      .accounts({ signer: from })
      .rpc();
    return { tx };
  }

  async setDrainProtection(owner: PublicKey, enabled: boolean) {
    const [walletPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('wallet'), owner.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .setDrainProtection(enabled)
      .accounts({ wallet: walletPda, authority: owner })
      .rpc();
    return { walletPda, tx };
  }

  async recoverWallet(owner: PublicKey, newOwner: PublicKey) {
    const [walletPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('wallet'), owner.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .recoverWallet(newOwner)
      .accounts({ wallet: walletPda, authority: owner })
      .rpc();
    return { walletPda, tx };
  }

  async freezeWallet(owner: PublicKey) {
    const [walletPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('wallet'), owner.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .freezeWallet()
      .accounts({ wallet: walletPda, authority: owner })
      .rpc();
    return { walletPda, tx };
  }

  async emergencyPause(authority: PublicKey) {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.program.programId,
    );
    const tx = await this.program.methods
      .emergencyPause()
      .accounts({ config: configPda, authority })
      .rpc();
    return tx;
  }
}
