pub fn encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

pub fn decode(s: &str) -> anyhow::Result<Vec<u8>> {
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(|e| anyhow::anyhow!(e)))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encode_empty() {
        assert_eq!(encode(&[]), "");
    }

    #[test]
    fn decode_empty() {
        assert_eq!(decode("").unwrap(), Vec::<u8>::new());
    }

    #[test]
    fn encode_single_byte() {
        assert_eq!(encode(&[0]), "00");
        assert_eq!(encode(&[255]), "ff");
    }

    #[test]
    fn decode_single_byte() {
        assert_eq!(decode("00").unwrap(), vec![0]);
        assert_eq!(decode("ff").unwrap(), vec![255]);
    }

    #[test]
    fn roundtrip_various_lengths() {
        for bytes in [b"".as_slice(), b"a", b"hello world", &[0u8; 32]] {
            assert_eq!(decode(&encode(bytes)).unwrap(), bytes);
        }
    }

    #[test]
    fn decode_invalid_hex_digit_errors() {
        assert!(decode("0g").is_err());
        assert!(decode("zz").is_err());
    }

    #[test]
    fn roundtrip() {
        let bytes = b"hello world";
        assert_eq!(decode(&encode(bytes)).unwrap(), bytes);
    }
}