# DisciFi Sentinel

> Programmable spending rules enforced on-chain — the self-custodial Solana wallet that protects you from hackers, drains, and yourself.

## Problem

Over $3 billion has been drained from crypto wallets through phishing attacks, unlimited token approvals, and impulsive trading decisions. Existing hardware wallets are passive signers — they approve whatever the user confirms without any intelligence about whether the transaction is safe or within the user's own financial intentions.

## Solution

DisciFi Sentinel is an on-chain Solana program built with Anchor that enforces programmable financial covenants at the smart contract level. Before any transaction is approved the program evaluates it against the user's configured rules — daily spend limits, per-transaction caps, velocity limits — and blocks it on-chain if any rule is violated. No frontend, no backend, no trusted party can override these rules. They are enforced by the Solana runtime itself.

## Features

- Daily spending limits enforced on-chain with automatic midnight reset
- Per-transaction caps that block single large transfers
- Velocity limiting — maximum transactions per hour
- Auto-save basis points for routing a percentage of incoming funds to savings
- Emergency freeze — one instruction locks the wallet completely
- Permissionless daily limit reset — anyone can trigger the reset making it trustless
- Full event emission for every state change — fully auditable on-chain history

## Program ID (Devnet)

```
FeMeEBKUt7iWk116n5UPm8fZApV91ngqFfQjMV8Zwhaa
```

Verify on Solana Explorer: https://explorer.solana.com/address/FeMeEBKUt7iWk116n5UPm8fZApV91ngqFfQjMV8Zwhaa?cluster=devnet

## Tech Stack

- Solana blockchain
- Anchor framework (Rust)
- TypeScript test suite
- Devnet deployment

## Getting Started

Prerequisites: Rust, Solana CLI, Anchor CLI, Node.js

```bash
git clone https://github.com/YOUR_USERNAME/discifi-sentinel
cd discifi-sentinel
pnpm install
anchor build
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json anchor test --provider.cluster devnet
```

## Test Results

```
  discifi_sentinel
    ✔ Initializes wallet with correct default rules (1706ms)
    ✔ Approves transaction within daily limit (5786ms)
    ✔ Approves multiple transactions that sum within daily limit (7626ms)
    ✔ Blocks transaction that would exceed daily limit (2400ms)
    ✔ Blocks single transaction exceeding per-transaction limit (1488ms)
    ✔ Updates rules successfully (2369ms)
    ✔ Rejects unauthorized rule update (4091ms)
    ✔ Toggles rules off and on (29145ms)
    ✔ Emergency freeze blocks all transactions (6198ms)
    ✔ Permissionless daily reset works after 24 hours (22006ms)

  10 passing (1m)
```

All 10 tests passing on devnet as of June 2026.

## Instructions

| Instruction | Description |
|---|---|
| initialize_wallet | Create wallet config with spending rules |
| update_rules | Modify any rule parameter |
| evaluate_and_record_transaction | Evaluate and enforce rules on a transaction |
| reset_daily_limit | Permissionless daily limit reset |
| toggle_rules | Enable or disable rule enforcement |
| emergency_freeze | Immediately freeze all spending |

## Architecture

Each user's rules are stored in a WalletConfig PDA derived from their public key. Every transaction evaluation creates a SpendingRecord PDA providing a complete immutable audit trail of all spending activity and rule triggers on-chain.

## Future Roadmap

- Hardware card integration for physical signing confirmation
- ZK privacy layer for stealth addresses on Solana
- NFT drain protection and approval expiry
- DAO voting mode with transfer restrictions
- Mobile app with real-time rule enforcement

## License
MIT
