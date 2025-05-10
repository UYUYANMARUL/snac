use std::sync::Arc;

use ethers::prelude::*;
use ethers::providers::Http;
use ethers::utils::keccak256;
use ethers::utils::rlp::Encodable;
mod mpt;
use crate::mpt::{EthTrie, MemoryDB, Trie, TrieError};
use rlp::RlpStream;

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let provider = Provider::<Http>::try_from("https://eth.drpc.org")?;

    let hash: H256 =
        "0x19b00ffbde2fb19fc250372c46068940d6336426ec6d57be7da35115dc9d2508".parse()?;

    let receipt: TransactionReceipt = provider.get_transaction_receipt(hash).await?.unwrap();
    let block_number = receipt.block_number.unwrap().as_u64();
    let block = provider.get_block(block_number).await?.unwrap();

    let mut receipts = vec![];

    for transaction in block.transactions {
        let receipt = provider
            .get_transaction_receipt(transaction)
            .await
            .unwrap()
            .unwrap();
        receipts.push(receipt);
    }

    let receipt_root = block.receipts_root;

    let memdb = Arc::new(MemoryDB::new(false));

    let mut tree = EthTrie::new(memdb);

    for receipt in receipts.iter() {
        println!("{:?}", &receipt.transaction_index.rlp_bytes());
        tree.insert(&receipt.transaction_index.rlp_bytes(), &receipt.rlp_bytes())
            .await;
    }

    println!("{:?}", receipts[2].rlp_bytes());

    let key = &receipt.transaction_index.rlp_bytes().to_vec();

    let calc_root_hash = tree.root_hash().await?;

    let proof = tree.get_proof(key).await?;

    let proof_res = tree.verify_proof(calc_root_hash, key, proof).await;

    println!("{:?}", calc_root_hash);

    println!("{:?}", receipt_root);

    println!("{:?}", proof_res);

    Ok(())
}
