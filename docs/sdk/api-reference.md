---
id: api-reference
title: SDK API Reference
sidebar_position: 2
description: Complete reference for every export in @novatip/sdk.
---

# SDK API Reference

Complete reference for every symbol exported from `@novatip/sdk`.

---

## Network

### `getNetwork(name)`

Returns a `NetworkConfig` preset.

```typescript
getNetwork("testnet" | "mainnet" | "local"): NetworkConfig
```

### `networkFromEnv(env)`

Builds a `NetworkConfig` from raw environment variables. Throws if any
required field is missing.

```typescript
networkFromEnv({
  name:           NetworkName;
  rpcUrl:         string | undefined;
  horizonUrl:     string | undefined;
  passphrase:     string | undefined;
  usdcContractId: string | undefined;
}): NetworkConfig
```

### `isValidContractId(id)`

Returns `true` if the string matches the Stellar contract address format
(starts with `C`, 56 characters total, base32 alphabet).

### `isValidAccountId(id)`

Returns `true` if the string matches the Stellar account address format
(starts with `G`, 56 characters total).

### `NetworkConfig` interface

```typescript
interface NetworkConfig {
  name:           "testnet" | "mainnet" | "local";
  rpcUrl:         string;
  horizonUrl:     string;
  passphrase:     string;
  usdcContractId: string;
}
```

---

## TipSplitterClient

```typescript
const client = new TipSplitterClient({
  contractId: string;     // deployed contract ID
  network:    NetworkConfig;
});
```

### Read methods (no signing required)

| Method | Returns | Description |
|--------|---------|-------------|
| `getJar(jarId)` | `Promise<Jar>` | Read a jar's on-chain configuration |
| `getToken()` | `Promise<string>` | USDC SAC address configured at deploy |

### Write methods (signing required)

| Method | Description |
|--------|-------------|
| `createJar(params, opts)` | Register a new tip jar |
| `tip(params, opts)` | Send a USDC tip, split atomically |
| `updateSplits(params, opts)` | Replace a jar's splits |

All write methods accept an `opts` object with a `signTransaction` callback:

```typescript
interface InvokeOptions {
  signTransaction: (txXdr: string) => Promise<string>;
}
```

---

## Types

```typescript
interface Split {
  to:  string;   // recipient Stellar address
  bps: number;   // share in basis points (sum must equal 10,000)
}

interface Jar {
  owner:  string;    // jar owner address
  splits: Split[];   // ordered recipients
}

interface TipEvent {
  jarId:     string;   // jar slug that received the tip
  from:      string;   // sender address
  amount:    bigint;   // amount in USDC stroops
  message:   string;   // optional supporter message
  ledger:    number;   // ledger sequence of the event
  timestamp: string;   // ISO-8601 ledger close time
}

interface TipParams {
  from:    string;
  jarId:   string;
  amount:  bigint;   // use usdcToStroops() to convert
  message: string;
}

interface CreateJarParams {
  owner:  string;
  jarId:  string;
  splits: Split[];
}

interface UpdateSplitsParams {
  jarId:  string;
  splits: Split[];
}
```

---

## USDC Helpers

| Export | Signature | Description |
|--------|-----------|-------------|
| `USDC_DECIMALS` | `number` (7) | Decimal places used by the USDC token |
| `USDC_UNIT` | `bigint` (10_000_000n) | 1 USDC in smallest on-chain units |
| `usdcToStroops(amount)` | `(string \| number) => bigint` | Convert display amount to stroops |
| `stroopsToUsdc(stroops)` | `(bigint) => string` | Convert stroops to full decimal string |
| `formatUsdc(stroops, decimals?)` | `(bigint, number?) => string` | Format stroops for display |
| `isValidTipAmount(stroops)` | `(bigint) => boolean` | Returns true if stroops > 0n |
| `validateSplitsBps(bpsArray)` | `(number[]) => boolean` | Returns true if array sums to 10,000 |

---

## Events

### `fetchTipEvents(opts)`

Fetches and decodes `TipReceived` events from the Soroban RPC.

```typescript
fetchTipEvents(opts: {
  contractId:   string;
  network:      NetworkConfig;
  startLedger?: number;       // defaults to latest - 1000
  jarId?:       string;       // filter by jar slug
  limit?:       number;       // max events to return (default 100)
}): Promise<TipEvent[]>
```

### `decodeTipEvent(raw)`

Decodes a single raw Soroban RPC event into a typed `TipEvent`. Throws if
the event structure does not match the expected schema.

```typescript
decodeTipEvent(raw: SorobanRpc.Api.EventResponse): TipEvent
```

---

## Errors

### `NovatipContractError`

Thrown when the contract rejects a call with a typed error code.

```typescript
class NovatipContractError extends Error {
  code: ContractErrorCode;
}
```

### `NovatipSdkError`

Thrown for network, simulation, or submission failures.

```typescript
class NovatipSdkError extends Error {
  cause?: unknown;
}
```

### `WalletError`

Thrown when a wallet adapter operation fails or is rejected by the user.

```typescript
class WalletError extends Error {
  walletName: string;
  cause?:     unknown;
}
```

### `ContractErrorCode` enum

```typescript
enum ContractErrorCode {
  NotInitialized    = 1,
  JarExists         = 2,
  JarNotFound       = 3,
  InvalidSplits     = 4,
  InvalidAmount     = 5,
  TooManyRecipients = 6,
}
```

### `parseContractError(raw)`

Attempts to parse a raw Soroban error into a `NovatipContractError`.
Returns `null` if the error is not a known contract code.

```typescript
parseContractError(raw: unknown): NovatipContractError | null
```

---

## Wallet Adapters

### `FreighterAdapter`

Implements `WalletAdapter` for the Freighter browser extension.

```typescript
const wallet = new FreighterAdapter();

wallet.isAvailable()                              // boolean
wallet.getPublicKey()                             // Promise<string>
wallet.signTransaction(xdr, networkPassphrase)   // Promise<string>
wallet.disconnect()                               // Promise<void> (no-op)
```

### `WalletAdapter` interface

Implement this to support any other Stellar wallet (xBull, Lobstr, etc.).

```typescript
interface WalletAdapter {
  name:             string;
  isAvailable():    boolean;
  getPublicKey():   Promise<string>;
  signTransaction(
    txXdr:              string,
    networkPassphrase:  string,
  ):                    Promise<string>;
  disconnect?():    Promise<void>;
}
```

---

## Transaction Helpers

These are lower-level utilities used internally by `TipSplitterClient`.
You only need them if you are building custom contract integrations.

| Export | Description |
|--------|-------------|
| `simulateAndAssemble(server, tx)` | Simulate a transaction and return the fee-populated assembled tx |
| `submitAndWait(server, tx)` | Submit a signed transaction and poll until confirmed |
| `buildTransactionBuilder(sourceId, network, server)` | Create a `TransactionBuilder` for a source account |
| `createRpcServer(network)` | Create a `SorobanRpc.Server` from a `NetworkConfig` |
| `decodeReturnValue(xdrBase64)` | Decode a Soroban return value XDR to `xdr.ScVal` |
