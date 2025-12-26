import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { EncryptedVault, EncryptedVault__factory } from "../types";

type Signers = {
  uploader: HardhatEthersSigner;
  viewer: HardhatEthersSigner;
};

function encryptCidWithAddress(cid: string, secretAddress: string): string {
  const cidBytes = ethers.toUtf8Bytes(cid);
  const key = ethers.toBeArray(ethers.keccak256(ethers.toUtf8Bytes(secretAddress.toLowerCase())));
  const encryptedBytes = cidBytes.map((byte, index) => byte ^ key[index % key.length]);
  return ethers.hexlify(encryptedBytes);
}

function decryptCidWithAddress(encryptedCid: string, secretAddress: string): string {
  const encryptedBytes = ethers.getBytes(encryptedCid);
  const key = ethers.toBeArray(ethers.keccak256(ethers.toUtf8Bytes(secretAddress.toLowerCase())));
  const decrypted = encryptedBytes.map((byte, index) => byte ^ key[index % key.length]);
  return ethers.toUtf8String(decrypted);
}

describe("EncryptedVault", function () {
  let signers: Signers;
  let vault: EncryptedVault;
  let vaultAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { uploader: ethSigners[0], viewer: ethSigners[1] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = (await ethers.getContractFactory("EncryptedVault")) as EncryptedVault__factory;
    vault = (await factory.deploy()) as EncryptedVault;
    vaultAddress = await vault.getAddress();
  });

  it("stores encrypted entries and keeps metadata accessible", async function () {
    const fileName = "memory.jpg";
    const cid = "QmSilentPixelsMemoryHash";
    const ephemeral = ethers.Wallet.createRandom();

    const encryptedCid = encryptCidWithAddress(cid, ephemeral.address);
    const encryptedAddressInput = await fhevm
      .createEncryptedInput(vaultAddress, signers.uploader.address)
      .addAddress(ephemeral.address)
      .encrypt();

    await vault
      .connect(signers.uploader)
      .storeFile(fileName, encryptedCid, encryptedAddressInput.handles[0], encryptedAddressInput.inputProof);

    const count = await vault.getFileCount(signers.uploader.address);
    expect(count).to.eq(1);

    const record = await vault.getFile(signers.uploader.address, 0);
    expect(record.fileName).to.eq(fileName);
    expect(record.encryptedCid).to.eq(encryptedCid);

    const decryptedAddress = await fhevm.userDecryptEaddress(
      record.encryptedSecretAddress,
      vaultAddress,
      signers.uploader,
    );
    expect(decryptedAddress.toLowerCase()).to.eq(ephemeral.address.toLowerCase());

    const decryptedCid = decryptCidWithAddress(record.encryptedCid, decryptedAddress);
    expect(decryptedCid).to.eq(cid);
  });

  it("lists multiple files for a user", async function () {
    const firstSecret = ethers.Wallet.createRandom();
    const secondSecret = ethers.Wallet.createRandom();
    const firstCid = encryptCidWithAddress("QmFileOne", firstSecret.address);
    const secondCid = encryptCidWithAddress("QmFileTwo", secondSecret.address);

    const firstInput = await fhevm
      .createEncryptedInput(vaultAddress, signers.uploader.address)
      .addAddress(firstSecret.address)
      .encrypt();
    const secondInput = await fhevm
      .createEncryptedInput(vaultAddress, signers.uploader.address)
      .addAddress(secondSecret.address)
      .encrypt();

    await vault
      .connect(signers.uploader)
      .storeFile("first.mov", firstCid, firstInput.handles[0], firstInput.inputProof);
    await vault
      .connect(signers.uploader)
      .storeFile("second.mp4", secondCid, secondInput.handles[0], secondInput.inputProof);

    const allFiles = await vault.getFiles(signers.uploader.address);
    expect(allFiles.length).to.eq(2);
    expect(allFiles[0].fileName).to.eq("first.mov");
    expect(allFiles[1].fileName).to.eq("second.mp4");
  });

  it("reverts when asking for an invalid index", async function () {
    await expect(vault.getFile(signers.uploader.address, 0)).to.be.revertedWith("Invalid file index");
  });
});
