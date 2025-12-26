import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { decryptCidWithAddress, shorten } from '../utils/encryption';
import type { VaultFile } from '../type/vault';
import '../styles/FileGallery.css';

type FileGalleryProps = {
  files: VaultFile[];
  contractAddress?: `0x${string}`;
  isLoading: boolean;
  onRefresh: () => void;
  zamaInstance: any;
  zamaLoading: boolean;
  zamaError: string | null;
};

type DecryptedMap = Record<number, { address: string; cid: string }>;

export function FileGallery({
  files,
  contractAddress,
  isLoading,
  onRefresh,
  zamaInstance,
  zamaLoading,
  zamaError,
}: FileGalleryProps) {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const instance = zamaInstance;

  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [decrypted, setDecrypted] = useState<DecryptedMap>({});

  const sortedFiles = useMemo(() => [...files].sort((a, b) => Number(b.createdAt - a.createdAt)), [files]);

  const handleDecrypt = async (file: VaultFile) => {
    if (!instance || !address || !contractAddress) {
      setError('Connect wallet, wait for Zama relayer, and set a contract address.');
      return;
    }
    if (!signerPromise) {
      setError('Signer unavailable. Connect your wallet again.');
      return;
    }

    setDecryptingIndex(file.index);
    setError('');
    try {
      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        {
          handle: file.encryptedSecretAddress,
          contractAddress,
        },
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [contractAddress];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
      const signer = await signerPromise;
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      const decryptedAddress = result[file.encryptedSecretAddress];
      if (!decryptedAddress) {
        throw new Error('Decryption returned no address');
      }
      const cid = decryptCidWithAddress(file.encryptedCid, decryptedAddress);

      setDecrypted((prev) => ({
        ...prev,
        [file.index]: {
          address: decryptedAddress,
          cid,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt entry.');
    } finally {
      setDecryptingIndex(null);
    }
  };

  if (!files.length) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Stored files</p>
            <h3 className="panel-title">Nothing saved yet</h3>
          </div>
        </div>
        <p className="helper">Upload a file to see it appear here. We fetch your entries straight from the contract.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Stored files</p>
          <h3 className="panel-title">Decrypt entries pulled from the chain</h3>
        </div>
        <button className="ghost-button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="file-grid">
        {sortedFiles.map((file) => {
          const decryptedData = decrypted[file.index];
          return (
            <div key={`${file.fileName}-${file.index}`} className="file-card">
              <div className="file-header">
                <p className="file-name">{file.fileName}</p>
                <span className="timestamp">{new Date(Number(file.createdAt) * 1000).toLocaleString()}</span>
              </div>
              <p className="muted">Encrypted CID</p>
              <p className="mono">{shorten(file.encryptedCid, 12, 8)}</p>

              <p className="muted">Encrypted address handle</p>
              <p className="mono">{shorten(file.encryptedSecretAddress, 12, 8)}</p>

              {decryptedData ? (
                <div className="decrypted-block">
                  <p className="muted">Decrypted ephemeral address</p>
                  <p className="mono">{decryptedData.address}</p>
                  <p className="muted">Original IPFS hash</p>
                  <p className="mono">{decryptedData.cid}</p>
                </div>
              ) : (
                <button
                  className="primary-button full"
                  onClick={() => handleDecrypt(file)}
                  disabled={!!decryptingIndex || zamaLoading || !contractAddress}
                >
                  {decryptingIndex === file.index ? 'Decrypting...' : 'Decrypt hash'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="helper error">{error}</p>}
      {zamaError && <p className="helper error">{zamaError}</p>}
    </div>
  );
}
