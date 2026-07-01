---
id: tip-splitter
title: tip_splitter Contract
sidebar_position: 1
description: Full reference for the Novatip tip_splitter Soroban smart contract.
---

# tip_splitter Contract

The `tip_splitter` contract is the on-chain core of Novatip. It receives a
single USDC tip and splits it atomically across one or more recipients using
basis-point percentages. Either every recipient is paid in the same transaction
or the whole tip reverts. There is no escrow and no trusted intermediary.

---

## Concepts

### Jar

A creator's tip target, identified by a public slug string such as `@alice`.
Every jar stores:

- **owner** - the Stellar account that controls the jar
- **splits** - an ordered list of recipients and their percentage shares

### Split

A recipient address and its share of every incoming tip, expressed in basis
points (bps). 10,000 bps equals 100%.

### USDC Token

The Stellar Asset Contract (SAC) address is fixed at deploy time. Every tip
settles in that asset. On testnet this is the Circle testnet USDC SAC. On
mainnet it is the canonical Circle USDC SAC.

---

## Types

```rust
/// One recipient and the share of every tip they receive, in basis points.
pub struct Split {
    pub to:  Address,   // recipient Stellar address
    pub bps: u32,       // share in basis points (1 bps = 0.01%)
}

/// A creator's tip jar.
pub struct Jar {
    pub owner:  Address,    // account that owns this jar
    pub splits: Vec<Split>, // ordered list of recipients
}
```

---

## Functions

### `__constructor(admin, token)`

Runs once at deploy time. Stores the admin address and the USDC SAC address.
Cannot be called again after deployment.

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | `Address` | Contract administrator (reserved for future migrations) |
| `token` | `Address` | USDC Stellar Asset Contract address |

---

### `create_jar(owner, jar_id, splits)`

Register a new tip jar. The `owner` must sign the transaction. Fails if a jar
with the same slug already exists or if the splits are invalid.

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | `Address` | Jar owner - must authorize |
| `jar_id` | `String` | Public slug, e.g. `@alice` - must be unique |
| `splits` | `Vec<Split>` | Recipients and shares - must sum to 10,000 bps |

```rust
// Example: 70/30 split between alice and bob
create_jar(
    owner,
    "@band",
    vec![
        Split { to: alice, bps: 7000 },
        Split { to: bob,   bps: 3000 },
    ]
)
```

---

### `tip(from, jar_id, amount, message)`

Transfer `amount` USDC from `from`, split atomically across the jar's
recipients, then emit a `TipReceived` event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `Address` | Sender - must authorize |
| `jar_id` | `String` | Target jar slug |
| `amount` | `i128` | Amount in USDC stroops (1 USDC = 10,000,000 stroops) |
| `message` | `String` | Optional supporter message (pass empty string if none) |

**Splitting rules:**

- Each non-final recipient receives `amount * bps / 10_000` (integer division).
- The last recipient receives `amount - (sum of all prior shares)`, absorbing
  any rounding dust so the full amount is always distributed.
- If any single transfer fails, the entire transaction reverts.

```rust
// Tip $2.50 USDC to @alice with a message
tip(tipper, "@alice", 25_000_000, "Great stream!")
```

---

### `update_splits(jar_id, splits)`

Replace a jar's splits. Only the current jar owner may call this. Useful when
adding or removing collaborators.

| Parameter | Type | Description |
|-----------|------|-------------|
| `jar_id` | `String` | Target jar slug |
| `splits` | `Vec<Split>` | New splits - must sum to 10,000 bps |

---

### `get_jar(jar_id) -> Jar`

Read-only. Returns the full jar configuration. Throws `JarNotFound` if the
slug is not registered.

---

### `get_token() -> Address`

Read-only. Returns the USDC SAC address configured at deploy time.

---

## Error Codes

| Code | Name | When it is thrown |
|------|------|------------------|
| 1 | `NotInitialized` | Token address missing (should never happen post-deploy) |
| 2 | `JarExists` | Slug is already registered |
| 3 | `JarNotFound` | Slug is not registered |
| 4 | `InvalidSplits` | Empty split list, or bps do not sum to 10,000 |
| 5 | `InvalidAmount` | Tip amount is zero or negative |
| 6 | `TooManyRecipients` | More than 20 recipients in a single jar |

These codes map directly to `ContractErrorCode` in `@novatip/sdk`.

---

## Events

### TipReceived

Published on every successful `tip()` call.

| Field | Value |
|-------|-------|
| Topic 0 | `symbol "tip"` |
| Topic 1 | `jar_id: String` |
| Data 0 | `from: Address` |
| Data 1 | `amount: i128` |
| Data 2 | `message: String` |

The backend indexer subscribes to this event to update balances, analytics,
leaderboards, and notifications.

---

## Storage

| Key | Type | TTL | Description |
|-----|------|-----|-------------|
| `Admin` | `Address` | Instance | Contract administrator |
| `Token` | `Address` | Instance | USDC SAC address |
| `Jar(jar_id)` | `Jar` | Persistent | Creator tip jar |

---

## Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Max recipients per jar | 20 | Prevents unbounded fan-out in a single transaction |
| Split sum | Exactly 10,000 bps | Guarantees 100% of every tip is distributed |
| Min tip amount | > 0 stroops | Prevents zero-value transactions |
| Slug uniqueness | Per-contract | One jar per slug, enforced in persistent storage |

---

## Deploy and Bootstrap

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Build the WASM
stellar contract build

# 3. Deploy to testnet
set -a; source .env; set +a
./scripts/deploy.sh
# Contract ID saved to .contract-id

# 4. Register an example jar
./scripts/create-jar.sh
```

See `.env.example` in `novatip-contracts` for all required variables.

---

## Rounding Example

Given a $1 tip (10,000,000 stroops) to a 3-way 33.33% split:

| Recipient | BPS | Calculation | Receives |
|-----------|-----|-------------|---------|
| Alice | 3333 | 10,000,000 x 3333 / 10,000 = 3,333,000 | 3,333,000 |
| Bob | 3333 | 10,000,000 x 3333 / 10,000 = 3,333,000 | 3,333,000 |
| Carol | 3334 | 10,000,000 - 3,333,000 - 3,333,000 = 3,334,000 | 3,334,000 |
| **Total** | **10,000** | | **10,000,000** |

Carol absorbs the 1-stroop rounding dust. The full tip is always distributed.
