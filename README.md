# Snac Monorepo

<a href="https://snac-ui.vercel.app/">Snac</a>
This repository contains the implementation of SNAC, a proof-of-concept system for confidential UTXO-based token transfers using zero-knowledge proofs on Ethereum.

## Directory Structure

<pre>
├── <a href="./snac_circuits/">zk-circuits</a>: – Noir circuits for UTXO proofs  
├── <a href="./snac_contracts/">contracts</a>: - Core Solidity contracts (commitments, nullifiers, verifier)  
├── <a href="./snac_front/">ui</a>: – React UI for deposits, withdrawals, and transfer history
├── <a href="./snac_relayer">relayer</a>: - Off-chain relayer monitoring ERC-20 events & routing deposits
</pre>

## How it works

1. **Deposit address and identifier**

   - The user generates a 6-digit numerical deposit address.
   - An **identifier** is computed as the hash of that address.

2. **Commitment**

   - The user signs the deposit identifier and hashes the signature to create a **commitment**, which they store on-chain.
   - Later, this commitment proves ownership of the deposit address.

3. **Sending tokens into the contract**

   - To send tokens, a sender transfers them to the contract and appends the 6-digit deposit address as the transaction’s last six digits.
   - SNAC relayers watch for these deposits, generate a zero-knowledge proof, and mint a corresponding UTXO for the recipient.

4. **Spending a UTXO**
   To spend funds, the user must prove within the SNAC circuit that:

   1. The UTXO exists.
   2. The UTXO is unspent.
   3. The UTXO belongs to them (by revealing the signed deposit identifier).

   - Once the proof is generated, it’s submitted to the SNAC contract to consume the UTXO.

5. **Withdrawing or transferring funds**

   - **External withdrawal:** The user specifies an Ethereum address and an amount. The contract consumes the UTXO, sends the requested amount out, and—if there is change—creates a new "change" UTXO for the leftover balance. The user designates who owns this change UTXO (e.g., themselves).
   - **Internal transfer:** If the user wants to transfer funds to another SNAC deposit address, the circuit consumes the input UTXO and creates two output UTXOs: one for the recipient and one for any change. The user must supply two deposit identifiers to prove ownership of both outputs.

## Future work

- Deploy the SNAC contract on multiple blockchains.
- Connect chains via a bridge-like protocol to form a **confidential abstract account**.
- Build a decentralized relayer-and-mixer network that receives encrypted transaction data, mixes it for privacy, and routes each transaction to the correct destination chain.
