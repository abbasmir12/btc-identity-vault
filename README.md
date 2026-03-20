# Bitcoin Identity Vault

> "Your degree is real. Your employer's database is not."

Every credential you've ever earned — your degree, your certifications, your employment history — lives in someone else's database. They can revoke your access, lose your records, or simply go offline. You don't own any of it.

Bitcoin Identity Vault changes that.

---

## The Problem

When a company asks for proof of your education, you send a PDF. They trust it because... you sent it. When they want to verify it, they email the university, wait three days, and hope someone responds.

This is the state of credential verification in 2026. Fax machines with extra steps.

The deeper issue isn't the process — it's the architecture. Credentials are stored by issuers, verified by issuers, and revoked by issuers. The holder (you) is just a messenger carrying documents you don't control.

---

## The Solution

Bitcoin Identity Vault anchors credentials to the Bitcoin blockchain via Stacks. When an institution issues you a credential, it's written on-chain — permanently, tamper-proof, and readable by anyone without asking permission.

The flow is simple:

```
Institution registers as an issuer
  → You request a credential
    → Institution approves and issues on-chain
      → You share a verify link
        → Anyone verifies instantly, no middleman
```

No PDFs. No email chains. No trusting the messenger.

---

## Why Bitcoin

Stacks brings smart contracts to Bitcoin without changing Bitcoin. Every credential issued through this app is settled on the most secure, most decentralized ledger on the planet.

This isn't "blockchain for blockchain's sake." Bitcoin's immutability is exactly what credential verification needs — a record that cannot be quietly edited, a revocation that cannot be hidden, a timestamp that cannot be faked.

---

## What Makes It Different

Most identity projects store credentials off-chain and use the blockchain as a notary stamp. This app stores the full credential state on-chain:

- Issuance is on-chain
- Approval is on-chain  
- Revocation is on-chain
- The recipient index is on-chain

There is no database. There is no server. There is no "trust us."

A verifier doesn't need to contact the issuer, trust the holder, or run any software beyond a browser. They read the chain.

---

## How Verification Works

Every credential has two identifiers: the issuer's Stacks address and a SHA-256 hash of the credential data. Together they form a unique key in the on-chain map.

To verify:

1. Go to the Verify page — no wallet required
2. Enter the credential hash and issuer address
3. The app reads `get-issued-credential` directly from the contract
4. Result: verified, revoked, or not found — straight from Bitcoin

The hash cannot be forged. The revocation cannot be hidden. The issuer cannot secretly un-revoke.

---

## The Revocation Story

This is the part most identity projects skip.

When an employer terminates someone, or a university revokes a degree for academic fraud, that revocation needs to be as permanent and public as the original issuance. In Web2, revocations live in private databases — invisible to verifiers unless they know to ask.

Here, revocation is a public on-chain transaction. The moment an issuer revokes, every verifier sees it. The holder cannot hide it. The issuer cannot quietly restore it. The record is final.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Smart Contracts | Clarity on Stacks | Bitcoin-anchored, decidable, no reentrancy |
| Identity | BNS (.btc names) | Human-readable addresses on Bitcoin |
| Frontend | React + Vite + TypeScript | Fast, typed, minimal |
| Wallet | @stacks/connect v8 | Leather and Xverse support |

---

## Running Locally

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Connect with Leather or Xverse wallet on Stacks testnet.

---

## Contract

Deployed on Stacks testnet:

```
ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7
```

[View on Hiro Explorer](https://explorer.hiro.so/txid/ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7?chain=testnet)

---

## Contract Interface

| Function | Caller | Description |
|---|---|---|
| `register-issuer` | Institution | Register as a verified issuer |
| `request-credential` | User | Request a credential from an issuer |
| `approve-request` | Issuer | Approve a pending request |
| `issue-credential` | Issuer | Write the credential on-chain |
| `revoke-credential` | Issuer | Permanently revoke |
| `get-issued-credential` | Anyone | Read-only lookup by issuer + hash |
| `get-recipient-credentials` | Anyone | All credentials for an address |

---

## Project Structure

```
contracts/        Clarity smart contracts
frontend/src/
  pages/          Dashboard, Issuers, Verify
  components/     UI components
  lib/stacks.ts   All on-chain interactions
deployments/      Testnet deployment plans
tests/            Contract unit tests
```

---

## License

MIT
