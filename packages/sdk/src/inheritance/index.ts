import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelInheritanceClient {
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

  async setupBeneficiary(owner: PublicKey, beneficiary: PublicKey, timelockDays: number) {
    const [beneficiaryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('beneficiary'), owner.toBuffer(), beneficiary.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .setupBeneficiary(beneficiary, timelockDays)
      .accounts({ beneficiary: beneficiaryPda, owner, systemProgram: PublicKey.default })
      .rpc();
    return { beneficiaryPda, tx };
  }

  async recordHeartbeat(owner: PublicKey) {
    const tx = await this.program.methods
      .recordHeartbeat()
      .accounts({ signer: owner })
      .rpc();
    return { tx };
  }

  async claimInheritance(beneficiaryPubkey: PublicKey, beneficiaryPda: PublicKey) {
    const tx = await this.program.methods
      .claimInheritance()
      .accounts({
        beneficiary: beneficiaryPda,
        claimer: beneficiaryPubkey,
        systemProgram: PublicKey.default,
      })
      .rpc();
    return { tx };
  }

  async revokeBeneficiary(owner: PublicKey, beneficiary: PublicKey) {
    const [beneficiaryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('beneficiary'), owner.toBuffer(), beneficiary.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .revokeBeneficiary()
      .accounts({ beneficiary: beneficiaryPda, owner })
      .rpc();
    return { beneficiaryPda, tx };
  }
}
