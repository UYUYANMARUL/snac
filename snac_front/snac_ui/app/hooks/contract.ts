import {
  AbstractProvider,
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  ethers,
  getBytes,
  isError,
  keccak256,
  toUtf8Bytes,
  zeroPadValue,
} from "ethers";
import ABI from "@/circuit/abi.json";
import { createSendInProof } from "./createSendInProof";
import { enforceSuffixBigInt, getDepositSuffixBigInt } from "@/lib/utils";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
];

const provider = new JsonRpcProvider("https://holesky.drpc.org");

export type Utxo = {
  deposit_hash: number[];
  amount: number[];
  nullifier_hash: number[];
  contract_address: number[];
  signature: number[];
};

const CONTRACT_ADDRESS = "0x514a0c40ee23A145f066e7c130B21DDc3D021350";

export type CreateDepositAddressInput = {
  depositAddress: string;
};

export async function createDepositAddress(
  signer: JsonRpcSigner,
  depositAddress: string,
  vaultHash: `0x${string}`
) {
  const snacContract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const seck1 = ethers.Wallet.createRandom();
  const depositHash = keccak256(toUtf8Bytes(depositAddress));
  const commitment = keccak256(await signer.signMessage(depositHash));
  const publicKey = zeroPadValue(
    Uint8Array.from(Array.from({ length: 32 }, (_, i) => i)),
    32
  );
  const signedPrivateKey = zeroPadValue(
    Uint8Array.from(Array.from({ length: 32 }, (_, i) => i)),
    32
  );

  const approveTx = await snacContract.createDepositAddress(
    depositAddress,
    commitment,
    publicKey,
    signedPrivateKey,
    vaultHash
  );

  await approveTx.wait();
}

export async function sendTokenIn(signer: JsonRpcSigner, utxos: Utxo) {
  const snacContract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const proof = createSendInProof();
  snacContract.sendTokenIn();
}

export async function sendTokenOut(
  signer: JsonRpcSigner,
  receiverAddress: string
) {
  const snacContract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  // const proof = createSendInProof();
  snacContract.sendTokenOut();
}

export async function sendTokenNormal(
  signer: JsonRpcSigner,
  depositCode: string,
  tokenAddress: string,
  amount: bigint
) {
  // 1. Validate depositCode format
  if (!/^\d{6}$/.test(depositCode)) {
    throw new Error("depositCode must be a 6-digit string");
  }
  const depositCodeN = getDepositSuffixBigInt(depositCode);

  if (!depositCodeN) {
    throw "err";
  }

  const finalAmount = enforceSuffixBigInt(amount, depositCodeN);

  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const approveTx = await tokenContract.approve(zeroAddress, finalAmount);
  await approveTx.wait();

  const transferTx = await tokenContract.transfer(zeroAddress, finalAmount);
  return transferTx;
}

export async function getDepositAddress(vaultKey?: `0x${string}`) {
  const snacContract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const depositHashes = snacContract.getVault(vaultKey);
  return depositHashes;
}

export async function getUtxos(depositHashes: string[]) {
  const snacContract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const utxoArray: string[] = [];
  for (const depositHash in depositHashes) {
    const utxoList: string[] = await snacContract.getUtxoInfo(depositHash);
    utxoArray.concat(utxoList);
  }
  return utxoArray;
}
