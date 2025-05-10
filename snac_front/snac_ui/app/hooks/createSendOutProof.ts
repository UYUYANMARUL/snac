import { UltraHonkBackend, UltraPlonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import circuit from "@/circuit/snac_send_token_out_circuit.json";
import { hashMessage, keccak256, sha256, toUtf8Bytes, Wallet } from "ethers";
import {
  bigIntToU8Array,
  addressToBytes,
  type Utxo,
  UtxoToBytes,
} from "@/lib/utils";
import { getAddress, getBytes } from "ethers";

export async function createSendOutProof() {
  const wallet = new Wallet(
    "0x60e24ee7e0e905bed1f7ed45a39eed97c70050b777d1d2c9103787affe5af8a6"
  );

  const uncompressedPubKey = wallet.signingKey.publicKey;

  const hex = uncompressedPubKey.slice(2); // remove '0x'

  const publicKeyX = Array.from(getBytes("0x" + hex.slice(2, 2 + 64)));
  const publicKeyY = Array.from(getBytes("0x" + hex.slice(2 + 64)));

  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);
  const array1 = Array.from({ length: 32 }, (_, i) => i);
  const array2 = Array.from(Array(64).keys());

  const signature = getBytes(
    await wallet.signMessage(Uint8Array.from(array1))
  ).slice(0, 64);

  const signatureBytes = Array.from(signature);

  let ownership_commitment = Array.from(getBytes(keccak256(signature)));

  const contract_address_string = "0x8ba1f109551bd432803012645ac136ddd64dba72";

  const contract_address_bytes: number[] = addressToBytes(
    contract_address_string
  );

  const utxo: Utxo = {
    deposit_hash: Array.from(getBytes(hashMessage(Uint8Array.from(array1)))),
    amount: bigIntToU8Array(2n, 32),
    signature: signatureBytes,
    nullifier_hash: array1,
    contract_address: contract_address_bytes,
  };

  const utxo_commitment = Array.from(getBytes(keccak256(UtxoToBytes(utxo))));

  const utxos = [utxo, utxo, utxo];

  const ownership_commitments = [
    ownership_commitment,
    ownership_commitment,
    ownership_commitment,
  ];

  const utxo_commitments = [utxo_commitment, utxo_commitment, utxo_commitment];

  const privateInputs = {
    utxos,
    utxo_len: 3,
    utxo_commitments,
    ownership_commitments,
    contract_address: contract_address_bytes,
    send_amount: bigIntToU8Array(3n, 32),
    deposit_hash: array1,
    nullifier_hash: array1,
    public_key_x: publicKeyX,
    public_key_y: publicKeyY,
  };

  const { witness, returnValue } = await noir.execute(privateInputs);

  const proof = await backend.generateProof(witness, { keccak: true });

  const isValid = await backend.verifyProof(proof);

  const proofJson = {
    proof: proof.proof.toHex(),
    publicInputs: proof.publicInputs,
  };

  return proofJson;
}
