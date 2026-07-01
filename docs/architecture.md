---
id: architecture
title: Architecture Overview
sidebar_position: 1
description: A top-down view of every layer in the Novatip system.
---

# Architecture Overview

Novatip is a **cross-border micro-tipping protocol** built on the Stellar network.
A sender can tip any registered creator in USDC in under two seconds, with zero
platform fees, from anywhere in the world.

---

## Repository Map

| Repository | Language | Role |
|------------|----------|------|
| [`novatip-contracts`](https://github.com/novatip/novatip-contracts) | Rust / Soroban | On-chain tip splitting |
| [`novatip-sdk`](https://github.com/novatip/novatip-sdk) | TypeScript | Contract bindings + shared types |
| [`novatip-backend`](https://github.com/novatip/novatip-backend) | TypeScript / Fastify | Creator profiles, indexer, analytics |
| [`novatip-web`](https://github.com/novatip/novatip-web) | TypeScript / Next.js | Public tip pages + creator dashboard |
| [`novatip-docs`](https://github.com/novatip/novatip-docs) | MDX / Docusaurus | This documentation site |

---

## Layers

```
┌─────────────────────────────────────────────────┐
│                  novatip-web                    │
│  Next.js 14  ·  Tailwind  ·  Freighter wallet   │
└──────────────────────┬──────────────────────────┘
                       │ REST API  /  @novatip/sdk
┌──────────────────────▼──────────────────────────┐
│               novatip-backend                   │
│  Fastify  ·  PostgreSQL  ·  Redis  ·  Indexer   │
└──────────────────────┬──────────────────────────┘
                       │ Soroban RPC
┌──────────────────────▼──────────────────────────┐
│             Stellar Network (Soroban)            │
│         tip_splitter contract  ·  USDC SAC       │
└─────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### novatip-contracts

The on-chain core. A single Soroban smart contract (`tip_splitter`) that:

- Stores **tip jars** identified by a public slug (e.g. `@alice`)
- Accepts a USDC tip and **atomically splits** it across up to 20 recipients
  using basis-point percentages
- Emits a `TipReceived` event consumed by the backend indexer
- Enforces all business rules on-chain - no trusted intermediary

### novatip-sdk

A publishable npm package (`@novatip/sdk`) that provides:

- **Typed contract bindings** - call `createJar`, `tip`, `updateSplits` with
  full TypeScript types, no raw XDR
- **Transaction builder** - handles simulation, fee assembly, submission, and
  confirmation polling
- **Event parser** - decodes `TipReceived` events from Soroban RPC responses
- **Wallet adapters** - `FreighterAdapter` and the `WalletAdapter` interface
  for custom wallets
- **USDC helpers** - `usdcToStroops`, `stroopsToUsdc`, `formatUsdc`,
  `validateSplitsBps`
- **Network config** - preset `testnet`, `mainnet`, and `local` configs

Consumed by both `novatip-backend` (indexer) and `novatip-web` (tip form).

### novatip-backend

A Fastify Node.js server that:

- Provides **REST API** for the frontend (creator profiles, analytics, QR codes)
- Authenticates creators via **Sign-In With Stellar (SIWS)** - wallet-based,
  no passwords
- Runs a **Soroban event indexer** that polls for `TipReceived` events every
  ~6 seconds and persists them to PostgreSQL
- Serves **analytics** (totals, time-series, leaderboards) from PostgreSQL
  with Redis caching
- Dispatches **webhooks** and **email notifications** on each tip
- Generates **QR codes** (SVG + PNG) for any creator slug

### novatip-web

A Next.js 14 App Router frontend that:

- Serves a **public tip page** at `/@[slug]` - no login required to tip
- Connects to **Freighter** (and any wallet implementing `WalletAdapter`)
- Builds and signs **Soroban transactions** client-side via `@novatip/sdk`
- Shows a **creator dashboard** with live earnings, supporter leaderboard,
  splits manager, and QR download
- Guides new creators through an **onboarding wizard** (claim slug → splits → share)

---

## Data Stores

| Store | Technology | What lives there |
|-------|-----------|-----------------|
| Primary DB | PostgreSQL 16 + Prisma | Creators, tips, webhooks, notifications, indexer cursor |
| Cache | Redis 7 | Auth nonces, rate-limit counters, analytics cache (30s TTL) |
| On-chain | Stellar ledger | Jar configs, USDC balances, transaction history |

---

## Security Model

| Concern | Approach |
|---------|----------|
| Creator authentication | SIWS: sign a one-time nonce with your Stellar private key |
| Tip authorization | On-chain: `from.require_auth()` enforced by Soroban |
| Webhook integrity | HMAC-SHA256 signature on every delivery (`X-Novatip-Signature`) |
| Rate limiting | Redis-backed, 100 req/min per IP on the backend |
| Secrets | Environment variables only - never committed to source |

---

## Key Design Decisions

### Why Soroban?
Soroban gives us atomic, trustless payment splitting. The contract guarantees
either all recipients are paid or the entire tip reverts - no partial payments,
no escrow, no trusted multisig.

### Why USDC?
USDC on Stellar settles in ~5 seconds with near-zero fees (~0.00001 XLM).
The Stellar Asset Contract (SAC) wraps the native USDC asset, making it
callable from Soroban contracts.

### Why Fastify over Express?
Fastify is ~2–3× faster than Express in benchmarks, has first-class TypeScript
support, and ships with a built-in schema validation pipeline compatible with
Zod.

### Why split SDK / backend / web?
The SDK is the single source of truth for contract types and transaction
building. Both the backend indexer and the frontend tip form import from
`@novatip/sdk` - changes to the contract interface propagate to both
consumers from one place.
