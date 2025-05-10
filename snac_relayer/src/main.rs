use ethers_providers::Ws;
use hex::FromHex;
use sha3::{Digest, Keccak256};
use std::sync::Arc;

/// This uses the standard ERC-20 ABI fragment for the Transfer event
abigen!(
    ERC20,
    r#"[
        event Transfer(address indexed from, address indexed to, uint256 value)
    ]"#
);

struct UtxoCommitment {
    contract_address: [u8; 32],
    amount: [u8; 32],
    deposit_hash: [u8; 32],
    nullifier_hash: [u8; 32],
}

impl UtxoCommitment {
    pub fn new(contract_address: [u8; 32], amount: [u8; 32], deposit_hash: [u8; 32]) -> Self {
        let nullifier_hash: [u8; 32] = rand::random();

        Self {
            contract_address,
            amount,
            deposit_hash,
            nullifier_hash,
        }
    }

    pub fn to_bytes(&self) -> [u8; 128] {
        let mut buf = [0u8; 128]; // dst must be initialized :contentReference[oaicite:0]{index=0}
        buf[0..32].copy_from_slice(&self.contract_address); // copy first 32 bytes :contentReference[oaicite:1]{index=1}
        buf[32..64].copy_from_slice(&self.amount); // next 32 :contentReference[oaicite:2]{index=2}
        buf[64..96].copy_from_slice(&self.deposit_hash); // …and so on :contentReference[oaicite:3]{index=3}
        buf[96..128].copy_from_slice(&self.nullifier_hash);
        buf
    }
}
use ethers::prelude::*;
use ethers::types::{Filter, ValueOrArray, H256};
use futures::StreamExt;
use std::convert::TryFrom;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let ws = Ws::connect("wss://sepolia.drpc.org").await?;
    let provider = Provider::new(ws);
    let desired_contract_address = "";

    let transfer_event_sig: H256 = H256::from_slice(&ethers::utils::keccak256(
        "Transfer(address,address,uint256)",
    ));

    let filter = Filter::new().topic0(ValueOrArray::Value(transfer_event_sig));

    let mut stream = provider.subscribe_logs(&filter).await?;

    println!("Listening for live ERC-20 Transfer events...");

    while let Some(log) = stream.next().await {
        if (desired_contract_address == log.topics[2].to_string()) {
            let token_address = <[u8; 32]>::from_hex(log.address)?;

            let contract_address = <[u8; 32]>::from_hex(log.topics[2])?;

            let amount = <[u8; 32]>::from_hex(log.data)?;

            let utxo_commitment = UtxoCommitment::new(contract_address, amount, amount);

            let mut hasher = Keccak256::new();
            hasher.update(utxo_commitment.to_bytes());
            let digest = hasher.finalize();
        }
    }

    Ok(())
}
