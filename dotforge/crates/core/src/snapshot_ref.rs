use std::str::FromStr;
use crate::object_id::ObjectId;

#[derive(Debug, Clone, PartialEq)]
pub enum SnapshotRef {
    Head,
    HeadParent(usize),
    Branch(String),
    Id(ObjectId),
}

impl FromStr for SnapshotRef {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "HEAD" {
            return Ok(SnapshotRef::Head);
        }

        if s.starts_with("HEAD~") {
            let n = s[5..].parse::<usize>()
                .map_err(|_| anyhow::anyhow!("invalid HEAD~N reference: {}", s))?;
            return Ok(SnapshotRef::HeadParent(n));
        }

        if s.len() == 64 && s.chars().all(|c| c.is_ascii_hexdigit()) {
            let bytes = crate::hex::decode(s)?;
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes);
            return Ok(SnapshotRef::Id(ObjectId::from(bytes.as_slice())));
        }

        Ok(SnapshotRef::Branch(s.to_string()))
    }
}

impl std::fmt::Display for SnapshotRef {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SnapshotRef::Head => write!(f, "HEAD"),
            SnapshotRef::HeadParent(n) => write!(f, "HEAD~{}", n),
            SnapshotRef::Branch(name) => write!(f, "{}", name),
            SnapshotRef::Id(id) => write!(f, "{}", id),
        }
    }
}
