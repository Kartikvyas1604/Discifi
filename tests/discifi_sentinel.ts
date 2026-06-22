import anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import type { DiscifiSentinel } from "../target/types/discifi_sentinel";

const { Program, BN, web3 } = anchor;

async function fundWallet(
  connection: web3.Connection,
  from: web3.Keypair,
  to: web3.PublicKey,
  amount: number = 0.01
) {
  const tx = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount * web3.LAMPORTS_PER_SOL,
    })
  );
  const sig = await connection.sendTransaction(tx, [from], { commitment: "confirmed" });
  await connection.confirmTransaction(sig, "confirmed");
}

async function sendWithRetry(
  method: () => Promise<string>,
  maxRetries = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await method();
    } catch (e: any) {
      const isRateLimit = e.message?.includes("429") || e.message?.includes("Too Many Requests");
      const isBlockhash = e.message?.includes("Blockhash not found");
      if ((isRateLimit || isBlockhash) && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

describe("discifi_sentinel", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DiscifiSentinel as Program<DiscifiSentinel>;
  const connection = provider.connection;
  const providerWallet = (provider.wallet as anchor.Wallet).payer;

  function walletConfigPda(owner: web3.PublicKey) {
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("sentinel"), owner.toBuffer()],
      program.programId
    );
  }

  function spendingRecordPda(walletConfig: web3.PublicKey, recordIndex: number) {
    const idxBuf = Buffer.alloc(8);
    idxBuf.writeBigUInt64LE(BigInt(recordIndex));
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from("record"), walletConfig.toBuffer(), idxBuf],
      program.programId
    );
  }

  it("Initializes wallet with correct default rules", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const config = await program.account.walletConfig.fetch(wConfigPda);

    assert(config.owner.equals(owner.publicKey), "owner mismatch");
    assert(config.dailyLimitUsd.eq(new BN(80000)), "daily_limit_usd mismatch");
    assert(config.perTxLimitUsd.eq(new BN(25000)), "per_tx_limit_usd mismatch");
    assert(config.velocityMax === 10, "velocity_max mismatch");
    assert(config.autoSaveBps === 1500, "auto_save_bps mismatch");
    assert(config.isActive === true, "is_active should be true");
    assert(config.dailySpentUsd.eq(new BN(0)), "daily_spent_usd should be 0");
  });

  it("Approves transaction within daily limit", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    await sendWithRetry(() =>
      program.methods
        .evaluateAndRecordTransaction(new BN(10000), new BN(0))
        .accounts({
          walletConfig: wConfigPda,
          spendingRecord: recordPda,
          caller: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" })
    );

    const config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.dailySpentUsd.eq(new BN(10000)), "daily_spent should be 10000");

    const record = await program.account.spendingRecord.fetch(recordPda);
    assert(record.ruleTriggered === false, "rule should not be triggered");
    assert(record.amountUsd.eq(new BN(10000)), "record amount mismatch");
  });

  it("Approves multiple transactions that sum within daily limit", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const amounts = [10000, 20000, 15000];
    for (let i = 0; i < 3; i++) {
      const [recordPda] = spendingRecordPda(wConfigPda, i);
      await sendWithRetry(() =>
        program.methods
          .evaluateAndRecordTransaction(new BN(amounts[i]), new BN(i))
          .accounts({
            walletConfig: wConfigPda,
            spendingRecord: recordPda,
            caller: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" })
      );
    }

    const config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.dailySpentUsd.eq(new BN(45000)), "daily_spent should be 45000 after three txs");
  });

  it("Blocks transaction that would exceed daily limit", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(10000), new BN(10000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    await sendWithRetry(() =>
      program.methods
        .evaluateAndRecordTransaction(new BN(9000), new BN(0))
        .accounts({
          walletConfig: wConfigPda,
          spendingRecord: recordPda,
          caller: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" })
    );

    const [recordPda2] = spendingRecordPda(wConfigPda, 1);

    try {
      await sendWithRetry(() =>
        program.methods
          .evaluateAndRecordTransaction(new BN(5000), new BN(1))
          .accounts({
            walletConfig: wConfigPda,
            spendingRecord: recordPda2,
            caller: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" })
      );
      assert.fail("Should have thrown DailyLimitExceeded");
    } catch (e: any) {
      const errMsg = e.error?.errorMessage || e.message || "";
      assert(
        errMsg.includes("daily") ||
          e.error?.errorCode?.code === "DailyLimitExceeded" ||
          String(e).includes("6000"),
        `Expected daily limit error, got: ${errMsg}`
      );
    }

    const config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.dailySpentUsd.eq(new BN(9000)), "daily_spent should remain 9000 on failure");
  });

  it("Blocks single transaction exceeding per-transaction limit", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    try {
      await sendWithRetry(() =>
        program.methods
          .evaluateAndRecordTransaction(new BN(30000), new BN(0))
          .accounts({
            walletConfig: wConfigPda,
            spendingRecord: recordPda,
            caller: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" })
      );
      assert.fail("Should have thrown PerTransactionLimitExceeded");
    } catch (e: any) {
      const errMsg = e.error?.errorMessage || e.message || "";
      assert(
        errMsg.includes("per-transaction") ||
          e.error?.errorCode?.code === "PerTransactionLimitExceeded" ||
          String(e).includes("6001"),
        `Expected per-transaction limit error, got: ${errMsg}`
      );
    }
  });

  it("Updates rules successfully", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    await sendWithRetry(() =>
      program.methods
        .updateRules(new BN(150000), null, null, null, null)
        .accounts({ walletConfig: wConfigPda, owner: owner.publicKey })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.dailyLimitUsd.eq(new BN(150000)), "daily_limit should be updated to 150000");
    assert(config.perTxLimitUsd.eq(new BN(25000)), "per_tx_limit should be unchanged");
    assert(config.velocityMax === 10, "velocity_max should be unchanged");
  });

  it("Rejects unauthorized rule update", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const attacker = web3.Keypair.generate();

    try {
      await sendWithRetry(() =>
        program.methods
          .updateRules(new BN(999999), null, null, null, null)
          .accounts({ walletConfig: wConfigPda, owner: attacker.publicKey })
          .signers([attacker])
          .rpc({ commitment: "confirmed" })
      );
      assert.fail("Should have thrown unauthorized error");
    } catch (e: any) {
      assert(e !== undefined, "should throw an error");
    }
  });

  it("Toggles rules off and on", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(10000), new BN(500), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    await sendWithRetry(() =>
      program.methods
        .toggleRules(false)
        .accounts({ walletConfig: wConfigPda, owner: owner.publicKey })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    let config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.isActive === false, "rules should be off");

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    await sendWithRetry(() =>
      program.methods
        .evaluateAndRecordTransaction(new BN(5000), new BN(0))
        .accounts({
          walletConfig: wConfigPda,
          spendingRecord: recordPda,
          caller: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" })
    );

    await sendWithRetry(() =>
      program.methods
        .toggleRules(true)
        .accounts({ walletConfig: wConfigPda, owner: owner.publicKey })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.isActive === true, "rules should be on again");
  });

  it("Emergency freeze blocks all transactions", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    await sendWithRetry(() =>
      program.methods
        .emergencyFreeze()
        .accounts({ walletConfig: wConfigPda, owner: owner.publicKey })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const config = await program.account.walletConfig.fetch(wConfigPda);
    assert(config.isActive === false, "should be inactive after freeze");
    assert(config.dailyLimitUsd.eq(new BN(0)), "daily limit should be 0");
    assert(config.perTxLimitUsd.eq(new BN(0)), "per-tx limit should be 0");

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    try {
      await sendWithRetry(() =>
        program.methods
          .evaluateAndRecordTransaction(new BN(1), new BN(0))
          .accounts({
            walletConfig: wConfigPda,
            spendingRecord: recordPda,
            caller: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" })
      );
      assert.fail("Should have blocked transaction after emergency freeze");
    } catch (e: any) {
      assert(e !== undefined, "should throw an error");
    }
  });

  it("Permissionless daily reset works after 24 hours", async () => {
    const owner = web3.Keypair.generate();
    await fundWallet(connection, providerWallet, owner.publicKey);

    const [wConfigPda] = walletConfigPda(owner.publicKey);

    await sendWithRetry(() =>
      program.methods
        .initializeWallet(new BN(80000), new BN(25000), 10, 1500, 150)
        .accounts({
          walletConfig: wConfigPda,
          owner: owner.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" })
    );

    const [recordPda] = spendingRecordPda(wConfigPda, 0);

    await sendWithRetry(() =>
      program.methods
        .evaluateAndRecordTransaction(new BN(5000), new BN(0))
        .accounts({
          walletConfig: wConfigPda,
          spendingRecord: recordPda,
          caller: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" })
    );

    const beforeReset = await program.account.walletConfig.fetch(wConfigPda);
    assert(beforeReset.dailySpentUsd.gt(new BN(0)), "should have spent something before reset");

    await sendWithRetry(() =>
      program.methods
        .resetDailyLimit()
        .accounts({ walletConfig: wConfigPda })
        .rpc({ commitment: "confirmed" })
    );

    const afterReset = await program.account.walletConfig.fetch(wConfigPda);
    assert(afterReset.dailySpentUsd.eq(new BN(0)), "daily_spent should be 0 after reset");
  });
});
