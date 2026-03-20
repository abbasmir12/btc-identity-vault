# Bitcoin Identity Vault

> Self-sovereign identity on Bitcoin via Stacks. Own your credentials, share selectively, verify instantly.

Built for [Buidl Battle 2](https://dorahacks.io/hackathon/buidlbattle2) — a Bitcoin builders competition on Stacks.

## What It Does

Bitcoin Identity Vault lets institutions issue verifiable credentials on-chain, and lets users own, share, and prove those credentials — without any central authority.

**Full lifecycle:**
1. **Issuer registers** on-chain (auto-verified)
2. **User requests** a credential from an issuer
3. **Issuer approves & issues** — credential anchored to Bitcoin via Stacks
4. **User shares** a verify link or QR code
5. **Anyone verifies** — read-only, no wallet needed, tamper-proof

## Live Demo

- **App:** [deploy URL here]
- **Contract:** [`ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7`](https://explorer.hiro.so/txid/ST26P4PWK2WB16VNPN8YJZY7HJY21A3Z124RX85JE.credential-issuer-v7?chain=testnet)
- **Network:** Stacks Testnet

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Clarity (Stacks) |
| Identity Anchor | BNS (.btc names) |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Wallet | @stacks/connect v8 (Leather, Xverse) |

## Key Features

- 🔐 **On-chain credentials** — no localStorage, no database, no central server
- ✅ **Request → Approve → Issue** flow enforced by Clarity contract
- 🔍 **Read-only verification** — anyone can verify without a wallet
- ♻️ **On-chain revocation** — issuer can revoke, permanently recorded on Bitcoin
- 🪪 **BNS integration** — `.btc` names shown in UI

## Getting Started

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Connect with Leather or Xverse wallet.

## Contract Functions

| Function | Who | Description |
|---|---|---|
| `register-issuer` | Issuer | Register as a verified credential issuer |
| `request-credential` | User | Request a credential from an issuer |
| `approve-request` | Issuer | Approve a pending request |
| `issue-credential` | Issuer | Issue the credential on-chain |
| `revoke-credential` | Issuer | Revoke an issued credential |
| `get-issued-credential` | Anyone | Read-only credential lookup |
| `get-recipient-credentials` | Anyone | List all credentials for an address |

## Project Structure

```
contracts/          Clarity smart contracts
frontend/src/
  pages/            Dashboard, Issuers, Verify
  components/       UI components
  lib/stacks.ts     All blockchain interactions
deployments/        Testnet deployment plans
tests/              Contract tests
```

## License

MIT
