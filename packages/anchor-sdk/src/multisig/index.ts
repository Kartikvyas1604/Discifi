import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelMultisigClient {
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

  async createMultisig(owners: PublicKey[], threshold: number) {
    const [multisigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('multisig'), owners[0].toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .createMultisig(owners, threshold)
      .accounts({ multisig: multisigPda, creator: owners[0], systemProgram: PublicKey.default })
      .rpc();
    return { multisigPda, tx };
  }

  async proposeTransaction(multisig: PublicKey, proposer: PublicKey, destination: PublicKey, amount: bigint) {
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('proposal'), multisig.toBuffer(), proposer.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .proposeTransaction(destination, amount)
      .accounts({ proposal: proposalPda, multisig, proposer, systemProgram: PublicKey.default })
      .rpc();
    return { proposalPda, tx };
  }

  async approveTransaction(owner: PublicKey, multisig: PublicKey, proposal: PublicKey) {
    const tx = await this.program.methods
      .approveTransaction()
      .accounts({ proposal, multisig, signer: owner })
      .rpc();
    return { tx };
  }

  async executeTransaction(executor: PublicKey, multisig: PublicKey, proposal: PublicKey) {
    const tx = await this.program.methods
      .executeTransaction()
      .accounts({ proposal, multisig, executor })
      .rpc();
    return { tx };
  }
}
