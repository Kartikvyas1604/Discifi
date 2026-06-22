import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelApprovalsClient {
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

  async requestApproval(owner: PublicKey, txData: string) {
    const [requestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('approval'), owner.toBuffer(), Buffer.from(txData.slice(0, 8))],
      this.program.programId,
    );
    const tx = await this.program.methods
      .requestApproval(txData)
      .accounts({ request: requestPda, owner, systemProgram: PublicKey.default })
      .rpc();
    return { requestPda, tx };
  }

  async approveRequest(approver: PublicKey, request: PublicKey) {
    const tx = await this.program.methods
      .approveRequest()
      .accounts({ request, approver })
      .rpc();
    return { tx };
  }

  async rejectRequest(approver: PublicKey, request: PublicKey) {
    const tx = await this.program.methods
      .rejectRequest()
      .accounts({ request, approver })
      .rpc();
    return { tx };
  }

  async claimRevocationReward(keeper: PublicKey, maliciousRequest: PublicKey) {
    const [rewardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('reward'), maliciousRequest.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .claimRevocationReward()
      .accounts({
        reward: rewardPda,
        keeper,
        maliciousRequest,
        systemProgram: PublicKey.default,
      })
      .rpc();
    return { rewardPda, tx };
  }
}
