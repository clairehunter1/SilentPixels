import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { isAddress } from 'viem';
import { Header } from './Header';
import { UploadPanel } from './UploadPanel';
import { FileGallery } from './FileGallery';
import { CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_CHAIN_ID } from '../config/contracts';
import type { VaultFile } from '../type/vault';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/VaultApp.css';

function normalizeRecords(data?: unknown): VaultFile[] {
  if (!Array.isArray(data)) return [];

  return data.map((item, index) => {
    if (Array.isArray(item)) {
      const [fileName, encryptedCid, encryptedSecretAddress, createdAt] = item as [
        string,
        string,
        string,
        bigint
      ];

      return {
        index,
        fileName,
        encryptedCid,
        encryptedSecretAddress,
        createdAt: typeof createdAt === 'bigint' ? createdAt : BigInt(createdAt ?? 0),
      };
    }

    const record = item as Record<string, unknown>;
    const rawCreatedAt = record.createdAt;
    const normalizedCreatedAt =
      typeof rawCreatedAt === 'bigint'
        ? rawCreatedAt
        : typeof rawCreatedAt === 'number' || typeof rawCreatedAt === 'string'
        ? BigInt(rawCreatedAt)
        : BigInt(0);
    return {
      index,
      fileName: (record.fileName as string) ?? '',
      encryptedCid: (record.encryptedCid as string) ?? '0x',
      encryptedSecretAddress: (record.encryptedSecretAddress as string) ?? '0x',
      createdAt: normalizedCreatedAt,
    };
  });
}

export function VaultApp() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();
  const [contractAddress, setContractAddress] = useState<string>(CONTRACT_ADDRESS);
  const [contractInput, setContractInput] = useState<string>(CONTRACT_ADDRESS);
  const [contractError, setContractError] = useState<string>('');

  const validAddress = isAddress(contractAddress) ? (contractAddress as `0x${string}`) : undefined;
  const readyAddress =
    validAddress && contractAddress !== '0x0000000000000000000000000000000000000000' ? validAddress : undefined;
  const filesQuery = useReadContract({
    address: readyAddress && address ? readyAddress : undefined,
    abi: CONTRACT_ABI,
    functionName: 'getFiles',
    args: readyAddress && address ? [address] : undefined,
    query: {
      enabled: Boolean(address && readyAddress),
    },
  });

  const files = useMemo(() => normalizeRecords(filesQuery.data), [filesQuery.data]);

  const handleContractUpdate = () => {
    if (!contractInput || !isAddress(contractInput)) {
      setContractError('Enter a valid Sepolia contract address before interacting.');
      return;
    }
    setContractError('');
    setContractAddress(contractInput as `0x${string}`);
    filesQuery.refetch();
  };

  const isContractReady = Boolean(readyAddress);

  return (
    <div className="vault-app">
      <Header />
      <main className="main-shell">
        <section className="hero">
          <div>
            <div className="eyebrow">FHE encrypted vault</div>
            <h2 className="hero-title">Lock files with Zama and decrypt only when you choose</h2>
            <p className="hero-copy">
              Upload any image or video, mock an IPFS hash, encrypt it with a fresh on-the-fly address, and store the
              cipher plus the FHE-encrypted address on-chain. Decrypt the secret address through the relayer to recover
              the original IPFS hash whenever you need it.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <p className="stat-label">Active chain</p>
                <p className="stat-value">Sepolia #{CONTRACT_CHAIN_ID}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Files in your locker</p>
                <p className="stat-value">{files.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="contract-card">
          <div className="contract-top">
            <div>
              <p className="contract-label">Contract address</p>
              <p className="contract-value">{contractAddress || 'not set'}</p>
            </div>
            <div className={`contract-dot ${isContractReady ? 'online' : 'offline'}`}>
              {isContractReady ? 'ready' : 'needs address'}
            </div>
          </div>
          <div className="contract-controls">
            <input
              value={contractInput}
              onChange={(e) => setContractInput(e.target.value)}
              placeholder="0x..."
              className="contract-input"
            />
            <button className="contract-button" onClick={handleContractUpdate}>
              Update contract
            </button>
          </div>
          <p className="contract-hint">
            Use the address from a Sepolia deployment. The ABI comes from deployments/sepolia/EncryptedVault.json.
          </p>
          {contractError && <p className="error-text">{contractError}</p>}
        </section>

        <section className="content-grid">
          <UploadPanel
            contractAddress={readyAddress}
            onStored={() => filesQuery.refetch()}
            isContractReady={isContractReady}
            zamaInstance={instance}
            zamaLoading={zamaLoading}
            zamaError={zamaError}
          />
          <FileGallery
            files={files}
            contractAddress={readyAddress}
            isLoading={filesQuery.isFetching}
            onRefresh={() => filesQuery.refetch()}
            zamaInstance={instance}
            zamaLoading={zamaLoading}
            zamaError={zamaError}
          />
        </section>
      </main>
    </div>
  );
}
