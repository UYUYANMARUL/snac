use std::error::Error;
use std::fmt;

use alloy_primitives::B256;
use alloy_rlp::Error as RlpError;

use crate::mpt::nibbles::Nibbles;

#[derive(Debug, PartialEq, Eq)]
pub enum TrieError {
    DB(String),
    Decoder(RlpError),
    InvalidData,
    InvalidStateRoot,
    InvalidProof,
    MissingTrieNode {
        node_hash: B256,
        traversed: Option<Nibbles>,
        root_hash: Option<B256>,
        err_key: Option<Vec<u8>>,
    },
}

impl Error for TrieError {}

impl fmt::Display for TrieError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let printable = match *self {
            TrieError::DB(ref err) => format!("trie error: {:?}", err),
            TrieError::Decoder(ref err) => format!("trie error: {:?}", err),
            TrieError::InvalidData => "trie error: invalid data".to_owned(),
            TrieError::InvalidStateRoot => "trie error: invalid state root".to_owned(),
            TrieError::InvalidProof => "trie error: invalid proof".to_owned(),
            TrieError::MissingTrieNode { .. } => "trie error: missing node".to_owned(),
        };
        write!(f, "{}", printable)
    }
}

impl From<RlpError> for TrieError {
    fn from(error: RlpError) -> Self {
        TrieError::Decoder(error)
    }
}

#[derive(Debug)]
pub enum MemDBError {}

impl Error for MemDBError {}

impl fmt::Display for MemDBError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "error")
    }
}
