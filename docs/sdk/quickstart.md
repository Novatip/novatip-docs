---
id: quickstart
title: SDK Quickstart
sidebar_position: 1
description: Install @novatip/sdk and send your first tip in minutes.
---

# SDK Quickstart

`@novatip/sdk` is the TypeScript package consumed by both the Novatip backend
and frontend. It provides typed contract bindings, transaction builders, event
parsers, and wallet adapters so you never need to touch raw XDR.

---

## Installation

```bash
npm install @novatip/sdk
```

For browser apps that use the Freighter wallet extension:

```bash
npm install @novatip/sdk @stellar/freighter-api
```

**Requirements:** Node.js >= 18

---

## 1. Read a Jar (no wallet needed)

```typescript
import { TipSplitterClient, getNetwork } from "@novatip/sdk";

const client = new TipSplitterClient({
  contractId: "C...",                // your deployed contract ID
  network:    getNetwork("testnet"),
});

const jar = await client.getJar("@alice");
console.log(jar.owner);   // G... Stellar address
console.log(jar.splits);  // [{ to: "G...", bps: 10000 }]
```

---

## 2. Send a Tip (browser + Freighter)

```typescript
import {
  TipSplitterClient,
  FreighterAdapter,
  getNetwork,
  usdcToStroops,
} from "@novatip/sdk";

const network = getNetwork("testnet");
const wallet  = new FreighterAdapter();
const client  = new TipSplitterClient({ contractId: "C...", network });

// Connect wallet
const publicKey = await wallet.getPublicKey();

// Send $2.50 USDC to @alice
await client.tip(
  {
    from:    publicKey,
    jarId:   "@alice",
    amount:  usdcToStroops("2.50"),   // 25_000_000n stroops
    message: "Great stream!",
  },
  {
    signTransaction: (xdr) =>
      wallet.signTransaction(xdr, network.passphrase),
  },
);
```

---

## 3. Create a Jar with Splits

```typescript
import { validateSplitsBps } from "@novatip/sdk";

const splits = [
  { to: "G...alice", bps: 7000 },  // 70%
  { to: "G...bob",   bps: 3000 },  // 30%
];

// Validate before sending on-chain
if (!validateSplitsBps(splits.map((s) => s.bps))) {
  throw new Error("Splits must sum to 10,000 bps");
}

await client.createJar(
  { owner: publicKey, jarId: "@band", splits },
  {
    signTransaction: (xdr) =>
      wallet.signTransaction(xdr, network.passphrase),
  },
);
```

---

## 4. Fetch Tip Events (backend / indexer)

```typescript
import { fetchTipEvents, getNetwork } from "@novatip/sdk";

const events = await fetchTipEvents({
  contractId:   "C...",
  network:      getNetwork("testnet"),
  jarId:        "@alice",   // omit to fetch all jars
  startLedger:  1000000,    // resume from a known ledger
  limit:        50,
});

for (const event of events) {
  console.log(
    `${event.from} tipped ${event.amount} stroops to ${event.jarId}:`,
    `"${event.message}"`,
  );
}
```

---

## 5. Format USDC Amounts

```typescript
import { usdcToStroops, stroopsToUsdc, formatUsdc } from "@novatip/sdk";

usdcToStroops("1.50")        // 15_000_000n
stroopsToUsdc(15_000_000n)   // "1.5000000"
formatUsdc(15_000_000n, 2)   // "1.50"
```

---

## 6. Use a Custom Network

```typescript
import { networkFromEnv, TipSplitterClient } from "@novatip/sdk";

const network = networkFromEnv({
  name:           "testnet",
  rpcUrl:         process.env.SOROBAN_RPC_URL,
  horizonUrl:     process.env.HORIZON_URL,
  passphrase:     process.env.NETWORK_PASSPHRASE,
  usdcContractId: process.env.USDC_CONTRACT_ID,
});

const client = new TipSplitterClient({
  contractId: process.env.TIP_SPLITTER_CONTRACT_ID!,
  network,
});
```

---

## 7. Handle Errors

```typescript
import {
  NovatipContractError,
  NovatipSdkError,
  ContractErrorCode,
} from "@novatip/sdk";

try {
  await client.tip(params, opts);
} catch (err) {
  if (err instanceof NovatipContractError) {
    switch (err.code) {
      case ContractErrorCode.JarNotFound:
        console.error("Jar does not exist:", params.jarId);
        break;
      case ContractErrorCode.InvalidAmount:
        console.error("Amount must be greater than zero");
        break;
      default:
        console.error("Contract error:", err.message);
    }
  } else if (err instanceof NovatipSdkError) {
    console.error("SDK error (network/signing):", err.message);
  }
}
```

---

## Network Presets

| Network | RPC URL | Passphrase |
|---------|---------|-----------|
| `testnet` | `https://soroban-testnet.stellar.org` | `Test SDF Network ; September 2015` |
| `mainnet` | `https://mainnet.stellar.validationcloud.io/v1/soroban/rpc` | `Public Global Stellar Network ; September 2015` |
| `local` | `http://localhost:8000/soroban/rpc` | `Standalone Network ; February 2017` |

---

## Next Steps

- See the full [API Reference](./api-reference) for every exported symbol.
- Read the [Backend Indexer](../backend/indexer) guide to learn how the SDK
  powers the event listener.
- Check [Local Dev Setup](../guides/local-dev) to run the full stack locally.
