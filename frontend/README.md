# Silent Pixels Frontend

React + Vite interface for the EncryptedVault contract on Sepolia. Upload a local file, mock an IPFS hash, encrypt it with a generated address, and store the encrypted hash plus the FHE-encrypted address on-chain. Decrypt entries through the Zama relayer to recover the original hash.

## Run locally

```bash
npm install
npm run dev
```

- Default chain: Sepolia. No localhost or env-based settings are used.
- ABI comes from `deployments/sepolia/EncryptedVault.json` and is mirrored in `src/config/contracts.ts`.
- Set the contract address in the UI contract card (or update `CONTRACT_ADDRESS` in `src/config/contracts.ts` after deploying).

## Flow

1) Select an image or video from disk.
2) Mock an IPFS hash (randomized).
3) Generate a fresh address, encrypt the hash with that address, and send `storeFile` via ethers.
4) Read your entries with viem and decrypt the saved address through the relayer to recover the original hash.

Writes use `ethers`, reads use `viem`, and no local storage or mock data are persisted.
