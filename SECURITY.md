# Security Policy

## Supported Versions

Novatip is currently in active development and deployed on Stellar testnet.
Security fixes are applied to the latest version only.

| Version | Supported |
|---------|-----------|
| latest (main) | Yes |
| older branches | No |

---

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in any Novatip
repository, please report it **privately** rather than opening a public issue.

### How to report

Email: **Abioladory@gmail.com**

Include in your report:

1. Which repository and component is affected
2. A description of the vulnerability
3. Step-by-step reproduction instructions
4. The potential impact (what an attacker could do)
5. Your suggested fix if you have one

### What to expect

- You will receive an acknowledgement within 48 hours
- We will investigate and keep you updated on our progress
- We aim to release a fix within 14 days for critical issues
- We will credit you in the security advisory unless you prefer to remain anonymous

---

## Scope

The following are in scope for security reports:

- `novatip-contracts` - Soroban contract vulnerabilities (reentrancy, auth bypass, fund loss)
- `novatip-backend` - API authentication bypass, SQL injection, data exposure
- `novatip-sdk` - Transaction manipulation, signature bypass
- `novatip-web` - XSS, CSRF, wallet interaction vulnerabilities
- Infrastructure - Any misconfiguration that exposes user data

The following are out of scope:

- Issues in third-party dependencies (report those upstream)
- Theoretical attacks without a practical reproduction
- Social engineering attacks
- Issues on decommissioned or test environments

---

## Smart Contract Security

The `tip_splitter` contract has the following security properties:

- **Auth required** - `from.require_auth()` ensures only the sender can initiate a tip
- **Atomic splits** - all transfers succeed or all revert, no partial payments
- **No admin withdrawal** - the contract has no function to withdraw funds; all USDC
  flows directly from sender to recipients in a single transaction
- **Immutable token** - the USDC SAC address is set at deploy time and cannot be changed
- **Bounded recipients** - maximum 20 recipients per jar prevents denial-of-service

Before mainnet launch, the contract will undergo an independent security audit.
Audit reports will be published in the `novatip-contracts` repository.

---

## Responsible Disclosure Policy

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately
2. We acknowledge within 48 hours
3. We reproduce and assess severity
4. We develop and test a fix
5. We release the fix
6. We publish a security advisory crediting the reporter
7. Reporter may publish their own write-up 30 days after the fix is released

We ask that you do not publicly disclose the vulnerability until we have
released a fix. We will not take legal action against researchers who follow
this policy in good faith.

---

## Known Security Considerations

### Rounding dust

The last recipient in a split absorbs rounding dust. This is intentional and
documented. The maximum dust is `number_of_recipients - 1` stroops per tip,
which is negligible.

### Indexer replay protection

The backend indexer uses `txHash` as a unique key for upserts. If the same
event is processed twice (e.g. after a crash and restart), the database ends
up in the correct state due to the no-op update on conflict.

### JWT storage

The frontend stores JWTs in `localStorage`. This is a standard approach for
single-page applications. A future version may migrate to httpOnly cookies
for improved XSS resistance.
