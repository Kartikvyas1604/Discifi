# DisciFi

**Financial discipline, onchain.**

DisciFi is a self-custodial wallet that enforces programmable spending rules — called *Covenants* — directly at the transaction level. It reimagines the wallet not as a passive keyholder but as an active financial guardian that helps you stay disciplined with your digital assets.

Built with **Expo** (React Native) for iOS/Android, with a planned Node.js/PostgreSQL backend for evaluation history and risk scoring.

---

## The Problem

Existing wallets are built for freedom but offer no protection from yourself. There is no way to set a daily spending limit, require cooldowns before large transfers, or automatically route incoming funds to savings — unless you trust a third-party app or build custom smart contracts. Most people lack the technical expertise or inclination to do either.

The result: impulse trades, overspending, and inconsistent saving habits that erode long-term wealth.

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

## Screens & Tour

### Ledger (Dashboard)
Portfolio overview showing token balances (SOL, USDC, JUP, BONK), total value ($42,850.75), 24h change, and recent activity. Quick-action buttons for Send, Receive, and Swap. Tap any token for its detail view with price chart and market data.

### Covenants (Rules Management)
Toggle your active covenants on/off. View Daily Limit ($800), Auto-Save (15%), Allowlist (8 contracts), and more. Each rule shows its last-triggered time. Add new covenants via the "New Covenant" button.

### Reserve (Vault)
Accumulated auto-save balance (4,218.50 USDC) with a sparkline chart, monthly stats ($1,240 saved this month, 23-day streak), and withdraw functionality. The auto-covenant routes 15% of incoming funds here automatically.

### Transaction Gate
When a transaction would violate a covenant, this modal intercepts it with clear evidence: contract age (14 days), approval amount ($1,240), token category (Memecoin), and behavior match (New pattern). Choose **Reject** or **Proceed Anyway** — full awareness, no surprises.

### Send / Receive / Swap
Full send flow with address input, amount + MAX button, USD preview, and confirmation. Receive screen generates a QR code from your wallet address. Swap interface with from/to token selection, rate display, and slippage control.

### Onboarding
4-step wizard: Welcome → Choose a personality template (Guardian, Trader, Hodler, Architect) → Set daily limit → Confirm. Templates pre-configure your covenant bundle based on your financial style.

### Browser
In-app dApp browser with search and category filters (Swap, NFTs, Lending, Perps, Staking, Yield). Mock grid of Solana ecosystem dApps (Jupiter, Magic Eden, Orca, Kamino, Solend, Drift, Sanctum, Meteora).

### Activity
Full transaction history with filters (All, Sent, Received, Swaps) and status badges (Confirmed, Pending, Failed). 10 mock transactions across real Solana protocols.

### Settings
App configuration: covenant management, transaction history, currency (USD), app lock, auto-lock timer, documentation links, and a danger zone for resetting covenants or deleting the wallet.

---

## Architecture

```
discifi/
├── App.tsx                    # Entry point — font loading, splash screen, navigation
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Stack + Bottom Tab navigation (Ledger, Covenants, Reserve)
│   ├── screens/               # 12 screens: all app views
│   │   ├── OnboardingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── RulesScreen.tsx
│   │   ├── VaultScreen.tsx
│   │   ├── TransactionGateScreen.tsx
│   │   ├── SendScreen.tsx
│   │   ├── ReceiveScreen.tsx
│   │   ├── SwapScreen.tsx
│   │   ├── ActivityScreen.tsx
│   │   ├── TokenDetailScreen.tsx
│   │   ├── BrowserScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   └── Icons.tsx          # 18 custom SVG icons (Wallet, Shield, Vault, Swap, etc.)
│   ├── theme/
│   │   └── index.ts           # Dark theme tokens, spacing, typography, formatters
│   └── animations/            # Reanimated animation primitives (extensible)
├── assets/                    # App icons, splash screen assets
├── backend/                   # Node.js/PostgreSQL backend (in progress)
└── app.json                   # Expo config
```

