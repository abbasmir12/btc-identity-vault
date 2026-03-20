# Bitcoin Identity Vault — Buidl Battle 2 Submission

> "Proving who you are shouldn't require trusting someone else's database."

---

## The Problem

Every time you need to prove your credentials — a degree, a certification, an employment record — you hand control to a third party. You wait days for verification. You share more than you need to. And if that institution goes offline, changes their policy, or simply loses your record, your proof disappears with it.

The credential system is broken not because of bad actors, but because of bad architecture. Centralized storage means centralized failure.

---

## What We Built

Bitcoin Identity Vault is a self-sovereign identity protocol on Stacks. Institutions issue credentials on-chain. Users own them. Anyone can verify them — instantly, without asking permission.

The full lifecycle lives on Bitcoin:

```
Institution registers as an issuer
  → User requests a credential
    → Institution approves and issues on-chain
      → User shares a verify link
        → Anyone verifies in seconds, no middleman
```

No database. No server. No "trust us."

---

## How It Works

**For issuers** — universities, employers, certification bodies — registration is a single on-chain transaction. Once registered, they can approve requests and issue credentials that are permanently anchored to Bitcoin via Stacks.

**For holders** — users request credentials from registered issuers through the app. Once approved and issued, the credential appears in their dashboard. They own it. They share it on their terms.

**For verifiers** — anyone with a browser can verify a credential. No wallet. No account. No API key. Enter the credential hash and issuer address, and the app reads the result directly from the Stacks blockchain. Verified or revoked — straight from Bitcoin.

---

## Why This Matters

Most identity projects use blockchain as a notary stamp — the actual data lives off-chain, and the chain just holds a reference. That's not ownership. That's a receipt.

This app stores the full credential state on-chain:

- Issuance is on-chain
- Approval is on-chain
- Revocation is on-chain
- The recipient index is on-chain

When an issuer revokes a credential — for fraud, expiry, or termination — that revocation is a public on-chain transaction. The holder cannot hide it. The issuer cannot quietly restore it. The record is final.

That's the part most identity projects skip. We didn't.

---

## Stacks Alignment

This project uses Stacks as more than infrastructure — it uses what makes Stacks unique:

- **Clarity contracts** — decidable, auditable, no reentrancy. The credential logic is transparent and predictable by design.
- **Bitcoin finality** — every credential issuance and revocation is settled on Bitcoin. Not a sidechain. Not a rollup. Bitcoin.
- **BNS (.btc names)** — issuers and holders are identified by human-readable `.btc` names, not raw addresses.
- **stacks.js** — all on-chain interactions use `@stacks/connect` v8 and `@stacks/transactions` with Leather and Xverse wallet support.

---

## Technical Implementation

| Layer | Choice |
|---|---|
| Smart Contracts | Clarity on Stacks (credential-issuer-v7) |
| Identity | BNS (.btc names) |
| Frontend | React + Vite + TypeScript |
| Wallet | @stacks/connect v8 |

**Contract:** `ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7`

The contract manages the full credential lifecycle — registration, requests, approvals, issuance, and revocation — with on-chain indexes for both issuers and recipients. All state is on-chain. There is no backend.

---

## Live Demo

- **App:** [live URL]
- **GitHub:** [https://github.com/abbasmir12/btc-identity-vault](https://github.com/abbasmir12/btc-identity-vault)
- **Contract on Explorer:** [View on Hiro Explorer](https://explorer.hiro.so/txid/ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7?chain=testnet)

---

## What's Next

The protocol is built. The next step is adoption — onboarding real institutions as issuers and building the selective disclosure layer so holders can share specific fields without revealing the full credential.

The foundation is on Bitcoin. That part doesn't change.
