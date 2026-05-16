# SilentDrop

Private encrypted file transfer built on 0G Storage.

## What it does
SilentDrop lets you encrypt any file and send it securely to any wallet address using 0G decentralized storage. Only the intended recipient can decrypt and download the file.

## How it works
1. Sender selects a file and enters recipient wallet address
2. File is encrypted client-side using the recipient wallet address as the key
3. Encrypted file is uploaded to 0G Storage mainnet
4. Sender shares the Root Hash with recipient
5. Recipient pastes Root Hash, file is fetched from 0G and decrypted automatically

## 0G Integration
- 0G Storage mainnet for decentralized file storage
- Files stored permanently on-chain
- Explorer: https://chainscan.0g.ai

## Tech Stack
- Next.js 16
- TailwindCSS
- TweetNaCl (encryption)
- 0G Storage TypeScript SDK
- Ethers.js
- Vercel (hosting)

## Live Demo
https://silentdrops.vercel.app

## Local Setup
1. Clone the repo
2. Run `npm install`
3. Add `UPLOADER_PRIVATE_KEY` to `.env.local`
4. Run `npm run dev`
5. Open http://localhost:3000

User Browser
│
├── Encrypts file (TweetNaCl)
├── Pays 0.001 OG fee (MetaMask → 0G Chain)
│
▼
Next.js API Route (/api/upload)
│
├── Verifies fee transaction on 0G Chain
├── Uploads encrypted blob to 0G Storage
└── Returns txHash + rootHash
│
▼
0G Storage Mainnet
│
└── File stored permanently on-chain

 Team

Solo builder — Cocod6

