import { ethers, Wallet } from 'ethers';

export function generateEphemeralWallet() {
  return Wallet.createRandom();
}

export function encryptCidWithAddress(cid: string, secretAddress: string): string {
  const cidBytes = ethers.toUtf8Bytes(cid);
  const key = ethers.toBeArray(ethers.keccak256(ethers.toUtf8Bytes(secretAddress.toLowerCase())));
  const encryptedBytes = cidBytes.map((byte, index) => byte ^ key[index % key.length]);
  return ethers.hexlify(encryptedBytes);
}

export function decryptCidWithAddress(encryptedCid: string, secretAddress: string): string {
  const encryptedBytes = ethers.getBytes(encryptedCid);
  const key = ethers.toBeArray(ethers.keccak256(ethers.toUtf8Bytes(secretAddress.toLowerCase())));
  const decrypted = encryptedBytes.map((byte, index) => byte ^ key[index % key.length]);
  return ethers.toUtf8String(decrypted);
}

export function shorten(value: string, head = 6, tail = 4) {
  if (!value) return '';
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
