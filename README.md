# DisciFi Sentinel

**Production-grade, privacy-first, drain-proof hardware wallet system on Solana**

DisciFi Sentinel is a comprehensive security middleware that protects Solana wallets from drain attacks, phishing, and unauthorized transactions. It combines an **Expo React Native mobile app** with on-chain **Anchor smart contracts** (6 programs) and an off-chain **Fastify backend** to provide real-time transaction analysis, device-bound authentication, and privacy-preserving routing.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│               Expo React Native Mobile App (src/)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │Onboarding│ │ Dashboard│ │  Send /  │ │ Transaction   │  │
│  │  +Create  │ │ +Balance │ │  Receive  │ │ Gate (Approve) │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌─────────────────── Crypto Module (src/crypto/) ─────────┐  │
│  │  BIP39 │ SLIP10 │ BIP44 │ NaCl Box │ Ed25519 │ Helius  │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────┬───────────────┘
                     │ HTTPS (TLS 1.3)         │ WebSocket
                     ▼                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Fastify Backend (apps/backend/)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Device   │ │ Drain    │ │ Rule     │ │ Privacy  │        │
│  │ Auth     │ │ Detection│ │ Engine   │ │ Routing  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Stealth  │ │ Spending │ │ Inherit- │ │ Simula-  │        │
│  │ Address  │ │ DNA      │ │ ance     │ │ tion     │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└────────────┬──────────────────────────────────────┬──────────┘
             │                                      │
             ▼                                      ▼
┌──────────────────────┐              ┌───────────────────────┐
│       MongoDB        │              │        Redis          │
│ • devices            │              │ • sessions            │
│ • sim cache          │              │ • rate limits         │
│ • phishing           │              │ • idempotency         │
│ • notifs             │              │ • BullMQ queues       │
│ • spending           │              └───────────────────────┘
└──────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│                 Solana (Helius / QuickNode)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Sentinel │ │ Sentinel │ │ Sentinel │ │ Sentinel │        │
│  │ Wallet   │ │ Rules    │ │ Approvals│ │ Stealth  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐                                    │
│  │ Sentinel │ │ Sentinel │                                    │
│  │ Multisig │ │ Inherit. │                                    │
│  └──────────┘ └──────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

## Cryptographic Key Management (`src/crypto/`)

The mobile app implements a complete self-contained key management system — no dependency on external HD wallet libraries:

| Module | File | Description |
|--------|------|-------------|
| **BIP39** | `bip39.ts` | Entropy ↔ mnemonic (12/24 words), PBKDF2-HMAC-SHA512 seed derivation, mnemonic validation |
| **SLIP10** | `slip10.ts` | Ed25519 master key + hardened child key derivation per BIP32/SLIP10 |
| **Address** | `address.ts` | Base58 public key encoding, multi-wallet set derivation (BIP44 coin type 501) |
| **WalletManager** | `WalletManager.ts` | Unified lifecycle: create, derive, restore, clear sensitive material |
| **Entropy** | `entropy.ts` | XOR entropy mixing with device motion sensor supplement |
| **Hardware Card** | `hardwareCard.ts` | NaCl box (curve25519-xsalsa20-poly1305) encrypted card backup |
| **Signing** | `signing.ts` | Ed25519 transaction signing + verification |
| **Multi-Sig** | `multisig.ts` | Multi-signature transaction construction + signature aggregation |
| **Recovery** | `recovery.ts` | On-chain wallet state recovery via Helius RPC |
| **Types** | `types.ts` | Shared TypeScript types for the crypto system |

### Multi-Wallet Derivation

Each seed derives 5 independent wallets via BIP44 (Solana):

| Wallet | Path |
|--------|------|
| **Hot** | `m/44'/501'/0'/0'` |
| **Vault** | `m/44'/501'/1'/0'` |
| **DAO** | `m/44'/501'/2'/0'` |
| **Stealth Spend** | `m/44'/501'/3'/0'` |
| **Stealth View** | `m/44'/501'/4'/0'` |

### Security Guarantees

