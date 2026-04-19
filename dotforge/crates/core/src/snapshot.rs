use std::collections::BTreeSet;
use serde::{Deserialize, Serialize};
use crate::object_id::ObjectId;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SnapShot {
    pub directory: ObjectId,
    pub message: String,
    pub previous: BTreeSet<ObjectId>,
}

impl SnapShot {
    pub fn new(directory: ObjectId, message: String, previous: BTreeSet<ObjectId>) -> Self {
        Self { directory, message, previous }
    }

    pub fn is_root(&self) -> bool {
        self.previous.is_empty()
    }

    pub fn parents(&self) -> impl Iterator<Item = ObjectId> + '_ {
        self.previous.iter().copied()
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_root_snapshot() {
        let dir_id = ObjectId::from(b"dir".as_ref());
        let snap = SnapShot::new(dir_id, "init".to_string(), BTreeSet::new());
        assert!(snap.is_root());
        assert_eq!(snap.parents().count(), 0);
    }

    #[test]
    fn test_snapshot_with_parent() {
        let dir_id = ObjectId::from(b"dir".as_ref());
        let parent_id = ObjectId::from(b"parent".as_ref());
        let mut parents = BTreeSet::new();
        parents.insert(parent_id);
        let snap = SnapShot::new(dir_id, "second commit".to_string(), parents);
        assert!(!snap.is_root());
        assert_eq!(snap.parents().count(), 1);
    }

    #[test]
    fn test_merge_snapshot_two_parents() {
        let dir_id = ObjectId::from(b"dir".as_ref());
        let p1 = ObjectId::from(b"parent1".as_ref());
        let p2 = ObjectId::from(b"parent2".as_ref());
        let mut parents = BTreeSet::new();
        parents.insert(p1);
        parents.insert(p2);
        let snap = SnapShot::new(dir_id, "merge".to_string(), parents);
        assert_eq!(snap.parents().count(), 2);
    }

    #[test]
    fn test_serialization() {
        let dir_id = ObjectId::from(b"dir".as_ref());
        let snap = SnapShot::new(dir_id, "test".to_string(), BTreeSet::new());
        let json = serde_json::to_string(&snap).unwrap();
        let back: SnapShot = serde_json::from_str(&json).unwrap();
        assert_eq!(snap, back);
    }
}