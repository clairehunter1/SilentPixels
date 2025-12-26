import type { Abi } from 'viem';

export const CONTRACT_CHAIN_ID = 11155111;
export const CONTRACT_ADDRESS = '0x1888Fb8F76b2be017BfE63256dF35eB3F038d7ce';

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "ZamaProtocolUnsupported",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "fileName",
        type: "string"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "createdAt",
        type: "uint256"
      }
    ],
    name: "FileStored",
    type: "event"
  },
  {
    inputs: [],
    name: "confidentialProtocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "getFile",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "fileName",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "encryptedCid",
            type: "bytes"
          },
          {
            internalType: "eaddress",
            name: "encryptedSecretAddress",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "createdAt",
            type: "uint256"
          }
        ],
        internalType: "struct EncryptedVault.FileRecord",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "getFileCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "getFiles",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "fileName",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "encryptedCid",
            type: "bytes"
          },
          {
            internalType: "eaddress",
            name: "encryptedSecretAddress",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "createdAt",
            type: "uint256"
          }
        ],
        internalType: "struct EncryptedVault.FileRecord[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "fileName",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "encryptedCid",
        type: "bytes"
      },
      {
        internalType: "externalEaddress",
        name: "encryptedSecretAddress",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes"
      }
    ],
    name: "storeFile",
    outputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const satisfies Abi;
