---
id: api-reference
title: Backend API Reference
sidebar_position: 1
description: Complete REST API reference for the novatip-backend server.
---

# Backend API Reference

Base URL: `http://localhost:3001/api/v1` (local dev)

All request and response bodies use JSON. Authenticated routes require a
`Bearer` token in the `Authorization` header obtained from `POST /auth/verify`.

---

## Authentication

Novatip uses Sign-In With Stellar (SIWS) - a wallet-based authentication
flow. No passwords, no email signup required.

### `POST /auth/challenge`

Issue a one-time nonce for a given wallet address. The nonce expires after
5 minutes.

**Request body:**

```json
{ "walletAddress": "G..." }
```

**Response:**

```json
{ "nonce": "a3f8...hex string...b2c1" }
```

---

### `POST /auth/verify`

Verify a signed nonce and receive a JWT session token.

**Request body:**

```json
{
  "walletAddress": "G...",
  "signatureHex":  "128-char hex encoded Ed25519 signature",
  "publicKeyHex":  "64-char hex encoded 32-byte public key"
}
```

**Response:**

```json
{
  "jwt":       "eyJ...",
  "isNewUser": true
}
```

Set `isNewUser: true` to redirect new users to `/onboarding`.

---

### `GET /auth/me`

Returns the currently authenticated user decoded from the JWT.

**Headers:** `Authorization: Bearer <jwt>`

**Response:**

```json
{
  "user": {
    "sub":    "cuid...",
    "wallet": "G...",
    "slug":   "alice"
  }
}
```

---

## Creators

### `GET /creators/:slug`

Public endpoint. Returns a creator's profile by slug. No auth required.

**Response:**

