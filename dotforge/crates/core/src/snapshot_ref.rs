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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_head() {
        let r: SnapshotRef = "HEAD".parse().unwrap();
        assert_eq!(r, SnapshotRef::Head);
    }

    #[test]
    fn test_head_parent() {
        let r: SnapshotRef = "HEAD~3".parse().unwrap();
        assert_eq!(r, SnapshotRef::HeadParent(3));
    }

    #[test]
    fn test_branch() {
        let r: SnapshotRef = "main".parse().unwrap();
        assert_eq!(r, SnapshotRef::Branch("main".to_string()));
    }

    #[test]
    fn test_branch_feature() {
        let r: SnapshotRef = "feature-x".parse().unwrap();
        assert_eq!(r, SnapshotRef::Branch("feature-x".to_string()));
    }

    #[test]
    fn test_display_head() {
        assert_eq!(SnapshotRef::Head.to_string(), "HEAD");
    }

    #[test]
    fn test_display_parent() {
        assert_eq!(SnapshotRef::HeadParent(2).to_string(), "HEAD~2");
    }
}