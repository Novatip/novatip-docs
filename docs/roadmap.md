---
id: roadmap
title: Roadmap
sidebar_position: 3
description: Novatip development roadmap - what is built, what is next, and the long-term vision.
---

# Roadmap

Novatip is building the open infrastructure for cross-border micro-tipping on
Stellar. This roadmap outlines what has been completed, what is actively being
built, and where the project is headed.

---

## Current Status

| Repository | Status | Notes |
|------------|--------|-------|
| `novatip-contracts` | Complete (MVP) | Deployed on Stellar testnet |
| `novatip-sdk` | Complete (MVP) | Publishable npm package |
| `novatip-backend` | Complete (MVP) | Fastify + PostgreSQL + indexer |
| `novatip-web` | Complete (MVP) | Next.js tip pages + dashboard |
| `novatip-docs` | Complete (MVP) | This documentation site |

---

## Phase 1 - MVP (Complete)

The foundation is in place. A creator can:

- Register a tip jar with custom collaborator splits on-chain
- Share a link or QR code so anyone can tip them
- Receive USDC tips split atomically on Stellar
- View real-time analytics in their dashboard
- Get notified via webhook or email on each tip

A supporter can:

- Visit a creator page without an account
- Connect a Freighter wallet
- Send a USDC tip in under 10 seconds
- Leave a supporter message on-chain

---

## Phase 2 - Growth (Active Development)

### Supporter Badge NFT (supporter_badge contract)

An optional non-transferable NFT awarded to supporters based on tipping
milestones. Gamifies the tipping experience and gives creators a way to
reward loyal supporters.

- Bronze badge: first tip
- Silver badge: 10 tips or $10 cumulative
- Gold badge: 100 tips or $100 cumulative

The badge contract is a separate Soroban contract that the tip_splitter
optionally calls after a successful tip.

### Additional Wallet Adapters (SDK)

- xBull wallet adapter
- Lobstr wallet adapter
- WalletConnect bridge for mobile wallets

### Improved Analytics

- Time-series charts in the dashboard (7d / 30d / 90d / all time)
- Per-collaborator earnings breakdown
- Supporter retention metrics
- CSV export for accounting

### Creator Profiles

- Custom avatar upload
- Social links (Twitter, Instagram, YouTube, Twitch)
- Verified creator badge
- Creator discovery page

### Mobile-Optimised Tip Flow

- Progressive Web App (PWA) support
- Optimised for mobile Freighter
- Share sheet integration on iOS and Android

---

## Phase 3 - Fiat On-Ramp (Planned)

The biggest barrier to mass adoption is that most people do not have USDC.
Phase 3 adds a fiat on-ramp so anyone can tip with a card.

### SEP-24 Anchor Integration

Stellar's SEP-24 protocol allows anchors (financial institutions) to provide
deposit and withdrawal services for Stellar assets. Integrating a SEP-24
anchor means:

- A supporter can pay with Visa / Mastercard
- The anchor converts to USDC on Stellar
- The tip_splitter contract receives USDC and splits it normally
- The creator receives USDC just like a crypto tip

From the creator's perspective, nothing changes. From the supporter's
perspective, there is no crypto knowledge required.

Candidate anchors: MoneyGram (via Stellar Partnership), Bitso, Anclap.

---

## Phase 4 - Ecosystem Expansion (Vision)

### Novatip Button

An embeddable JavaScript widget that any website can include:

```html
<script src="https://cdn.novatip.xyz/button.js"></script>
<novatip-button slug="alice"></novatip-button>
```

One line of HTML to add a tip button to any creator website, blog, or
streaming overlay.

### Stream Overlay Integration

A browser source for OBS and Streamlabs that shows live tip alerts during
streams. Creators see tip notifications as animated overlays with the
supporter's message.

### Multi-Asset Support

Extend the tip_splitter contract to accept tips in assets other than USDC:

- XLM (native Stellar asset)
- EURC (Circle Euro stablecoin on Stellar)
- Any Stellar Asset Contract token

### Creator DAOs

Allow a group of creators to form a collaborative tip jar governed by
on-chain voting. Revenue sharing decisions are made transparently by the
group.

### Novatip API (Public)

A public REST API so third-party developers can:

- Embed tip counts and totals in their own dashboards
- Build custom tip UIs on top of the Novatip protocol
- Create integrations for platforms like Discord bots or Telegram bots

---

## Contributing to the Roadmap

Phase 2 and beyond is where contributors can have the most impact.

The project maintainer opens issues for planned features and tags them with
`help wanted` or `good first issue`. If you want to work on a roadmap item:

1. Browse open issues in the relevant repository
2. Comment on the issue to express interest
3. Wait for the maintainer to assign it to you
4. Submit a PR referencing the issue when your implementation is ready

Do not open new feature issues for roadmap items that are already tracked.
If you have a suggestion not on this roadmap, open a discussion first.

See the [Contributing Guide](https://github.com/novatip/novatip-docs/blob/main/CONTRIBUTING.md)
for full contribution guidelines.

---

## 

Novatip is applying for a  grant to accelerate
Phase 2 development. Grant funding will be used to:

- Complete the `supporter_badge` NFT contract and SDK integration
- Add xBull and Lobstr wallet adapters
- Build the SEP-24 fiat on-ramp prototype
- Fund a smart contract security audit before mainnet launch
- Grow the contributor community with bounties on tagged issues

If you are a Stellar developer interested in contributing, check the
`good first issue` labels across all Novatip repositories.
