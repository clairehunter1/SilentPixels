// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SilentPixelsVault
/// @notice Stores encrypted file metadata and Zama-protected secret addresses.
/// Users upload a file, encrypt its IPFS hash with a locally generated address,
/// and store the encrypted hash plus the encrypted address on-chain.
contract EncryptedVault is ZamaEthereumConfig {
    struct FileRecord {
        string fileName;
        bytes encryptedCid;
        eaddress encryptedSecretAddress;
        uint256 createdAt;
    }

    mapping(address => FileRecord[]) private _userFiles;

    event FileStored(address indexed owner, uint256 indexed index, string fileName, uint256 createdAt);

    /// @notice Save a new encrypted file record for the sender.
    /// @param fileName Original file name selected by the user.
    /// @param encryptedCid IPFS hash encrypted off-chain with the user's ephemeral address.
    /// @param encryptedSecretAddress Encrypted representation of the ephemeral address.
    /// @param inputProof Proof produced by the relayer SDK for the encrypted address.
    /// @return index Index of the stored file for the sender.
    function storeFile(
        string calldata fileName,
        bytes calldata encryptedCid,
        externalEaddress encryptedSecretAddress,
        bytes calldata inputProof
    ) external returns (uint256 index) {
        require(bytes(fileName).length > 0, "File name required");
        require(encryptedCid.length > 0, "Encrypted hash required");

        eaddress validatedSecret = FHE.fromExternal(encryptedSecretAddress, inputProof);

        FileRecord memory record = FileRecord({
            fileName: fileName,
            encryptedCid: encryptedCid,
            encryptedSecretAddress: validatedSecret,
            createdAt: block.timestamp
        });

        _userFiles[msg.sender].push(record);

        FHE.allow(record.encryptedSecretAddress, msg.sender);
        FHE.allowThis(record.encryptedSecretAddress);

        index = _userFiles[msg.sender].length - 1;
        emit FileStored(msg.sender, index, fileName, record.createdAt);
    }

    /// @notice Get a single file record for a given owner and index.
    /// @dev View methods do not rely on msg.sender to comply with repository constraints.
    function getFile(address owner, uint256 index) external view returns (FileRecord memory) {
        require(index < _userFiles[owner].length, "Invalid file index");
        return _userFiles[owner][index];
    }

    /// @notice Return every stored file for a specific owner.
    /// @dev Intended for off-chain consumption; avoid for unbounded on-chain calls.
    function getFiles(address owner) external view returns (FileRecord[] memory) {
        return _userFiles[owner];
    }

    /// @notice Return the number of files registered by an owner.
    function getFileCount(address owner) external view returns (uint256) {
        return _userFiles[owner].length;
    }
}