### Navigation Structure

```
Root Stack (Native Stack)
├── MainTabs (Bottom Tab Navigator)
│   ├── Ledger     → DashboardScreen   (Wallet icon)
│   ├── Covenants  → RulesScreen       (Shield icon)
│   └── Reserve    → VaultScreen       (Vault icon)
├── Send           (modal, slide from bottom)
├── Receive        (modal, slide from bottom)
├── Swap           (modal, slide from bottom)
├── Activity       (push, slide from right)
├── Browser        (modal, slide from bottom)
├── TokenDetail    (push, with params)
└── Settings       (push)
```

Modals: OnboardingScreen (shown on first launch), TransactionGateScreen (shown when a transaction triggers a covenant violation).

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56 (React Native 0.85, React 19) |
| Navigation | @react-navigation/native-stack + bottom-tabs v7 |
| Animations | react-native-reanimated 4.3 |
| Graphics | react-native-svg (icons, sparklines, QR codes) |
| Fonts | Inter (Google Fonts via expo-google-fonts) |
| Language | TypeScript ~6.0 |
| Lists | @shopify/flash-list 2.0 (available for perf-sensitive lists) |

### Planned Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| API | Express REST |
| Database | PostgreSQL 16 |
| Auth | ECDSA signature verification (viem) |
| Block Explorer | Snowtrace API (Avalanche Fuji) |

---

## Getting Started

### Prerequisites
- Node.js 22+
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode) or Android Emulator, or a physical device with Expo Go

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/discifi.git
cd discifi

# Install dependencies
npm install

# Start the Expo dev server
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` (iOS Simulator) / `a` (Android Emulator).

### Backend (coming soon)

```bash
cd backend
npm install
cp .env.example .env    # Add BLOCK_EXPLORER_API_KEY, DATABASE_URL
docker compose up -d    # Start PostgreSQL
npx ts-node src/index.ts
```

---

## Project Status

**Phase 1 — UI Complete** ✅
- All 12 screens built with dark theme, custom SVG icons, Reanimated animations
- Bottom-tab navigation with Ledger / Covenants / Reserve tabs
- Mock data for 4 tokens, 5 covenant types, 10+ transactions across real Solana protocols
- Onboarding wizard with 4 personality templates
- Transaction Gate modal with evaluation evidence display
- Sparkline charts (Vault, Token Detail) and QR code generator (Receive)
- DApp browser with search and category filters

**Phase 2 — Backend (in progress)**
- Node.js/Express REST API with TypeScript
- PostgreSQL schema for wallets, rules, risk profiles, transaction evaluations
- ECDSA signature-based authentication with nonce replay protection
- 4-rule evaluation pipeline: spend limit, cooldown, contract age filter, auto-save
- Snowtrace block explorer integration for real risk scoring
- 22+ unit tests on evaluation functions and aggregator

---

## Why It Matters

The crypto ecosystem has spent years building better ways to earn, trade, and borrow — but almost nothing on better ways to **protect** people from their own impulses. DisciFi addresses this gap directly.

It is not a bank. It is not a roboadvisor. It is a wallet that respects your autonomy while giving you the tools to build better financial habits. It is discipline, onchain, by design.

---

## FAQ

**Is this a real wallet? Can I use it today?**
DisciFi is a conceptual prototype. The frontend UI is fully built with mock data; backend integration is in progress. It is not yet connected to any live network.

**Which chain does it use?**
The frontend mock data references Solana addresses and protocols (Jupiter, Orca, Magic Eden, etc.). The planned backend targets Avalanche Fuji (CCTP) with Snowtrace as the block explorer. Cross-chain support is a future goal.

**Are private keys stored on the server?**
No. Authentication uses ECDSA signature verification. Your private keys never leave your device.

**Can I add my own covenants?**
Yes. The Covenants screen has a "New Covenant" button for creating custom rules. The 5 built-in types cover the most common patterns.

---

*DisciFi is a conceptual prototype. It is not financial advice. Use at your own risk.*
