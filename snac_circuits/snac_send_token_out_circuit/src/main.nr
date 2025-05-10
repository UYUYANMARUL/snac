mod U256;
use U256::U256Bytes;

struct InUtxo {
    deposit_hash: [u8; 32],
    amount: [u8; 32],
    signature: [u8; 64],
    nullifier_hash: [u8; 32],
}

struct Utxo {
    contract_address: [u8; 20],
    amount: [u8; 32],
    deposit_hash: [u8; 32],
    nullifier_hash: [u8; 32],
}

impl Utxo {
    fn new(
        contract_address: [u8; 20],
        amount: [u8; 32],
        deposit_hash: [u8; 32],
        nullifier_hash: [u8; 32],
    ) -> Self {
        Self { contract_address, amount, deposit_hash, nullifier_hash }
    }

    fn to_bytes(self) -> [u8; 116] {
        let mut utxo_bytes: [u8; 116] = [0; 116];

        for i in 0..20 {
            utxo_bytes[i] = self.contract_address[i];
        }
        for i in 20..52 {
            utxo_bytes[i] = self.amount[i - 20];
        }
        for i in 52..84 {
            utxo_bytes[i] = self.deposit_hash[i - 52];
        }
        for i in 84..116 {
            utxo_bytes[i] = self.nullifier_hash[i - 84];
        }
        utxo_bytes
    }
}

unconstrained fn check_utxo(
    utxo: InUtxo,
    contract_address: [u8; 20],
    utxo_commitment: [u8; 32],
    ownership_commitment: [u8; 32],
    public_key_x: [u8; 32],
    public_key_y: [u8; 32],
) -> U256Bytes {
    // check is the signature is created with that utxo deposit hash
    assert(std::ecdsa_secp256k1::verify_signature(
        public_key_x,
        public_key_y,
        utxo.signature,
        utxo.deposit_hash,
    ));

    let calc_ownership_commitment = std::hash::keccak256(utxo.signature, 64);

    assert(calc_ownership_commitment == ownership_commitment);

    let utxo_bytes = Utxo::new(
        contract_address,
        utxo.amount,
        utxo.deposit_hash,
        utxo.nullifier_hash,
    )
        .to_bytes();

    let digest = std::hash::keccak256(utxo_bytes, 116);

    assert(digest == utxo_commitment);

    U256Bytes::new(utxo.amount)
}

pub struct ReturnValues {
    utxo_commitment: [u8; 32],
    utxo_bytes: [u8; 116],
}

unconstrained fn main(
    utxos: [InUtxo; 3],
    public_key_x: [u8; 32],
    public_key_y: [u8; 32],
    utxo_commitments: pub [[u8; 32]; 3],
    ownership_commitments: pub [[u8; 32]; 3],
    utxo_len: u8,
    contract_address: pub [u8; 20],
    send_amount: pub [u8; 32],
    deposit_hash: pub [u8; 32],
    nullifier_hash: [u8; 32],
) -> pub ReturnValues {
    assert(utxo_len < 4);
    let mut amount = U256Bytes::zero();

    let send_amount = U256Bytes::new(send_amount);

    for i in 0..utxo_len {
        let utxo_amount = check_utxo(
            utxos[i],
            contract_address,
            utxo_commitments[i],
            ownership_commitments[i],
            public_key_x,
            public_key_y,
        );
        amount += utxo_amount;
    }

    assert(send_amount <= amount);

    let left_amount = amount - send_amount;

    let utxo_bytes = Utxo::new(
        contract_address,
        left_amount.limbs,
        deposit_hash,
        nullifier_hash,
    )
        .to_bytes();

    let utxo_commitment = std::hash::keccak256(utxo_bytes, 116);

    ReturnValues { utxo_commitment: utxo_commitment, utxo_bytes: utxo_bytes }
}

#[test]
fn test_main() {
    //let a = main(utxos,"0xD7B26926901469501C66e084e0bB71599599025A",5,"0xD7B26926901469501C66e084e0bB71599599025A","0xD7B26926901469501C66e084e0bB71599599025A","0xD7B26926901469501C66e084e0bB71599599025A");
    //assert_eq(main(3,2,1,1,1),main(4,3,3,2,1));

    let mut amount = U256Bytes::zero();

    let public_key_x: [u8; 32] = [
        111, 241, 83, 107, 82, 101, 101, 129, 169, 66, 17, 44, 124, 17, 14, 45, 8, 174, 17, 107,
        158, 25, 40, 101, 156, 220, 247, 149, 102, 64, 184, 117,
    ];

    let public_key_y: [u8; 32] = [
        57, 45, 119, 29, 254, 73, 64, 167, 113, 188, 250, 60, 71, 96, 247, 41, 94, 48, 94, 169, 106,
        183, 5, 186, 77, 30, 252, 151, 59, 252, 102, 165,
    ];

    let message_hash: [u8; 32] = [
        74, 92, 93, 69, 71, 33, 187, 187, 37, 84, 12, 51, 23, 82, 30, 113, 195, 115, 174, 54, 69,
        143, 150, 13, 42, 212, 110, 240, 136, 17, 14, 149,
    ];

    let signature: [u8; 64] = [
        1, 51, 20, 152, 243, 70, 196, 142, 235, 229, 8, 188, 86, 121, 134, 105, 178, 60, 250, 236,
        22, 0, 103, 118, 181, 177, 152, 213, 135, 228, 105, 46, 17, 106, 197, 154, 89, 129, 24, 102,
        210, 159, 211, 113, 16, 121, 198, 235, 26, 101, 156, 0, 116, 174, 205, 62, 81, 166, 43, 234,
        107, 8, 33, 72,
    ];
    // 4. Verify
    let is_valid =
        std::ecdsa_secp256k1::verify_signature(public_key_x, public_key_y, signature, message_hash);

    assert(is_valid); // should pass
}
