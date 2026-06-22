# DisciFi Sentinel - Demo Day Presentation Script (2 Minutes)

---

### SLIDE 1 — PROBLEM (20 seconds)

"Three billion dollars stolen from crypto wallets last year. Phishing links. Fake DEXes. Panic selling at 3AM. Every single attack succeeds because wallets are dumb — they sign whatever you tell them to. There is no protection between you and your worst decision."

---

### SLIDE 2 — SOLUTION (20 seconds)

"DisciFi Sentinel puts programmable rules on-chain using Anchor. You set an $800 daily limit. You set a $250 per-transaction cap. You set a max 10 transactions per hour. The Solana program enforces all of it. No frontend can override it. No hacker can bypass it. The rules are enforced by the Solana runtime itself."

---

### SLIDE 3 — TECHNICAL ARCHITECTURE (25 seconds)

"Here is how it works. The user calls initialize_wallet with their rules. Every transaction goes through evaluate_and_record_transaction. The program checks daily limit, per-transaction limit, and velocity. If any rule is violated — the transaction is blocked on-chain. Every evaluation creates an immutable SpendingRecord PDA — a full audit trail of every transaction and every rule trigger. There is also an emergency_freeze instruction — one call locks the entire wallet."

---

### SLIDE 4 — LIVE DEMO (35 seconds)

"Let me show you the tests passing on devnet." [SHOW TERMINAL OR RECORDING OF `anchor test --provider.cluster devnet`] "You can see 10 tests — wallet initialization, transactions within limits approving, transactions that exceed limits being blocked with the correct error codes, emergency freeze working. All passing on devnet. Program ID is on screen — you can verify it on Solana Explorer right now."

---

### SLIDE 5 — WHAT IS NEXT (20 seconds)

"The on-chain program is the foundation. Next is the hardware card — a credit-card sized device that enforces these same rules at the hardware signing layer. And a mobile app that gives every user a Bloomberg terminal in their wallet. DisciFi Sentinel — your rules, enforced by Solana."
