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