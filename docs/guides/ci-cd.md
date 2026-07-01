---
id: ci-cd
title: CI/CD Pipeline
sidebar_position: 3
description: GitHub Actions workflows for testing, building, and deploying Novatip.
---

# CI/CD Pipeline

Every Novatip repository uses GitHub Actions for continuous integration and
deployment. This page documents the pipelines and explains how to extend them.

---

## novatip-contracts

The contracts repo runs a single CI workflow on every push and pull request.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo fmt --all -- --check
      - run: cargo clippy --all-targets -- -D warnings
      - run: cargo test
```

Gate: all PRs must pass before merging to `main`.

---

## novatip-sdk

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

On merge to `main` with a version bump in `package.json`, a publish job
runs `npm publish --access public` using a stored `NPM_TOKEN` secret.

---

## novatip-backend

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: novatip
          POSTGRES_PASSWORD: novatip
          POSTGRES_DB: novatip_test
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5

      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run db:generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://novatip:novatip@localhost:5432/novatip_test
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
        env:
          DATABASE_URL: postgresql://novatip:novatip@localhost:5432/novatip_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret
          TIP_SPLITTER_CONTRACT_ID: CPLACEHOLDER
```

Railway and Render both auto-deploy on push to `main` when connected to
your GitHub repository.

---

## novatip-web

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
          NEXT_PUBLIC_STELLAR_NETWORK: testnet
          NEXT_PUBLIC_TIP_SPLITTER_CONTRACT_ID: CPLACEHOLDER
```

Vercel and Cloudflare Pages auto-deploy via their GitHub integrations
without needing an explicit deploy workflow.

---

## novatip-docs

```yaml
# .github/workflows/deploy.yml
name: Deploy Docs

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - name: Publish to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken:    ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId:   ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: novatip-docs
          directory:   build
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Setting up Cloudflare Pages secrets

1. Log in to the Cloudflare dashboard
2. Go to **Workers & Pages > novatip-docs > Settings > API tokens**
3. Create an API token with `Cloudflare Pages - Edit` permissions
4. In your GitHub repo, go to **Settings > Secrets > Actions**
5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

After the first deploy, Cloudflare assigns a `pages.dev` subdomain
automatically. You can then add your custom domain `docs.novatip.xyz`
in the Cloudflare Pages dashboard at no cost.

---

## Branch Strategy

| Branch | Purpose | Auto-deploy |
|--------|---------|-------------|
| `main` | Production-ready code | Yes - to production |
| `develop` | Integration branch | Optional - to staging |
| `feat/*` | Feature branches | No - CI checks only |
| `fix/*` | Bug fix branches | No - CI checks only |

---

## Required GitHub Secrets

| Secret | Used by | Description |
|--------|---------|-------------|
| `NPM_TOKEN` | sdk | npm publish token |
| `CLOUDFLARE_API_TOKEN` | docs | Cloudflare Pages deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | docs | Your Cloudflare account ID |
| `RAILWAY_TOKEN` | backend | Railway deploy token (if using Railway) |

---

## Status Badges

GitHub automatically generates a live CI status badge for every Actions
workflow. Once your repos are on GitHub and CI has run at least once, the
badges update themselves - no maintenance required.

Each repo's `README.md` already contains the correct badge markdown at the
top. You do not need to do anything manually. As soon as the repo is pushed
to GitHub and the first CI run completes, the badge will show green (passing)
or red (failing) automatically.

If you ever need to generate a badge URL yourself, go to:

    GitHub repo > Actions tab > select a workflow > top-right "..." menu > Create status badge

GitHub will generate the markdown snippet for you to copy and paste.
