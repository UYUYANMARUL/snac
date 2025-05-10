fn nibble_to_char(n: u8) -> u8 {
    if n < 10 {
        n + 48
    } else {
        n + 87
    }
}

fn decode_hex<let N: u32>(hex: str<2 * N>) -> [u8; N] {
    // Convert the fixed-length str into its ASCII bytes
    let ascii: [u8; 2 * N] = hex.as_bytes();
    let mut out: [u8; N] = [0; N];

    // Loop i = 0..N-1
    for i in 0..N {
        // parse two hex chars at positions 2*i and 2*i+1
        let hi = ascii[2 * i];
        let lo = ascii[2 * i + 1];
        let hi_val = if hi <= 57 { hi - 48 } else { hi - 87 };
        let lo_val = if lo <= 57 { lo - 48 } else { lo - 87 };

        out[i] = (hi_val * 16) + lo_val;
    }

    out
}

fn bytes_to_hex(bytes: [u8; 32]) -> [u8; 66] {
    let mut out: [u8; 66] = [0; 66];

    // Prefix "0x"
    //out[0] = '0' as u8;
    //out[1] = 'x' as u8;

    // For each byte, map to two hex chars
    let mut i = 0;
    for i in 0..32 {
        let b = bytes[i];
        let hi = b >> 4; // high nibble (upper 4 bits)
        let lo = b & 0x0F; // low nibble  (lower 4 bits)

        out[2 + i * 2] = nibble_to_char(hi);
        out[2 + i * 2 + 1] = nibble_to_char(lo);
    }

    out
}

fn u64_to_bytes_le(value: u64) -> [u8; 8] {
    let mut bytes: [u8; 8] = [0; 8];
    let mut i = 0;
    for i in 0..8 {
        bytes[7 - i] = ((value >> (8 * i)) & 0xFF) as u8;
    }
    bytes
}
