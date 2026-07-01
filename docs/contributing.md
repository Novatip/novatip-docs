---
id: contributing
title: Contributing Guide
sidebar_position: 4
description: How to contribute to Novatip - for developers, writers, and community members.
---

# Contributing Guide

Novatip is an open source project built on Stellar and welcomes contributions
from developers, designers, writers, and community members at all skill levels.

The full contributing guide lives in the root of the `novatip-docs` repository:
[CONTRIBUTING.md](https://github.com/novatip/novatip-docs/blob/main/CONTRIBUTING.md)

This page summarises the most important points.

---

## How Issues Work

The project maintainer opens issues for planned features and bugs. Contributors
apply to existing issues rather than opening new ones for roadmap items.

1. Browse open issues across the Novatip repositories
2. Comment on the issue you want to work on
3. Wait for the maintainer to assign it to you
4. Fork, implement, and open a PR referencing the issue

For bug reports, open a new issue with a clear reproduction case.

---

## Quick Start

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/novatip-contracts

# Create a branch
git checkout -b feat/your-feature-name

# Make changes, run tests
make test        # contracts
npm test         # sdk / backend / web

# Push and open a PR against main
git push origin feat/your-feature-name
```

---

## Commit Format

```
feat:     new feature
fix:      bug fix
docs:     documentation only
chore:    build, tooling, config
test:     tests only
refactor: code restructure without behaviour change
```

---

## Repository Overview

| Repo | Language | Typical contribution areas |
|------|----------|-----------------------------|
| `novatip-contracts` | Rust / Soroban | Tests, error handling, new contract features |
| `novatip-sdk` | TypeScript | Wallet adapters, helpers, types |
| `novatip-backend` | TypeScript / Fastify | API endpoints, analytics, notifications |
| `novatip-web` | TypeScript / Next.js | UI components, accessibility, tip flow |
| `novatip-docs` | MDX | Examples, guides, typo fixes |

---

## Security Vulnerabilities

Do not open public issues for security vulnerabilities. Email the project
maintainer directly at **Abioladory@gmail.com**.

See [SECURITY.md](https://github.com/novatip/novatip-docs/blob/main/SECURITY.md)
for the full responsible disclosure process.

---

## Contact

For questions about contributing, open a GitHub Discussion or email
**Abioladory@gmail.com**.
