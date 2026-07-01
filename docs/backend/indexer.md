---
id: indexer
title: Event Indexer
sidebar_position: 2
description: How the Novatip backend listens for on-chain TipReceived events and persists them to PostgreSQL.
---

# Event Indexer

The Novatip backend runs a **Soroban event indexer** alongside the HTTP server.
It polls the Soroban RPC for `TipReceived` events emitted by the `tip_splitter`
contract, decodes them using `@novatip/sdk`, persists them to PostgreSQL, and
triggers webhook and email notifications.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│                  Indexer Loop                   │
│  (runs every 6 seconds in the same process)     │
│                                                 │
│  1. Read cursor from IndexerCursor table        │
│  2. fetchTipEvents({ startLedger: cursor + 1 }) │
│  3. For each decoded TipEvent:                  │
│     a. persistTip()   -> PostgreSQL             │
│     b. dispatchWebhooks()                       │
│     c. sendTipNotification()                    │
│  4. updateCursor(lastLedger)                    │
│  5. Sleep 6 seconds, repeat                     │
└─────────────────────────────────────────────────┘
```

---

## Cursor Persistence

The indexer stores the last successfully processed ledger sequence number in
the `IndexerCursor` table (a single-row table with `id = 1`).

On startup the indexer:
1. Reads `IndexerCursor.lastLedger` from the database
2. Resumes from `lastLedger + 1`
3. Falls back to `INDEXER_START_LEDGER` env var if the cursor has never been set

This means restarts are always safe - no events are reprocessed and none are
skipped, as long as the cursor is updated after each batch.

---

## Idempotency

Tips are upserted using `txHash` as the unique key:

```typescript
await db.tip.upsert({
  where:  { txHash },
  update: {},          // already persisted - no-op
  create: { ...tipData },
});
```

If the indexer crashes between persisting a tip and updating the cursor, the
same tip may be processed again on restart. The upsert guarantees the database
ends up in the correct state regardless.

---

## Event Decoding

The SDK handles all XDR decoding. Raw Soroban RPC events look like:

```json
{
  "type": "contract",
  "ledger": 1234567,
  "ledgerClosedAt": "2024-06-15T12:34:56Z",
  "contractId": "C...",
  "topic": ["AAAADwAAAAN0aXAAAAA=", "AAAAA...base64..."],
  "value": "AAAAA...base64..."
}
```

`fetchTipEvents()` decodes this into:

```typescript
{
  jarId:     "@alice",
  from:      "G...",
  amount:    25000000n,
  message:   "Great stream!",
  ledger:    1234567,
  timestamp: "2024-06-15T12:34:56Z",
}
```

---

## Database Schema

### `Tip` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `cuid` | Internal primary key |
| `txHash` | `String` (unique) | Soroban transaction hash - idempotency key |
| `ledger` | `Int` | Ledger sequence of the event |
| `ledgerAt` | `DateTime` | Ledger close timestamp |
| `fromAddress` | `String` | Sender Stellar address |
| `amount` | `String` | Amount in stroops (String to preserve i128 precision) |
| `message` | `String` | Optional supporter message |
| `creatorId` | `String` | Foreign key to `Creator` |

### `IndexerCursor` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `Int` (always 1) | Single-row table |
| `lastLedger` | `Int` | Last ledger successfully processed |
| `updatedAt` | `DateTime` | Auto-updated timestamp |

---

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `TIP_SPLITTER_CONTRACT_ID` | required | Contract to listen on |
| `SOROBAN_RPC_URL` | testnet RPC | Soroban RPC endpoint to poll |
| `STELLAR_NETWORK` | `testnet` | Network preset |
| `INDEXER_START_LEDGER` | `0` | Ledger to start from if cursor is empty |

**Setting `INDEXER_START_LEDGER`:**

On first deployment, set this to the current ledger sequence number to avoid
replaying the entire chain history. You can find the current ledger on
[Stellar Expert](https://stellar.expert) or via:

```bash
curl https://soroban-testnet.stellar.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger","params":{}}' \
  | jq .result.sequence
```

---

## Error Handling

The indexer is designed to never crash the process:

- RPC errors are caught, logged, and the loop backs off for 12 seconds before
  retrying
- Per-event errors (bad webhook, failed email) are caught and logged but do
  not block other events
- If a tip's `jarId` is not registered in the database, it is silently skipped
  (it may belong to a different application using the same contract)

---

## Monitoring

Check the indexer status from the server logs:

```
[indexer] starting - contract=C... network=testnet
[indexer] resuming from ledger 1234567
[indexer] processing 3 event(s) from ledger 1234901
[indexer] stopped
```

For production deployments, consider forwarding these logs to a service like
Datadog, Logtail, or Grafana Loki for alerting on indexer stalls.

---

## Running the Indexer Standalone

The indexer starts automatically when you run the backend server. If you need
to run it as a separate process (e.g. for horizontal scaling), extract the
`startIndexer()` call into its own entry point:

```typescript
// src/indexer-worker.ts
import "dotenv/config";
import { startIndexer } from "./indexer/indexer.js";

await startIndexer();
```

Then run:

```bash
node --loader ts-node/esm src/indexer-worker.ts
```

:::info
In a production setup with high tip volume, consider running one indexer
process and multiple API server processes behind a load balancer.
:::
