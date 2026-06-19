# DisciFi Sentinel

**Privacy-first, drain-proof hardware wallet system on Solana**

DisciFi Sentinel is a comprehensive security middleware that protects Solana wallets from drain attacks, phishing, and unauthorized transactions. It combines on-chain Anchor smart contracts (6 programs) with an off-chain backend to provide real-time transaction analysis, device-bound authentication, and privacy-preserving routing.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile / Web / Extension              │
└──────────────┬──────────────────────────────┬───────────┘
               │ HTTPS (TLS 1.3)              │ WebSocket
               ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│              Fastify Backend (Node.js 20)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Device   │ │ Drain    │ │ Rule     │ │ Privacy  │   │
│  │ Auth     │ │ Detection│ │ Engine   │ │ Routing  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Stealth  │ │ Spending │ │ Inherit- │ │ Simula-  │   │
│  │ Address  │ │ DNA      │ │ ance     │ │ tion     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────┬──────────────────────────────────────┬───────────┘
       │                                      │
       ▼                                      ▼
┌──────────────┐                   ┌──────────────────┐
│   MongoDB    │                   │      Redis       │
│ • devices    │                   │ • sessions       │
│ • sim cache  │                   │ • rate limits    │
│ • phishing   │                   │ • idempotency    │
│ • notifs     │                   │ • BullMQ queues  │
│ • spending   │                   └──────────────────┘
└──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│               Solana (Helius / QuickNode)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Sentinel │ │ Sentinel │ │ Sentinel │ │ Sentinel │   │
│  │ Wallet   │ │ Rules    │ │ Approvals│ │ Stealth  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐                              │
│  │ Sentinel │ │ Sentinel │                              │
│  │ Multisig │ │ Inherit. │                              │
│  └──────────┘ └──────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## Repository Structure

```
discifi/
├── apps/
│   └── backend/              # Fastify API server
│       ├── src/
│       │   ├── config/       # Env, logger, DB, Redis configs
│       │   ├── models/       # Mongoose schemas (5 collections)
│       │   ├── services/     # Business logic (8 services)
│       │   ├── middleware/   # Auth, error handler, idempotency
│       │   ├── routes/       # API route handlers
│       │   └── plugins/      # Fastify plugins
│       └── tests/
│           ├── unit/         # Unit tests
│           └── integration/  # Integration tests
├── packages/
│   ├── shared/               # Types, constants, shared errors
│   ├── anchor-sdk/           # Anchor client SDK for all programs
│   ├── config/               # Shared ESLint/TypeScript configs
│   └── ui-tokens/            # Design tokens (colors, type, spacing)
├── programs/                 # Anchor smart contracts (Rust)
│   ├── sentinel-wallet/      # Core wallet program
│   ├── sentinel-rules/       # Rule engine program
│   ├── sentinel-approvals/   # Multi-sig approval program
│   ├── sentinel-stealth/     # Stealth address program
│   ├── sentinel-multisig/    # Multi-signature program
│   └── sentinel-inheritance/ # Inheritance program
├── Anchor.toml               # Anchor workspace config
├── Dockerfile                # Production container
├── docker-compose.yml        # Local development stack
└── .github/workflows/ci.yml  # CI pipeline
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Solana CLI 1.18+
- Anchor CLI 0.30.0+

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start infrastructure
docker compose up -d

# Run development server
pnpm --filter @discifi/backend dev
```

### Test

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm --filter @discifi/backend test -- tests/unit/drain-detection.test.ts
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

## API Endpoints

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

- **Runtime**: Node.js 20 (Fastify 5)
- **Database**: MongoDB 7 (Mongoose) + Redis 7 (ioredis + BullMQ)
- **Blockchain**: Solana (Anchor 0.30.0, Helius RPC)
- **Auth**: JWT, tweetnacl (Ed25519), X509 certificates
- **Queue**: BullMQ for async tasks
- **Build**: TypeScript strict, pnpm workspaces, Turborepo
- **Deploy**: Docker multi-stage (node:20-alpine), Docker Compose

## License

MIT — see LICENSE file for details.
