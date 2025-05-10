fn add256(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
    let mut res: [u8; 32] = [0; 32];
    let mut carry: u16 = 0;
    // byte-wise from LSB (index 0) to MSB (index 31)
    for i in 0..32 {
        let sum: u16 = carry + a[i] as u16 + b[i] as u16;
        res[i] = (sum & 0xFF) as u8;
        carry = sum >> 8; // carry is 0 or 1 (max sum = 0x1FE) :contentReference[oaicite:0]{index=0}
    }
    res
}

fn sub256(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
    let mut res: [u8; 32] = [0; 32];
    let mut borrow: i16 = 0;
    // same direction
    for i in 0..32 {
        let diff: i16 = a[i] as i16 - b[i] as i16 - borrow;
        // if diff < 0, add 256 and borrow=1; else borrow=0 :contentReference[oaicite:1]{index=1}
        if diff < 0 {
            res[i] = (diff + 256) as u8;
            borrow = 1;
        } else {
            res[i] = diff as u8;
            borrow = 0;
        }
    }
    res
}

fn mul256(a: [u8; 32], b: [u8; 32]) -> [u8; 32] {
    // temporary 64-byte array for full 512-bit product
    let mut tmp: [u32; 64] = [0; 64];

    for i in 0..32 {
        for j in 0..32 {
            tmp[i + j] = tmp[i + j] + (a[i] as u32) * (b[j] as u32);
        }
    }

    // propagate carries mod 2^256: only indices 0..31 are output
    let mut res: [u8; 32] = [0; 32];
    let mut carry: u32 = 0;
    for k in 0..32 {
        let sum: u32 = tmp[k] + carry;
        res[k] = (sum & 0xFF) as u8; // lower byte
        carry = sum >> 8; // next carry
    }
    res
}

use std::cmp::{Eq, Ord, Ordering};
use std::ops::{Add, Mul, Sub};

pub struct U256Bytes {
    pub limbs: [u8; 32],
}

impl U256Bytes {
    pub fn new(limbs: [u8; 32]) -> Self {
        U256Bytes { limbs }
    }

    pub fn zero() -> Self {
        U256Bytes { limbs: [0; 32] }
    }
}

impl Add for U256Bytes {
    fn add(self, other: U256Bytes) -> U256Bytes {
        U256Bytes { limbs: add256(self.limbs, other.limbs) }
    }
}

impl Sub for U256Bytes {
    fn sub(self, other: U256Bytes) -> U256Bytes {
        U256Bytes { limbs: sub256(self.limbs, other.limbs) }
    }
}

impl Mul for U256Bytes {
    fn mul(self, other: U256Bytes) -> U256Bytes {
        U256Bytes { limbs: mul256(self.limbs, other.limbs) }
    }
}

impl Eq for U256Bytes {
    fn eq(self, other: U256Bytes) -> bool {
        let mut is_eq: bool = true; // start true :contentReference[oaicite:2]{index=2}
        for i in 0..32 {
            // loop over each 64-bit limb :contentReference[oaicite:3]{index=3}
            // constrained equality on u64, then AND into is_eq
            is_eq = is_eq & (self.limbs[i] == other.limbs[i]);
        }
        is_eq // single return here :contentReference[oaicite:5]{index=5}
    }
}

impl Ord for U256Bytes {
    fn cmp(self, other: U256Bytes) -> Ordering {
        let mut less_flag: bool = false; // true if we've seen a < case :contentReference[oaicite:8]{index=8}
        let mut greater_flag: bool = false; // true if we've seen a > case :contentReference[oaicite:9]{index=9}
        let mut prefix_equal: bool = true; // true if all more-significant limbs so far were equal :contentReference[oaicite:10]{index=10}

        // Walk from MS limb (3) down to LS limb (0)
        for i in 0..32 {
            let a = self.limbs[i];
            let b = other.limbs[i];
            let eq = a == b; // constrained eq :contentReference[oaicite:11]{index=11}
            let lt = a < b; // constrained lt :contentReference[oaicite:12]{index=12}
            let gt = a > b; // constrained gt :contentReference[oaicite:13]{index=13}

            // Only update if all higher limbs were equal
            less_flag = less_flag | (prefix_equal & lt);
            greater_flag = greater_flag | (prefix_equal & gt);
            prefix_equal = prefix_equal & eq;
        }

        // Single return, based on the flags
        if greater_flag {
            Ordering::greater()
        } // constrained branch :contentReference[oaicite:17]{index=17}
        else if less_flag {
            Ordering::less()
        } // constrained branch :contentReference[oaicite:18]{index=18}
        else {
            Ordering::equal()
        } // all limbs equal :contentReference[oaicite:19]{index=19}
    }
}
