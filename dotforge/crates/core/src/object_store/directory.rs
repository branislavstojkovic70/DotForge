use std::{fs, path::PathBuf};
use crate::object_id::ObjectId;
use super::ObjectStore;

#[derive(Debug, Clone)]
pub struct DirectoryObjectStore {
    root: PathBuf,
}

impl DirectoryObjectStore {
    pub fn new(root: PathBuf) -> std::io::Result<Self> {
        fs::create_dir_all(&root)?;
        Ok(Self { root })
    }

    fn object_path(&self, id: ObjectId) -> PathBuf {
        let s = id.to_string();
        self.root.join(&s[..2]).join(&s[2..])
    }
}

impl ObjectStore for DirectoryObjectStore {
    type Error = std::io::Error;

    fn has(&self, id: ObjectId) -> Result<bool, Self::Error> {
        Ok(self.object_path(id).exists())
    }

    fn read(&self, id: ObjectId) -> Result<Option<Vec<u8>>, Self::Error> {
        let path = self.object_path(id);
        match fs::read(&path) {
            Ok(data) => Ok(Some(data)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(e),
        }
    }

    fn insert(&mut self, object: &[u8]) -> Result<ObjectId, Self::Error> {
        let id = ObjectId::from(object);
        let path = self.object_path(id);
        if !path.exists() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(&path, object)?;
        }
        Ok(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn new_creates_root_directory() {
        let dir = tempdir().unwrap();
        let root = dir.path().join("objects");
        assert!(!root.exists());
        let _store = DirectoryObjectStore::new(root.clone()).unwrap();
        assert!(root.is_dir());
    }

    #[test]
    fn insert_and_read() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let id = store.insert(b"hello world").unwrap();
        assert!(store.has(id).unwrap());
        assert_eq!(store.read(id).unwrap(), Some(b"hello world".to_vec()));
    }

    #[test]
    fn has_false_when_missing() {
        let dir = tempdir().unwrap();
        let store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let id = ObjectId::from(b"ghost".as_ref());
        assert!(!store.has(id).unwrap());
    }

    #[test]
    fn read_returns_none_when_missing() {
        let dir = tempdir().unwrap();
        let store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let id = ObjectId::from(b"ghost".as_ref());
        assert_eq!(store.read(id).unwrap(), None);
    }

    #[test]
    fn deduplication_same_id() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let id1 = store.insert(b"same content").unwrap();
        let id2 = store.insert(b"same content").unwrap();
        assert_eq!(id1, id2);
    }

    #[test]
    fn insert_is_idempotent_on_disk() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let bytes = b"idempotent";
        let id = store.insert(bytes).unwrap();
        store.insert(bytes).unwrap();
        assert_eq!(store.read(id).unwrap(), Some(bytes.to_vec()));
    }

    #[test]
    fn insert_with_id_succeeds_when_hash_matches() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let data = b"blob";
        let id = ObjectId::from(data.as_slice());
        store.insert_with_id(id, data).unwrap();
        assert_eq!(store.read(id).unwrap(), Some(data.to_vec()));
    }

    #[test]
    #[should_panic(expected = "provided id does not match content hash")]
    fn insert_with_id_panics_when_hash_mismatches() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let id = ObjectId::from(b"expected".as_ref());
        store.insert_with_id(id, b"actual").unwrap();
    }

    #[test]
    fn object_path_uses_hex_shard_prefix() {
        let dir = tempdir().unwrap();
        let mut store = DirectoryObjectStore::new(dir.path().to_path_buf()).unwrap();
        let mut s = store.insert(b"shard check").unwrap().to_string();
        let prefix: String = s.drain(..2).collect();
        assert!(dir.path().join(&prefix).is_dir());
    }
}