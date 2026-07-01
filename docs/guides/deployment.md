---
id: deployment
title: Deployment Guide
sidebar_position: 2
description: Deploy Novatip to testnet and mainnet, from contract to frontend.
---

# Deployment Guide

This guide covers deploying the full Novatip stack to testnet and then
promoting to mainnet. Follow the steps in order - each layer depends on
the one below it.

---

## Deployment Order

```
1. novatip-contracts  (Stellar testnet / mainnet)
2. novatip-backend    (any Node.js host: Railway, Render, Fly.io)
3. novatip-web        (Vercel or Cloudflare Pages)
4. novatip-docs       (Cloudflare Pages - see CI/CD guide)
```

---

## 1. Deploy the Contract

### Testnet

```bash
cd novatip-contracts
cp .env.example .env

# Edit .env:
# NETWORK=testnet
# SOURCE=my-identity
# ADMIN=G...
# USDC_TOKEN=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA

make build
./scripts/deploy.sh
cat .contract-id   # save this value
```

### Mainnet

```bash
# Edit .env:
# NETWORK=mainnet
# USDC_TOKEN=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75

./scripts/deploy.sh
```

:::warning
Mainnet deployment costs real XLM. Ensure your `SOURCE` account is funded
with enough XLM to cover contract deployment fees (approximately 1-2 XLM).
:::

---

## 2. Deploy the Backend

### Environment variables for production

Set these in your hosting platform's secrets manager:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/novatip
REDIS_URL=redis://host:6379
JWT_SECRET=<64-char random string>
STELLAR_NETWORK=mainnet
SOROBAN_RPC_URL=https://mainnet.stellar.validationcloud.io/v1/soroban/rpc
HORIZON_URL=https://horizon.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
TIP_SPLITTER_CONTRACT_ID=C...
USDC_CONTRACT_ID=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
INDEXER_START_LEDGER=<current ledger sequence>
RESEND_API_KEY=re_...
APP_BASE_URL=https://novatip.xyz
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database migrations

Run migrations before starting the server on each deploy:

```bash
npx prisma migrate deploy
node dist/app.js
```

The Dockerfile handles this automatically via the `CMD` instruction.

### Recommended hosts

| Platform | Notes |
|----------|-------|
| Railway | Easiest - detects Dockerfile automatically, managed PostgreSQL + Redis |
| Render | Free tier available, managed PostgreSQL add-on |
| Fly.io | Best performance, requires `fly.toml` config |
| VPS (DigitalOcean, Hetzner) | Most control, requires manual setup |

### Railway (recommended for quick start)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Set all environment variables in the Railway dashboard under
**Settings > Variables**.

---

## 3. Deploy the Frontend

### Environment variables

```env
NEXT_PUBLIC_API_URL=https://api.novatip.xyz/api/v1
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_TIP_SPLITTER_CONTRACT_ID=C...
NEXT_PUBLIC_USDC_CONTRACT_ID=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
```

### Vercel (recommended)

```bash
npm install -g vercel
cd novatip-web
vercel deploy --prod
```

Or connect your GitHub repo in the Vercel dashboard for automatic deploys
on every push to `main`.

### Cloudflare Pages

```bash
npm run build
# Deploy the `out/` directory to Cloudflare Pages
```

In the Cloudflare Pages dashboard:
- Build command: `npm run build`
- Build output directory: `.next`
- Add all `NEXT_PUBLIC_*` environment variables

:::info
For Cloudflare Pages with Next.js, install the
`@cloudflare/next-on-pages` adapter for full edge compatibility.
:::

---

## 4. Custom Domain Setup

### Backend API (api.novatip.xyz)

Add a CNAME or A record pointing `api.novatip.xyz` to your hosting
provider's endpoint. Enable HTTPS (most providers do this automatically).

### Frontend (novatip.xyz)

Add your domain in the Vercel or Cloudflare Pages dashboard. Both
automatically provision free TLS certificates via Let's Encrypt.

---

## 5. Post-Deployment Checklist

After deploying to mainnet, verify:

- [ ] Health check: `GET https://api.novatip.xyz/api/v1/health` returns `{ "status": "ok" }`
- [ ] Indexer is running: check backend logs for `[indexer] resuming from ledger`
- [ ] Contract resolver: `GET https://api.novatip.xyz/api/v1/resolve/alice` returns creator data
- [ ] Tip page loads: `https://novatip.xyz/@alice` renders without errors
- [ ] Wallet connects: Freighter connects on mainnet
- [ ] Test tip: send a small $0.10 USDC tip and confirm it reaches the recipient
- [ ] Dashboard updates: tip appears in the creator's recent feed within 10 seconds
- [ ] QR code downloads: `GET https://api.novatip.xyz/api/v1/qr/alice/png` returns a PNG

---

## Environment Promotion

To promote from testnet to mainnet without rebuilding:

1. Update `STELLAR_NETWORK=mainnet` in the backend env
2. Update `SOROBAN_RPC_URL` and `HORIZON_URL` to mainnet endpoints
3. Update `TIP_SPLITTER_CONTRACT_ID` to the mainnet contract ID
4. Update `USDC_CONTRACT_ID` to the mainnet USDC SAC
5. Set `INDEXER_START_LEDGER` to the current mainnet ledger sequence
6. Restart the backend process
7. Update `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` and `NEXT_PUBLIC_TIP_SPLITTER_CONTRACT_ID`
8. Redeploy the frontend
