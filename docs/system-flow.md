---
id: system-flow
title: System Flow
sidebar_position: 2
description: End-to-end walkthrough of every event from tip initiation to dashboard update.
---

# System Flow

This page traces every step of a tip from the moment a sender visits a creator
page to the moment the creator sees the update in their dashboard.

---

## Happy Path - Crypto Sender

```
Sender browser                 Stellar network          novatip-backend
      │                               │                        │
      │  1. GET /@alice               │                        │
      │──────────────────────────────────────────────────────▶│
      │                               │                        │
      │  2. CreatorProfile + jarId    │                        │
      │◀──────────────────────────────────────────────────────│
      │                               │                        │
      │  3. Connect Freighter wallet  │                        │
      │  (publicKey returned)         │                        │
      │                               │                        │
      │  4. Pick $2 USDC + message    │                        │
      │                               │                        │
      │  5. SDK: simulate tip tx      │                        │
      │──────────────────────────────▶│                        │
      │  (Soroban RPC simulation)     │                        │
      │◀──────────────────────────────│                        │
      │                               │                        │
      │  6. Freighter: sign tx        │                        │
      │  (user approves)              │                        │
      │                               │                        │
      │  7. Submit signed tx          │                        │
      │──────────────────────────────▶│                        │
      │                               │                        │
      │  8. tip_splitter.tip()        │                        │
      │     USDC split atomically     │                        │
      │     TipReceived event emitted │                        │
      │                               │                        │
      │  9. Tx confirmed (~5s)        │                        │
      │◀──────────────────────────────│                        │
      │                               │                        │
      │  10. Confetti 🎉              │                        │
      │                               │                        │
      │                               │  11. Indexer polls RPC │
      │                               │◀───────────────────────│
      │                               │                        │
      │                               │  12. TipReceived event │
      │                               │───────────────────────▶│
      │                               │                        │
      │                               │  13. Persist to DB     │
      │                               │  14. Dispatch webhook  │
      │                               │  15. Send email        │
      │                               │                        │
      │  16. Dashboard polls /analytics/recent                 │
      │──────────────────────────────────────────────────────▶│
      │◀──────────────────────────────────────────────────────│
      │  New tip appears live in feed                          │
```

---

## Step-by-Step Breakdown

### 1–2. Page Load

The browser requests `/@alice`. Next.js calls `GET /api/v1/resolve/alice` on
the backend, which returns the creator's profile, jar ID, and splits config.
The page renders server-side with no wallet required.

### 3. Wallet Connection

The sender clicks **Connect Wallet**. The `WalletProvider` context triggers:
1. `FreighterAdapter.getPublicKey()` - prompts Freighter for the address
2. `POST /auth/challenge` - backend issues a one-time nonce
3. Freighter signs the nonce (Sign-In With Stellar)
4. `POST /auth/verify` - backend verifies signature, returns a JWT

The JWT is stored in `localStorage` and attached to all subsequent API calls.

### 4–5. Amount Selection and Simulation

The sender picks an amount (e.g. $2) and optional message. On click:
1. `TipSplitterClient.tip()` builds a Soroban transaction
2. The transaction is **simulated** against the Soroban RPC to get the exact
   fee and resource footprint
3. The assembled transaction is returned to the browser

### 6. Signing

The assembled transaction XDR is passed to `FreighterAdapter.signTransaction()`.
Freighter shows the user a clear summary of what they are authorising - the
USDC transfer amount and recipient split. The user approves.

### 7–8. Submission and On-Chain Execution

The signed transaction is submitted to the Soroban RPC. The `tip_splitter`
contract executes atomically:

```
for each Split in jar.splits:
    transfer( from → split.to, amount * split.bps / 10_000 )

# last recipient absorbs rounding dust
emit TipReceived(jarId, from, amount, message)
```

If any single transfer fails, the entire transaction reverts.

### 9–10. Confirmation

The SDK polls `getTransaction(hash)` until status is `SUCCESS` (~5 seconds on
testnet, ~3–5 seconds on mainnet). The frontend shows the success screen and
fires a confetti burst.

### 11–12. Indexer Picks Up the Event

The backend runs a polling loop every 6 seconds:

```ts
const events = await fetchTipEvents({ contractId, network, startLedger });
```

The SDK decodes the `TipReceived` event topics and data from raw XDR into a
typed `TipEvent` object.

### 13–15. Persistence and Notifications

For each decoded event:
- **Persist** - `upsert` into the `Tip` table (idempotent on `txHash`)
- **Webhook** - POST to all creator-registered endpoints with HMAC signature
- **Email** - Send via Resend if `RESEND_API_KEY` is configured

### 16. Live Dashboard Update

The creator's dashboard polls `GET /api/v1/analytics/recent` every 15 seconds.
The new tip appears in the live feed within one poll cycle after indexing.

---

## Creator Onboarding Flow

```
Creator                        novatip-web              novatip-backend
   │                               │                          │
   │  1. Visit /onboarding         │                          │
   │──────────────────────────────▶│                          │
   │                               │                          │
   │  2. Connect wallet (SIWS)     │                          │
   │  ◀── JWT returned ──          │                          │
   │                               │                          │
   │  3. Choose slug "@alice"      │                          │
   │                               │  POST /creators/claim    │
   │                               │─────────────────────────▶│
   │                               │  ◀── Creator record ──   │
   │                               │                          │
   │  4. Configure splits          │                          │
   │  (optional, skippable)        │  PATCH /creators/me/splits│
   │                               │─────────────────────────▶│
   │                               │                          │
   │  5. Download QR + share link  │  GET /qr/alice/png       │
   │                               │─────────────────────────▶│
   │◀──── PNG QR code ─────────────│                          │
```

---

## Error Cases

| Scenario | Behaviour |
|----------|-----------|
| Insufficient USDC balance | Soroban simulation returns error before signing |
| User rejects Freighter prompt | `WalletError` caught, inline error shown, retry available |
| Jar not found on-chain | `NovatipContractError(JarNotFound)` - tip page shows 404 |
| Transaction times out (>30s) | SDK throws `NovatipSdkError`, retry button shown |
| Backend indexer RPC error | Logs error, backs off 12s, resumes from saved cursor |
| Webhook delivery fails | Logged to `WebhookDelivery` table, does not retry automatically |
| Invalid splits (bps ≠ 10,000) | Validated client-side in `SplitsManager` before submit |