- Seed phrases never logged, transmitted, or persisted
- Screen capture blocked via Android `FLAG_SECURE` / iOS secure pasteboard
- All Ed25519 derivations use hardened keys per SLIP10 spec
- Validated against official [Trezor BIP39 test vectors](https://github.com/trezor/python-mnemonic)
- PBKDF2-HMAC-SHA512 with 2048 iterations for seed derivation
- NaCl box encryption for hardware card key backup

### Test Coverage

```
ℹ tests 61
ℹ suites 10
ℹ pass 61
ℹ fail 0
```

Tests: BIP39 vectors, SLIP10 vectors, address generation, WalletManager roundtrip, entropy mixing, hardware card encrypt/decrypt, signing, multi-signature, 10k wallet generation.

## Mobile App (`src/`)

| Screen | File | Description |
|--------|------|-------------|
| Onboarding | `screens/OnboardingScreen.tsx` | First-run setup with wallet create/restore choice |
| Generate Wallet | `screens/GenerateWalletScreen.tsx` | Mnemonic generation with secure display |
| Restore Wallet | `screens/RestoreWalletScreen.tsx` | BIP39 wordlist autocomplete mnemonic entry |
| Dashboard | `screens/DashboardScreen.tsx` | Balance, portfolio, quick actions |
| Send | `screens/SendScreen.tsx` | Transaction creation UI |
| Receive | `screens/ReceiveScreen.tsx` | Address display with QR |
| Transaction Gate | `screens/TransactionGateScreen.tsx` | Drain-proof transaction approval |
| Swap | `screens/SwapScreen.tsx` | Token swap interface |
| Vault | `screens/VaultScreen.tsx` | Vault wallet management |
| Rules | `screens/RulesScreen.tsx` | On-chain rule configuration |
| Activity | `screens/ActivityScreen.tsx` | Transaction history |
| Browser | `screens/BrowserScreen.tsx` | dApp browser |
| Settings | `screens/SettingsScreen.tsx` | App settings |
| Token Detail | `screens/TokenDetailScreen.tsx` | Token info and actions |

## Repository Structure

```
discifi/
├── App.tsx                      # Expo root component
├── src/                         # React Native mobile app
│   ├── crypto/                  # Key management system
│   │   └── __tests__/           # 61 tests
│   ├── components/              # Reusable UI components
│   ├── screens/                 # 14 app screens
│   ├── navigation/              # React Navigation setup
│   └── theme/                   # Design tokens
├── apps/
│   └── backend/                 # Fastify API server
│       └── tests/
├── packages/                    # Shared libraries
│   ├── shared/                  # Types, constants, errors
│   ├── anchor-sdk/              # Anchor client SDK
│   ├── config/                  # ESLint/TypeScript configs
│   └── ui-tokens/               # Design tokens
├── programs/                    # 6 Anchor smart contracts (Rust)
│   ├── sentinel-wallet/
│   ├── sentinel-rules/
│   ├── sentinel-approvals/
│   ├── sentinel-stealth/
│   ├── sentinel-multisig/
│   └── sentinel-inheritance/
├── Anchor.toml                  # Anchor workspace config
├── app.json                     # Expo config
├── Dockerfile / docker-compose.yml
└── turbo.json                   # Turborepo pipeline
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Solana CLI 1.18+
- Anchor CLI 0.30.0+
- Expo CLI (`npx expo`)

### Mobile App

```bash
# Install dependencies
pnpm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Backend

```bash
# Start infrastructure (MongoDB, Redis)
docker compose up -d

# Run development server
pnpm backend:dev
```

### Test

```bash
# Run all tests
pnpm test

# Run crypto tests only
pnpm exec tsx --test src/crypto/__tests__/crypto.test.ts

# Run backend unit tests
pnpm --filter @discifi/backend test
```

## Security Features

| Feature | Description |
|---------|-------------|
| **Device Binding** | Ed25519 + X509 certificate chain authentication |
| **Drain Detection** | 8 parallel checks with weighted risk scoring |
| **Rule Engine** | On-chain configurable time/gas/slippage/spending limits |
| **Simulation** | Helius → QuickNode failover with mismatch detection |
| **Phishing Block** | Real-time domain/address reputation check |
| **Stealth Addresses** | ECIES-based one-time receive addresses |
| **Spending DNA** | 90-day behavior baseline with anomaly detection |
| **Inheritance** | Heartbeat-monitored beneficiary timelocks |
| **Auto-Suspend** | Device suspension after 5 failed auth attempts |
| **Idempotency** | Redis-backed 60-second idempotency key enforcement |
| **Screen Capture Protection** | Android FLAG_SECURE + secure pasteboard |
| **Sensitive Data Zeroization** | `clearBytes()` on seed material after use |

## API Endpoints (Backend)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/device/register` | Register device with attestation |
| POST | `/v1/device/challenge` | Request auth challenge |
| POST | `/v1/device/auth` | Authenticate device |
| POST | `/v1/tx/simulate` | Simulate transaction |
| POST | `/v1/tx/sign-request` | Submit transaction for signing |
| POST | `/v1/wallet/configure` | Configure wallet rules |
| GET | `/v1/wallet/status` | Get wallet status |
| POST | `/v1/privacy/shield` | Shield tokens to stealth |
| POST | `/v1/privacy/unshield` | Unshield tokens from stealth |
| POST | `/v1/analytics/spending-dna` | Generate spending profile |
| POST | `/v1/multisig/create` | Create multisig wallet |
| POST | `/v1/multisig/propose` | Propose multisig transaction |
| POST | `/v1/multisig/approve` | Approve multisig transaction |
| POST | `/v1/multisig/execute` | Execute multisig transaction |
| POST | `/v1/inheritance/setup` | Setup beneficiary |
| POST | `/v1/inheritance/heartbeat` | Record heartbeat |
| POST | `/v1/inheritance/claim` | Claim inheritance |
| GET | `/v1/health` | Health check |

## Smart Contracts

6 Anchor programs (Rust 2021 edition):

| Program | Instructions | Description |
|---------|-------------|-------------|
| `sentinel-wallet` | 8 | Core wallet management |
| `sentinel-rules` | 4 | On-chain rule configuration |
| `sentinel-approvals` | 4 | Multi-sig + keeper incentives |
| `sentinel-stealth` | 4 | Privacy-preserving transfers |
| `sentinel-multisig` | 4 | Multi-signature sessions |
| `sentinel-inheritance` | 4 | Time-locked inheritance |

## Tech Stack

- **Mobile**: Expo SDK 56, React Native 0.85, React Navigation 7
- **Runtime**: Node.js 20, Fastify 5
- **Database**: MongoDB 7 (Mongoose) + Redis 7 (ioredis + BullMQ)
- **Blockchain**: Solana (Anchor 0.30.0, Helius RPC)
- **Crypto**: tweetnacl (Ed25519), @noble/hashes (SHA512/PBKDF2), bs58, @scure/bip39 (wordlist)
- **Auth**: JWT, Ed25519, X509 certificates
- **Queue**: BullMQ for async tasks
- **Build**: TypeScript strict, pnpm workspaces, Turborepo
- **Deploy**: Docker multi-stage (node:20-alpine), Docker Compose

## License

MIT — see [LICENSE](LICENSE) for details.
