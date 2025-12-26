# Silent Pixels Vault

Silent Pixels Vault is a privacy-first media vault that stores encrypted media metadata on-chain using Zama FHE. Users select a local image or video, generate a mock IPFS hash, create a fresh EVM address, encrypt the hash with that address, and store the encrypted hash alongside the FHE-encrypted address on-chain. When needed, the Zama relayer decrypts the address so the original hash can be recovered locally.

This repository contains both the smart contract workflow and a React + Vite frontend that uses ethers for writes, viem for reads, and the ABI generated from the deployed contract.

## What It Solves

- Keeps media metadata private on-chain while remaining verifiable and recoverable by the owner.
- Avoids exposing plaintext IPFS hashes in public state.
- Provides a repeatable, deterministic flow for encrypting and recovering metadata with Zama FHE.
- Demonstrates a practical FHE + web3 workflow without requiring real IPFS uploads (mock hash support).

## Key Advantages

- End-to-end encrypted metadata flow with Zama FHE.
- On-chain records are useful without disclosing sensitive values.
- Clear separation of responsibilities: contract, deployment, tasks, tests, and frontend.
- Owner-controlled decryption flow through a relayer, avoiding plaintext on-chain.
- Works with standard EVM wallets and Sepolia, with no localhost dependencies in the UI.

## How It Works (Data Flow)

1. User selects a local image or video.
2. The app generates a mock IPFS hash (no network upload).
3. A new random EVM address A is generated locally.
4. The IPFS hash is encrypted using address A.
5. The address A is encrypted using Zama FHE.
6. The contract stores: file name, encrypted hash, and FHE-encrypted address.
7. When the user wants to recover the hash, the relayer decrypts address A.
8. The user decrypts the encrypted hash with address A to recover the original IPFS hash.

## Tech Stack

- Smart contracts: Hardhat + Solidity
- FHE: Zama (see `docs/zama_llm.md`)
- Relayer: Zama relayer flow (see `docs/zama_doc_relayer.md`)
- Frontend: React + Vite
- Web3: ethers (writes), viem (reads), rainbow for wallet connection
- Package manager: npm
- Networks: Sepolia (deployment), Hardhat local node for tests

## Repository Structure

- `contracts/` smart contracts
- `deploy/` deployment scripts
- `tasks/` Hardhat tasks
- `test/` tests
- `deployments/` deployed artifacts and ABI (Sepolia)
- `frontend/` React + Vite app (no Tailwind, no JSON assets)
- `docs/` Zama documentation references

## Smart Contract Details

- Core contract: `contracts/EncryptedVault.sol`
- Generated ABI: `deployments/sepolia/EncryptedVault.json`
- View functions do not depend on `msg.sender` and use explicit addresses where needed.
- On-chain data stored is always encrypted; plaintext values are never stored.

## Local Development

Prerequisites:

- Node.js and npm installed
- Sepolia RPC access (INFURA_API_KEY)
- A funded EVM private key (PRIVATE_KEY) for Sepolia deployment

Install dependencies:

```bash
npm install
```

Compile contracts:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

Deploy locally:

```bash
npx hardhat deploy --network hardhat --export deployments/export.json
```

Deploy to Sepolia:

```bash
npx hardhat deploy --network sepolia
```

Notes:

- Deployment scripts load `process.env.INFURA_API_KEY` and `process.env.PRIVATE_KEY`.
- Mnemonics are not supported; only a private key is used.
- The Sepolia ABI is expected in `deployments/sepolia/EncryptedVault.json`.

## Hardhat Tasks

```bash
# Show the deployed address
npx hardhat vault:address

# Store an encrypted file entry (requires relayer setup)
npx hardhat vault:store --name sample.png --cid QmYourHashHere --secret 0xYourEphemeralAddress

# List stored entries for a user
npx hardhat vault:list --user 0xYourAddress
```

## Frontend Usage

The frontend lives in `frontend/`. It connects to Sepolia, writes with ethers, reads with viem, and uses the ABI copied from `deployments/sepolia/EncryptedVault.json`.

Install and run:

```bash
cd frontend
npm install
npm run dev
```

In the UI:

- Select an image or video file.
- Generate a mock IPFS hash locally.
- Create a random address and encrypt the hash.
- Submit the encrypted entry on-chain.
- Fetch your on-chain records.
- Decrypt address A through the relayer, then decrypt the hash locally.

Constraints:

- No Tailwind usage in the UI.
- No localhost network selection in the UI.
- No localStorage usage in the UI.
- No environment variables in the frontend.
- Do not load ABI from a JSON file in the frontend; copy it from `deployments/sepolia/EncryptedVault.json`.

## Security and Privacy Notes

- Only encrypted metadata is stored on-chain.
- The relayer decrypts address A; the raw IPFS hash is never sent on-chain.
- The IPFS hash is a mock for this workflow; you can swap it for a real CID later.
- Always protect your private key and ensure Sepolia funds are available for deployment and transactions.

## Future Roadmap

- Replace mock IPFS with real uploads while keeping the same encryption flow.
- Add multi-file batch operations with progress reporting.
- Improve relayer UX with status feedback and error recovery.
- Add optional metadata filtering and pagination for large histories.
- Add on-chain event indexing for faster history retrieval.
- Expand encryption policy options (time locks, delegated viewers).

## License

MIT. See `LICENSE`.
