# DisciFi

**Financial discipline, onchain.**

DisciFi is a self-custodial wallet that enforces programmable spending rules — called *Covenants* — directly at the transaction level. It reimagines the wallet not as a passive keyholder but as an active financial guardian that helps you stay disciplined with your digital assets.

---

## The Problem

Existing wallets are built for freedom but offer no protection from yourself. There is no way to set a daily spending limit, require cooldowns before large transfers, or automatically route incoming funds to savings — unless you trust a third-party app or build custom smart contracts. Most people lack the technical expertise or inclination to do either.

The result: impulse trades, overspending, and inconsistent saving habits that erode long-term wealth.

---

## The Vision

DisciFi introduces the concept of **onchain financial discipline** — a wallet that lets you define your own rules and enforces them automatically, without intermediaries, without exception.

The core idea is simple: you establish covenants — programmable guardrails — that govern how your wallet behaves. These are not suggestions. They are enforced at the protocol level, and you cannot break them unless you explicitly choose to, with full awareness.

---

## Covenants

Covenants are the atomic unit of discipline in DisciFi. Each covenant defines a constraint on how funds can move:

| Covenant | Description |
|----------|-------------|
| Daily Limit | Maximum spend across all transactions in a rolling 24-hour window |
| Max Per Tx | Hard cap on the value of any single transaction |
| Allowlist | Restrict outgoing transfers to only pre-approved contract addresses |
| Min Hold | Mandatory holding period before newly acquired positions can be sold |
| Auto-Save | Automatically route a percentage of incoming funds to a reserve vault |

Covenants can be combined, toggled on and off, and monitored through a unified dashboard. Every attempted transaction is evaluated against the active covenant set before execution.

---

## The Flow

1. **Onboarding** — Choose a covenant template (Guardian, Trader, Hodler, or Architect) that matches your risk profile and financial habits.
2. **Customize** — Adjust parameters like daily limits, hold periods, and auto-save percentages to fit your needs.
3. **Live Enforcement** — Every outgoing transaction is intercepted and checked against your active covenants. If a rule would be violated, you are shown a clear risk assessment and asked to consciously override or cancel.
4. **Review & Adapt** — Monitor your discipline index, review flagged transactions, and adjust covenants as your financial situation evolves.

---

## Architecture

DisciFi is a mobile-first application built on Solana. Covenants are enforced client-side with onchain verification, ensuring that your rules travel with your wallet regardless of which application you interact with. The reserve vault uses programmatic escrow to separate saved funds from your active spending balance.

---

## Why It Matters

The crypto ecosystem has spent years building better ways to earn, trade, and borrow — but almost nothing on better ways to **protect** people from their own impulses. DisciFi addresses this gap directly.

It is not a bank. It is not a roboadvisor. It is a wallet that respects your autonomy while giving you the tools to build better financial habits. It is discipline, onchain, by design.

---

*DisciFi is a conceptual prototype. It is not financial advice. Use at your own risk.*