```json
{
  "creator": {
    "id":          "cuid...",
    "slug":        "alice",
    "displayName": "Alice",
    "bio":         "Musician and streamer",
    "avatarUrl":   "https://...",
    "jarId":       "@alice",
    "splits": [
      { "to": "G...", "bps": 10000 }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error:** `404` if slug is not registered.

---

### `GET /creators/check/:slug`

Check whether a slug is available. No auth required. Useful for real-time
availability feedback during onboarding.

**Response:**

```json
{ "slug": "alice", "available": false }
```

---

### `POST /creators/claim`

Claim a slug for the authenticated creator. Fails if the slug is already taken
or does not match the pattern `^[a-z0-9_-]{3,32}$`.

**Headers:** `Authorization: Bearer <jwt>`

**Request body:**

```json
{
  "slug":        "alice",
  "jarId":       "@alice",
  "displayName": "Alice",
  "bio":         "Musician and streamer",
  "splits": [
    { "to": "G...", "bps": 10000 }
  ]
}
```

**Response:** `201` with the updated creator object.

**Errors:**
- `400` - invalid slug format
- `409` - slug already taken

---

### `PATCH /creators/me`

Update the authenticated creator's profile fields.

**Headers:** `Authorization: Bearer <jwt>`

**Request body** (all fields optional):

```json
{
  "displayName": "Alice",
  "bio":         "Updated bio",
  "avatarUrl":   "https://..."
}
```

**Response:** Updated creator object.

---

### `PATCH /creators/me/splits`

Update the splits stored on the creator's backend profile. Call this after
successfully updating splits on-chain via `update_splits`.

**Headers:** `Authorization: Bearer <jwt>`

**Request body:**

```json
{
  "splits": [
    { "to": "G...alice", "bps": 7000 },
    { "to": "G...bob",   "bps": 3000 }
  ]
}
```

**Response:** Updated creator object.

---

## QR Codes

### `GET /qr/:slug`

Returns the creator's tip page QR code as an SVG. Cached for 1 hour.

**Response:** `Content-Type: image/svg+xml`

---

### `GET /qr/:slug/png`

Returns the creator's tip page QR code as a 512x512 PNG download. Cached
for 1 hour.

**Response:** `Content-Type: image/png`
**Header:** `Content-Disposition: attachment; filename="novatip-alice.png"`

---

## Resolver

### `GET /resolve/:slug`

Returns everything the tip page needs in a single request - profile, jar ID,
splits, and QR URLs. Used by `novatip-web` to hydrate the `/@[slug]` page.

**Response:**

```json
{
  "creator": { "...creator fields..." },
  "tipUrl":   "https://novatip.xyz/@alice",
  "qrSvgUrl": "/api/v1/qr/alice",
  "qrPngUrl": "/api/v1/qr/alice/png"
}
```

---

## Analytics

All analytics routes require authentication. Data is scoped to the
authenticated creator only.

Results are cached in Redis with a 30-second TTL.

### `GET /analytics/totals`

**Headers:** `Authorization: Bearer <jwt>`

**Response:**

```json
{
  "totalTips":        42,
  "totalAmountRaw":   "1050000000",
  "uniqueSupporters": 18
}
```

`totalAmountRaw` is the sum of all tips in USDC stroops (7 decimal places).
Use `formatUsdc()` from the SDK to display it.

---

### `GET /analytics/timeseries?days=30`

Daily tip counts and amounts over the last N days.

**Query params:** `days` (integer 1-365, default 30)

**Response:**

```json
{
  "series": [
    { "date": "2024-06-01", "tipCount": 3, "amountRaw": "75000000" },
    { "date": "2024-06-02", "tipCount": 7, "amountRaw": "190000000" }
  ]
}
```

---

### `GET /analytics/top-supporters?limit=10`

Supporters ranked by total USDC sent, highest first.

**Query params:** `limit` (integer 1-100, default 10)

**Response:**

```json
{
  "supporters": [
    {
      "fromAddress":    "G...",
      "tipCount":       5,
      "totalAmountRaw": "250000000"
    }
  ]
}
```

---

### `GET /analytics/recent?limit=20`

Most recent tips for the live feed on the creator dashboard.

**Query params:** `limit` (integer 1-100, default 20)

**Response:**

```json
{
  "tips": [
    {
      "id":          "cuid...",
      "fromAddress": "G...",
      "amount":      "25000000",
      "message":     "Great stream!",
      "ledgerAt":    "2024-06-15T12:34:56.000Z"
    }
  ]
}
```

---

## Webhooks

### `GET /webhooks`

List the authenticated creator's registered webhooks.

**Headers:** `Authorization: Bearer <jwt>`

**Response:**

```json
{
  "webhooks": [
    { "id": "cuid...", "url": "https://...", "enabled": true, "createdAt": "..." }
  ]
}
```

---

### `POST /webhooks`

Register a new webhook endpoint.

**Headers:** `Authorization: Bearer <jwt>`

**Request body:**

```json
{
  "url":    "https://your-server.com/novatip-hook",
  "secret": "optional-custom-secret-min-16-chars"
}
```

If `secret` is omitted, a 48-character random hex secret is generated.

**Response:** `201` with the webhook object including the `secret`.

:::warning
The `secret` is only returned once on creation. Store it securely.
:::

---

### `DELETE /webhooks/:id`

Remove a webhook.

**Headers:** `Authorization: Bearer <jwt>`

**Response:** `204 No Content`

---

## Webhook Payload

Every tip event is POSTed to registered webhook URLs with this shape:

```json
{
  "event":     "tip.received",
  "jarId":     "@alice",
  "from":      "G...",
  "amount":    "2.50",
  "amountRaw": "25000000",
  "message":   "Great stream!",
  "ledger":    1234567,
  "timestamp": "2024-06-15T12:34:56.000Z"
}
```

**Signature verification:**

```typescript
import { createHmac } from "crypto";

function verifySignature(
  body:   string,
  secret: string,
  header: string,
): boolean {
  const expected = "sha256=" +
    createHmac("sha256", secret).update(body).digest("hex");
  return expected === header;
}

// In your webhook handler:
const valid = verifySignature(
  rawBody,
  process.env.WEBHOOK_SECRET,
  req.headers["x-novatip-signature"],
);
```

---

## Error Format

All error responses follow this structure:

```json
{
  "error": {
    "code":    "SLUG_TAKEN",
    "message": "This slug is already taken."
  }
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Invalid request body or parameters |
| 401 | Missing or invalid JWT |
| 404 | Resource not found |
| 409 | Conflict (e.g. slug already taken) |
| 429 | Rate limit exceeded (100 req/min per IP) |
| 500 | Internal server error |

---

## Rate Limiting

All routes are rate-limited to **100 requests per minute per IP address**
using a Redis-backed counter. Exceeding the limit returns `429 Too Many Requests`.

The limit resets after one minute. The response includes:

```
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 42
X-RateLimit-Reset:     1718449200
```
