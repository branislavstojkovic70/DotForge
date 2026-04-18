use std::collections::BTreeMap;
use crate::object_id::ObjectId;
use super::ObjectStore;

#[derive(Default, Debug, Clone)]
pub struct InMemoryObjectStore {
    data: BTreeMap<ObjectId, Vec<u8>>,
}

impl ObjectStore for InMemoryObjectStore {
    type Error = std::convert::Infallible;

    fn has(&self, id: ObjectId) -> Result<bool, Self::Error> {
        Ok(self.data.contains_key(&id))
    }

    fn read(&self, id: ObjectId) -> Result<Option<Vec<u8>>, Self::Error> {
        Ok(self.data.get(&id).cloned())
    }

    fn insert(&mut self, object: &[u8]) -> Result<ObjectId, Self::Error> {
        let id = ObjectId::from(object);
        self.data.entry(id).or_insert_with(|| object.to_vec());
        Ok(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn insert_and_read() {
        let mut store = InMemoryObjectStore::default();
        let id = store.insert(b"hello").unwrap();
        assert!(store.has(id).unwrap());
        assert_eq!(store.read(id).unwrap(), Some(b"hello".to_vec()));
    }

    #[test]
    fn has_false_when_absent() {
        let store = InMemoryObjectStore::default();
        let id = ObjectId::from(b"never inserted".as_ref());
        assert!(!store.has(id).unwrap());
    }

    #[test]
    fn missing_read_returns_none() {
        let store = InMemoryObjectStore::default();
        let id = ObjectId::from(b"missing".as_ref());
        assert_eq!(store.read(id).unwrap(), None);
    }

    #[test]
    fn deduplicate_inserts_single_copy() {
        let mut store = InMemoryObjectStore::default();
        let id1 = store.insert(b"same").unwrap();
        let id2 = store.insert(b"same").unwrap();
        assert_eq!(id1, id2);
        assert_eq!(store.read(id1).unwrap(), Some(b"same".to_vec()));
    }

    #[test]
    fn insert_with_id_succeeds_when_hash_matches() {
        let mut store = InMemoryObjectStore::default();
        let bytes = b"content";
        let id = ObjectId::from(bytes.as_slice());
        store.insert_with_id(id, bytes).unwrap();
        assert_eq!(store.read(id).unwrap(), Some(bytes.to_vec()));
    }

    #[test]
    #[should_panic(expected = "provided id does not match content hash")]
    fn insert_with_id_panics_when_hash_mismatches() {
        let mut store = InMemoryObjectStore::default();
        let id = ObjectId::from(b"other".as_ref());
        store.insert_with_id(id, b"wrong payload").unwrap();
    }
}