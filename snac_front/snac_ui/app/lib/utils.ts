import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAddress, getBytes } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bigIntToU8Array(value: bigint, byteLength: number) {
  if (typeof value !== "bigint") {
    throw new TypeError("value must be a BigInt"); // :contentReference[oaicite:0]{index=0}
  }
  if (value < 0n) {
    throw new RangeError("Cannot convert negative BigInt to bytes"); // :contentReference[oaicite:1]{index=1}
  }

  // Pre-allocate the output
  const bytes = []; // :contentReference[oaicite:2]{index=2}

  // Fill from the end (least significant byte) backwards
  let temp = value;
  for (let i = byteLength - 1; i >= 0; i--) {
    bytes[i] = Number(temp & 0xffn); // :contentReference[oaicite:3]{index=3}
    temp >>= 8n;
  }

  if (temp !== 0n) {
    throw new RangeError("BigInt too large to fit in byteLength"); // :contentReference[oaicite:4]{index=4}
  }

  return bytes;
}

export function addressToBytes(address: string) {
  // Normalize to a checksummed address (20 bytes, hex-prefixed)
  const checksumAddress = getAddress(address);
  // Convert the hex string to a Uint8Array
  return Array.from(getBytes(checksumAddress));
}

export type Utxo = {
  deposit_hash: number[];
  amount: number[];
  signature: number[];
  nullifier_hash: number[];
  contract_address: number[];
};

export function UtxoToBytes(utxo: Utxo): Uint8Array {
  // Convert each field to a Uint8Array
  const depHashBytes = Uint8Array.from(utxo.deposit_hash);
  const amountBytes = Uint8Array.from(utxo.amount);
  const contractAddressBytes = Uint8Array.from(utxo.contract_address);
  const nullifierHashBytes = Uint8Array.from(utxo.nullifier_hash);

  return new Uint8Array([
    ...contractAddressBytes,
    ...amountBytes,
    ...depHashBytes,
    ...nullifierHashBytes,
  ]);
}

export function enforceSuffixBigInt(input: bigint, suffix: bigint) {
  const factor = 10n ** BigInt(String(suffix).length);
  const big = typeof input === "bigint" ? input : BigInt(input);

  return (big / factor) * factor + BigInt(suffix);
}

export function getDepositSuffixBigInt(code: string) {
  const str = String(code);
  // Extract last 6 chars
  const suffix = str.slice(-6);
  // Ensure suffix is exactly 6 characters and all digits
  if (suffix.length === 6 && /^\d{6}$/.test(suffix)) {
    return BigInt(suffix);
  }
  return null;
}
