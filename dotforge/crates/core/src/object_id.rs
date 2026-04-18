use std::fmt;
use crate::hex;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ObjectId([u8; 32]);

impl ObjectId {
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl From<&[u8]> for ObjectId {
    fn from(data: &[u8]) -> Self {
        let hash = blake3::hash(data);
        ObjectId(*hash.as_bytes())
    }
}

impl fmt::Display for ObjectId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", hex::encode(&self.0))
    }
}

impl serde::Serialize for ObjectId {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

impl<'de> serde::Deserialize<'de> for ObjectId {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = String::deserialize(d)?;
        let bytes = hex::decode(&s).map_err(serde::de::Error::custom)?;
        if bytes.len() != 32 {
            return Err(serde::de::Error::custom("invalid object id length"));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(ObjectId(arr))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_matches_blake3_bytes() {
        let data = b"payload";
        let id = ObjectId::from(data.as_slice());
        assert_eq!(id.as_bytes(), blake3::hash(data).as_bytes());
    }

    #[test]
    fn as_bytes_is_stable_across_clones() {
        let id = ObjectId::from(b"x".as_ref());
        let copy = id;
        assert_eq!(id.as_bytes(), copy.as_bytes());
    }

    #[test]
    fn same_content_same_id() {
        let a = ObjectId::from(b"hello".as_ref());
        let b = ObjectId::from(b"hello".as_ref());
        assert_eq!(a, b);
    }

    #[test]
    fn different_content_different_id() {
        let a = ObjectId::from(b"hello".as_ref());
        let b = ObjectId::from(b"world".as_ref());
        assert_ne!(a, b);
    }

    #[test]
    fn display_is_lowercase_hex_64_chars() {
        let id = ObjectId::from(b"test".as_ref());
        let s = id.to_string();
        assert_eq!(s.len(), 64);
        assert!(s.chars().all(|c| c.is_ascii_hexdigit()));
        assert_eq!(s, s.to_ascii_lowercase());
    }

    #[test]
    fn serde_json_roundtrip() {
        let id = ObjectId::from(b"serde".as_ref());
        let json = serde_json::to_string(&id).unwrap();
        let back: ObjectId = serde_json::from_str(&json).unwrap();
        assert_eq!(back, id);
    }

    #[test]
    fn deserialize_invalid_hex_fails() {
        let err = serde_json::from_str::<ObjectId>("\"not-hex\"").unwrap_err();
        assert!(err.to_string().contains("invalid digit") || err.to_string().contains("character"));
    }

    #[test]
    fn deserialize_wrong_length_fails() {
        let short = "\"00\""; // 1 byte when decoded
        let err = serde_json::from_str::<ObjectId>(short).unwrap_err();
        assert!(err.to_string().contains("invalid object id length"));
    }

    #[test]
    fn ordering_is_lexicographic_on_bytes() {
        let a = ObjectId::from(b"a".as_ref());
        let b = ObjectId::from(b"b".as_ref());
        assert!(a < b || a > b);
        assert_ne!(a.cmp(&b), std::cmp::Ordering::Equal);
    }
}