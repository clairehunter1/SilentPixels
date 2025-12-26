import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ABI } from '../config/contracts';
import { encryptCidWithAddress, generateEphemeralWallet, shorten } from '../utils/encryption';
import { mockIPFSUpload } from '../utils/ipfs';
import '../styles/UploadPanel.css';

type UploadPanelProps = {
  contractAddress?: `0x${string}`;
  isContractReady: boolean;
  onStored: () => void;
  zamaInstance: any;
  zamaLoading: boolean;
  zamaError: string | null;
};

export function UploadPanel({ contractAddress, isContractReady, onStored, zamaInstance, zamaLoading, zamaError }: UploadPanelProps) {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ephemeralAddress, setEphemeralAddress] = useState('');
  const [encryptedCid, setEncryptedCid] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const instance = zamaInstance;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isReadyToSubmit = useMemo(
    () => Boolean(selectedFile && ipfsHash && address && contractAddress && instance && isContractReady),
    [selectedFile, ipfsHash, address, contractAddress, instance, isContractReady]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    setIpfsHash('');
    setUploadMessage('');
    setEncryptedCid('');
    setEphemeralAddress('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pick a file first.');
      return;
    }
    setError('');
    setIsUploading(true);
    setUploadMessage('Connecting to mock IPFS...');
    try {
      const result = await mockIPFSUpload(selectedFile);
      setIpfsHash(result.hash);
      setUploadMessage(`Uploaded ${Math.round(selectedFile.size / 1024)} KB`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStore = async () => {
    if (!instance || !address || !contractAddress || !isContractReady) {
      setError('Connect wallet and configure a valid contract address first.');
      return;
    }
    if (!signerPromise) {
      setError('Wallet signer not available.');
      return;
    }
    if (!ipfsHash || !selectedFile) {
      setError('Upload to IPFS before storing on-chain.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setTxHash('');
    setEphemeralAddress('');
    setEncryptedCid('');

    try {
      const ephemeral = generateEphemeralWallet();
      const cipherCid = encryptCidWithAddress(ipfsHash, ephemeral.address);

      const input = instance.createEncryptedInput(contractAddress, address);
      input.addAddress(ephemeral.address);
      const encryptedInput = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(contractAddress, CONTRACT_ABI, signer);
      const tx = await contract.storeFile(
        fileName || selectedFile.name,
        cipherCid,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();

      setTxHash(tx.hash);
      setEphemeralAddress(ephemeral.address);
      setEncryptedCid(cipherCid);
      onStored();
      setUploadMessage('Saved on-chain.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Upload & encrypt</p>
          <h3 className="panel-title">Push a media file into the encrypted vault</h3>
        </div>
        <div className={`pill ${isContractReady ? 'pill-live' : 'pill-idle'}`}>
          {isContractReady ? 'contract ready' : 'set contract'}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Choose an image or video</label>
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="file-input" />
        {previewUrl ? (
          <div className="preview-box">
            {selectedFile?.type.startsWith('video/') ? (
              <video src={previewUrl} controls className="media-preview" />
            ) : (
              <img src={previewUrl} alt="preview" className="media-preview" />
            )}
          </div>
        ) : (
          <p className="helper">Pick a local asset. Nothing is uploaded until you hit the buttons below.</p>
        )}
      </div>

      <div className="input-group">
        <label className="input-label">File name to record</label>
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="text-input"
          placeholder="my-memory.png"
        />
      </div>

      <div className="actions-row">
        <button className="ghost-button" onClick={handleUpload} disabled={isUploading || !selectedFile}>
          {isUploading ? 'Uploading...' : ipfsHash ? 'Re-upload mock IPFS' : 'Upload to mock IPFS'}
        </button>
        <button
          className="primary-button"
          onClick={handleStore}
          disabled={!isReadyToSubmit || isSubmitting || zamaLoading}
        >
          {zamaLoading ? 'Starting relayer...' : isSubmitting ? 'Encrypting & storing...' : 'Encrypt and store'}
        </button>
      </div>

      <div className="status-grid">
        <div className="status-tile">
          <p className="tile-label">Mock IPFS hash</p>
          <p className="tile-value">{ipfsHash || 'pending'}</p>
        </div>
        <div className="status-tile">
          <p className="tile-label">Ephemeral address</p>
          <p className="tile-value">{ephemeralAddress ? shorten(ephemeralAddress) : 'generated on submit'}</p>
        </div>
        <div className="status-tile">
          <p className="tile-label">Encrypted hash (hex)</p>
          <p className="tile-value">{encryptedCid ? shorten(encryptedCid, 10, 6) : 'encrypted after submit'}</p>
        </div>
        <div className="status-tile">
          <p className="tile-label">Tx hash</p>
          <p className="tile-value">{txHash ? shorten(txHash, 10, 6) : 'awaiting broadcast'}</p>
        </div>
      </div>

      {uploadMessage && <p className="helper success">{uploadMessage}</p>}
      {error && <p className="helper error">{error}</p>}
      {zamaError && <p className="helper error">{zamaError}</p>}
    </div>
  );
}
