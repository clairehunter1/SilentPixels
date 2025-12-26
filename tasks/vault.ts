import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ethers as EthersT } from "ethers";

function encryptCidWithAddress(cid: string, secretAddress: string): string {
  const cidBytes = EthersT.toUtf8Bytes(cid);
  const key = EthersT.toBeArray(EthersT.keccak256(EthersT.toUtf8Bytes(secretAddress.toLowerCase())));

  const encryptedBytes = cidBytes.map((byte, index) => byte ^ key[index % key.length]);
  return EthersT.hexlify(encryptedBytes);
}

task("vault:address", "Prints the EncryptedVault address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const deployment = await hre.deployments.get("EncryptedVault");
  console.log("EncryptedVault address:", deployment.address);
});

task("vault:store", "Store an encrypted file entry")
  .addParam("name", "File name to record")
  .addParam("cid", "IPFS hash to encrypt before saving")
  .addOptionalParam("secret", "Optional pre-generated address used to encrypt the hash")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = await deployments.get("EncryptedVault");
    const signer = (await ethers.getSigners())[0];

    const ephemeralAddress = taskArguments.secret ?? EthersT.Wallet.createRandom().address;
    const encryptedCid = encryptCidWithAddress(taskArguments.cid, ephemeralAddress);

    const input = fhevm.createEncryptedInput(deployment.address, signer.address);
    input.addAddress(ephemeralAddress);
    const encrypted = await input.encrypt();

    const contract = await ethers.getContractAt("EncryptedVault", deployment.address);
    const tx = await contract
      .connect(signer)
      .storeFile(taskArguments.name, encryptedCid, encrypted.handles[0], encrypted.inputProof);

    console.log(`Storing file '${taskArguments.name}' with tx ${tx.hash}`);
    await tx.wait();

    console.log("Ephemeral address:", ephemeralAddress);
    console.log("Encrypted CID:", encryptedCid);
  });

task("vault:list", "List encrypted files for a user")
  .addOptionalParam("user", "Owner address. Defaults to the first signer.")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;
    const deployment = await deployments.get("EncryptedVault");
    const contract = await ethers.getContractAt("EncryptedVault", deployment.address);

    const owner = taskArguments.user ?? (await ethers.getSigners())[0].address;
    const count = await contract.getFileCount(owner);
    console.log(`Found ${count.toString()} file(s) for ${owner}`);

    for (let i = 0; i < Number(count); i++) {
      const record = await contract.getFile(owner, i);
      console.log(`- [${i}] ${record.fileName} at ${new Date(Number(record.createdAt) * 1000).toISOString()}`);
      console.log(`   encryptedCid: ${record.encryptedCid}`);
      console.log(`   encryptedAddress: ${record.encryptedSecretAddress}`);
    }
  });
