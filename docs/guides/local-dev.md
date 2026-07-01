---
id: local-dev
title: Local Development Setup
sidebar_position: 1
description: Run the full Novatip stack on your machine in under 10 minutes.
---

# Local Development Setup

This guide walks you through running every Novatip repository locally so you
can develop end-to-end without touching any deployed infrastructure.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org) |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` |
| Stellar CLI | latest | [Install guide](https://developers.stellar.org/docs/tools/developer-tools/cli/install-stellar-cli) |
| Docker + Compose | latest | [docker.com](https://docker.com) |
| Freighter extension | latest | [freighter.app](https://freighter.app) |

---

## Step 1 - Clone All Repositories

```bash
mkdir novatip-app && cd novatip-app
git clone https://github.com/novatip/novatip-contracts
git clone https://github.com/novatip/novatip-sdk
git clone https://github.com/novatip/novatip-backend
git clone https://github.com/novatip/novatip-web
git clone https://github.com/novatip/novatip-docs
```

Resulting structure:

```
novatip-app/
  novatip-contracts/
  novatip-sdk/
  novatip-backend/
  novatip-web/
  novatip-docs/
```

---

## Step 2 - Start Infrastructure

```bash
cd novatip-backend
docker compose up -d postgres redis
docker compose ps
# postgres   running (healthy)
# redis      running (healthy)
```

---

## Step 3 - Build the SDK

The backend and web app both import from `@novatip/sdk`. Build it first.

```bash
cd novatip-sdk
npm install
npm run build
```

---

## Step 4 - Set Up the Backend

```bash
cd novatip-backend
npm install
cp .env.example .env
```

Minimum required values for local dev:

```env
DATABASE_URL=postgresql://novatip:novatip@localhost:5432/novatip
JWT_SECRET=local-dev-secret-change-me
TIP_SPLITTER_CONTRACT_ID=C...
```

Apply migrations and start:

```bash
npm run db:generate
npm run db:migrate
npm run dev
# Listening on http://localhost:3001
```

---

## Step 5 - Set Up the Frontend

```bash
cd novatip-web
npm install
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_TIP_SPLITTER_CONTRACT_ID=C...
```

```bash
npm run dev
# Available at http://localhost:3000
```

---

## Step 6 - Deploy the Contract to Testnet

### 6a. Create and fund a testnet identity

```bash
stellar keys generate my-identity --network testnet
stellar keys fund my-identity --network testnet
```

### 6b. Configure and deploy

```bash
cd novatip-contracts
cp .env.example .env
# Set NETWORK=testnet, SOURCE=my-identity, ADMIN=G..., USDC_TOKEN=C...

make build
./scripts/deploy.sh
cat .contract-id
```

Paste the contract ID into `novatip-backend/.env` and `novatip-web/.env.local`
as `TIP_SPLITTER_CONTRACT_ID` / `NEXT_PUBLIC_TIP_SPLITTER_CONTRACT_ID`.

### 6c. Register a test jar

```bash
# In .env set OWNER=G..., SLUG=@testcreator, RECIPIENT=G...
./scripts/create-jar.sh
```

---

## Step 7 - Connect Freighter to Testnet

1. Open Freighter and switch to **Testnet** in the network selector
2. Fund your testnet account via [Stellar Friendbot](https://laboratory.stellar.org/#account-creator)
3. Get testnet USDC from the Circle testnet faucet or a testnet DEX

---

## Step 8 - Verify the Full Flow

1. Open `http://localhost:3000/@testcreator`
2. Click **Connect Wallet** and approve in Freighter
3. Select $1 and click **Send tip**
4. Approve the transaction in Freighter
5. Confirm the success screen with confetti appears
6. Open `http://localhost:3000/dashboard`
7. The tip should appear in the recent feed within ~6 seconds

---

## Useful Commands

```bash
# Contracts
make test        # Rust test suite
make build       # compile to WASM
make lint        # clippy
make fmt         # rustfmt

# SDK
npm run build        # compile to dist/
npm run typecheck    # tsc --noEmit
npm test             # jest

# Backend
npm run db:studio    # Prisma Studio - visual DB browser
npm run db:migrate   # apply new migrations

# Frontend
npm run typecheck    # tsc --noEmit
npm run lint         # eslint + next lint
```

---

## Troubleshooting

**`TIP_SPLITTER_CONTRACT_ID` not set** - Get it from `.contract-id` after
running `deploy.sh` and paste it into both `.env` files.

**Freighter shows wrong network** - Switch to Testnet in the Freighter
extension settings.

**Database connection refused** - Run `docker compose up -d postgres redis`
and wait for health checks to pass.

**Indexer not picking up events** - Do not leave `INDEXER_START_LEDGER=0`
in production. Set it to the current ledger sequence:

```bash
curl https://soroban-testnet.stellar.org \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger","params":{}}' \
  | jq .result.sequence
```

**Port conflicts** - Backend defaults to `3001`, frontend to `3000`,
PostgreSQL to `5432`, Redis to `6379`. Change in `.env` and `docker-compose.yml`.
