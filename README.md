# Bitcoin Identity Vault

> Self-sovereign identity on Bitcoin via Stacks. Own your credentials, share selectively, verify instantly.

## Overview

Bitcoin Identity Vault is a decentralized identity platform built on the Stacks blockchain (Bitcoin L2). It enables users to:

- **Own** their digital identity credentials (education, employment, certifications, etc.)
- **Share selectively** — prove specific claims without revealing full data
- **Verify instantly** — cryptographic on-chain verification in under 2 seconds
- **Revoke anytime** — maintain full control over who accesses your data

All credentials are anchored to Bitcoin's security through Stacks smart contracts written in Clarity.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User App  │────▶│  Stacks      │────▶│  Bitcoin     │
│  (React +   │     │  Blockchain  │     │  (Settlement)│
│  Stacks     │     │  (Clarity    │     │              │
│  Connect)   │     │   Contracts) │     └─────────────┘
└──────┬──────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Gaia/IPFS   │     │  Issuer      │
│  (Encrypted  │     │  Portal      │
│   Off-chain  │     │  (Web App)   │
│   Storage)   │     └──────────────┘
└──────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Clarity (Stacks) |
| Identity Anchor | BNS (.btc names) |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Wallet | Stacks Connect (Leather/Xverse) |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build
```

## Smart Contracts

The project uses three Clarity smart contracts deployed on Stacks:

- **identity-registry.clar** — Maps .btc names to credential hashes
- **credential-issuer.clar** — Allows trusted issuers to issue/revoke credentials  
- **verification.clar** — On-chain verification logic with post-conditions

## Features

- 🔐 **Self-Sovereign Identity** — No company controls your data
- 👁️ **Selective Disclosure** — Share only what's needed
- ✅ **Verifiable Credentials** — Cryptographic proof of authenticity
- 🔒 **Encrypted Storage** — Data encrypted with your keys
- 📱 **QR Verification** — In-person verification via QR codes
- 🎨 **Premium UI** — Glass-morphism design with smooth animations

## License

MIT
