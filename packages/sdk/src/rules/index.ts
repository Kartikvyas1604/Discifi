import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export class SentinelRulesClient {
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

  async createRuleSet(authority: PublicKey, maxDailyAmount: bigint, maxTxAmount: bigint) {
    const [ruleSetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('ruleset'), authority.toBuffer()],
      this.program.programId,
    );
    const tx = await this.program.methods
      .createRuleSet(maxDailyAmount, maxTxAmount)
      .accounts({ ruleSet: ruleSetPda, authority, systemProgram: PublicKey.default })
      .rpc();
    return { ruleSetPda, tx };
  }

  async updateRule(
    authority: PublicKey,
    ruleSet: PublicKey,
    ruleId: number,
    maxDailyAmount: bigint,
    maxTxAmount: bigint,
  ) {
    const tx = await this.program.methods
      .updateRule(ruleId, maxDailyAmount, maxTxAmount)
      .accounts({ ruleSet, authority })
      .rpc();
    return { tx };
  }

  async addAuthorizedProgram(authority: PublicKey, ruleSet: PublicKey, program: PublicKey) {
    const tx = await this.program.methods
      .addAuthorizedProgram(program)
      .accounts({ ruleSet, authority })
      .rpc();
    return { tx };
  }

  async removeAuthorizedProgram(authority: PublicKey, ruleSet: PublicKey, program: PublicKey) {
    const tx = await this.program.methods
      .removeAuthorizedProgram(program)
      .accounts({ ruleSet, authority })
      .rpc();
    return { tx };
  }
}
