# Contributing to Novatip

Thank you for your interest in contributing to Novatip. This project is
submitted to the  and welcomes contributions from
developers, designers, writers, and community members at all skill levels.

---

## Code of Conduct

By participating in this project you agree to uphold a respectful and
inclusive environment. We do not tolerate harassment of any kind. If you
witness or experience unacceptable behaviour, please email the maintainers.

---

## Ways to Contribute

You do not need to write code to contribute. Here are all the ways you can
help:

- **Fix bugs** - pick up any issue tagged `good first issue` or `help wanted`
- **Work on features** - apply to issues opened by the maintainer
- **Write tests** - improve coverage in any repo
- **Improve docs** - fix typos, clarify explanations, add examples
- **Review pull requests** - leave constructive feedback on open PRs
- **Report bugs** - open an issue with a clear reproduction case and steps to reproduce

---

## Getting Started

1. Fork the repository you want to contribute to
2. Clone your fork locally
3. Follow the [Local Development Setup](https://docs.novatip.xyz/guides/local-dev)
   to get the full stack running
4. Create a feature branch from `main`:

```bash
git checkout -b feat/your-feature-name
```

5. Make your changes
6. Run the test suite and linter before pushing:

```bash
# Contracts
make test && make lint

# SDK / Backend / Web
npm run typecheck && npm run lint && npm test
```

7. Push your branch and open a pull request against `main`

---

## Pull Request Guidelines

- Keep PRs focused - one feature or bug fix per PR
- Write a clear PR title (under 70 characters) and description
- Reference the related issue number in the description: `Closes #42`
- Add or update tests for any logic changes
- Do not commit `.env` files, secrets, or build artifacts
- Squash fixup commits before requesting review if the history is noisy

### PR title format

```
type: short description

Examples:
feat: add supporter badge NFT contract
fix: correct rounding dust in tip split
docs: add webhook verification example
chore: upgrade stellar-sdk to v13
test: add indexer cursor persistence test
```

---

## Repository Structure

| Repo | Language | Good first issues |
|------|----------|------------------|
| `novatip-contracts` | Rust / Soroban | Adding error messages, writing fuzz tests |
| `novatip-sdk` | TypeScript | Adding wallet adapters (xBull, Lobstr) |
| `novatip-backend` | TypeScript / Fastify | Adding API endpoints, improving analytics |
| `novatip-web` | TypeScript / Next.js | UI components, accessibility improvements |
| `novatip-docs` | MDX | Adding examples, fixing typos, translations |

---

## Development Standards

### Rust (contracts)

- Format with `rustfmt`: `cargo fmt --all`
- Lint with Clippy, zero warnings policy: `cargo clippy --all-targets -- -D warnings`
- All public functions must have doc comments
- Every new feature needs a corresponding test in `test.rs`

### TypeScript (sdk / backend / web)

- Format with Prettier, lint with ESLint - configs are in each repo
- Strict TypeScript mode is enforced (`strict: true`)
- No `any` types without a justifying comment
- Functions over 30 lines should have a JSDoc comment

### Commit messages

Follow the conventional commits format used throughout the project:

```
feat:  new feature
fix:   bug fix
docs:  documentation only
chore: build, tooling, or config
test:  adding or fixing tests
refactor: code restructure without behaviour change
```

---

## Reporting Bugs

Open an issue using the bug report template and include:

1. Which repository the bug is in
2. Steps to reproduce
3. Expected behaviour
4. Actual behaviour
5. Your environment (OS, Node version, browser if relevant)
6. Any relevant logs or screenshots

For security vulnerabilities, do **not** open a public issue.
See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

---

## Issue Labels

| Label | Meaning |
|-------|---------|
| `good first issue` | Small, well-scoped, ideal for new contributors |
| `help wanted` | We would appreciate community help on this |
| `bug` | Confirmed defect |
| `enhancement` | New feature or improvement |
| `docs` | Documentation improvements |
| `question` | Needs clarification before work begins |
| `wontfix` | Out of scope or intentionally not addressed |

---

## Community

---

## Recognition

All contributors are listed in each repository's release notes. Significant
contributors may be invited to join the core team.

Thank you for helping build a more open and accessible tipping ecosystem on
Stellar.
