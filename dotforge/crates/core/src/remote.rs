use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};
use crate::object_id::ObjectId;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteConfig {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RemoteRequest {
    ListBranches,
    GetBranch { branch: String },
    HasObject { id: ObjectId },
    GetObject { id: ObjectId },
    GetObjects { ids: Vec<ObjectId> },
    PushBranch {
        branch: String,
        snapshot_id: ObjectId,
        force: bool,
    },
    UploadObjects {
        objects: Vec<(ObjectId, Vec<u8>)>,
    },
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RemoteResponse {
    Branches { branches: BTreeMap<String, ObjectId> },
    Branch { branch: String, snapshot_id: Option<ObjectId> },
    ObjectExists { id: ObjectId, exists: bool },
    Object { id: ObjectId, data: Option<Vec<u8>> },
    Objects { objects: Vec<(ObjectId, Option<Vec<u8>>)> },
    PushResult { success: bool, message: String },
    UploadResult { success: bool },
    Error { message: String },
}

pub trait RemoteRepository {
    type Error: std::fmt::Debug + std::fmt::Display;

    fn list_branches(&self) -> Result<BTreeMap<String, ObjectId>, Self::Error>;
    fn get_branch(&self, branch: &str) -> Result<Option<ObjectId>, Self::Error>;
    fn has_object(&self, id: ObjectId) -> Result<bool, Self::Error>;
    fn get_object(&self, id: ObjectId) -> Result<Option<Vec<u8>>, Self::Error>;
    fn get_objects(&self, ids: &[ObjectId]) -> Result<Vec<(ObjectId, Option<Vec<u8>>)>, Self::Error>;
    fn push_branch(&self, branch: &str, snapshot_id: ObjectId, force: bool) -> Result<(), Self::Error>;
    fn upload_objects(&self, objects: &[(ObjectId, Vec<u8>)]) -> Result<(), Self::Error>;
}

pub mod sync {
    use super::*;
    use crate::object_store::ObjectStore;
    use crate::snapshot::SnapShot;
    use crate::directory::Directory;
    use std::collections::{HashSet, VecDeque};

    #[derive(Debug)]
    pub enum SyncError {
        Remote(String),
        Local(String),
        ObjectMissing(ObjectId),
    }

    impl std::fmt::Display for SyncError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                SyncError::Remote(m) => write!(f, "remote error: {}", m),
                SyncError::Local(m) => write!(f, "local error: {}", m),
                SyncError::ObjectMissing(id) => write!(f, "missing object: {}", id),
            }
        }
    }

    pub fn pull_branch<R, S>(
        remote: &R,
        store: &mut S,
        branch: &str,
    ) -> Result<Option<ObjectId>, SyncError>
    where
        R: RemoteRepository,
        S: ObjectStore,
        S::Error: std::fmt::Debug,
    {
        let snapshot_id = remote
            .get_branch(branch)
            .map_err(|e| SyncError::Remote(e.to_string()))?;

        let snapshot_id = match snapshot_id {
            Some(id) => id,
            None => return Ok(None),
        };

        let needed = collect_needed_objects(remote, store, snapshot_id)?;
        download_objects(remote, store, &needed)?;

        Ok(Some(snapshot_id))
    }

    pub fn push_branch<R, S>(
        remote: &R,
        store: &mut S,
        branch: &str,
        snapshot_id: ObjectId,
        force: bool,
    ) -> Result<(), SyncError>
    where
        R: RemoteRepository,
        S: ObjectStore,
        S::Error: std::fmt::Debug,
    {
        let all_objects = collect_local_objects(store, snapshot_id)?;

        let mut to_upload = vec![];
        for id in &all_objects {
            let exists = remote
                .has_object(*id)
                .map_err(|e| SyncError::Remote(e.to_string()))?;
            if !exists {
                let data = store
                    .read(*id)
                    .map_err(|e| SyncError::Local(format!("{:?}", e)))?
                    .ok_or(SyncError::ObjectMissing(*id))?;
                to_upload.push((*id, data));
            }
        }

        const BATCH: usize = 50;
        for chunk in to_upload.chunks(BATCH) {
            remote
                .upload_objects(chunk)
                .map_err(|e| SyncError::Remote(e.to_string()))?;
        }

        remote
            .push_branch(branch, snapshot_id, force)
            .map_err(|e| SyncError::Remote(e.to_string()))?;

        Ok(())
    }

    fn collect_needed_objects<R, S>(
        remote: &R,
        store: &S,
        snapshot_id: ObjectId,
    ) -> Result<Vec<ObjectId>, SyncError>
    where
        R: RemoteRepository,
        S: ObjectStore,
        S::Error: std::fmt::Debug,
    {
        let mut needed = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(snapshot_id);
        needed.insert(snapshot_id);

        while let Some(id) = queue.pop_front() {
            if store
                .has(id)
                .map_err(|e| SyncError::Local(format!("{:?}", e)))?
            {
                continue;
            }

            let data = remote
                .get_object(id)
                .map_err(|e| SyncError::Remote(e.to_string()))?
                .ok_or(SyncError::ObjectMissing(id))?;

            if let Ok(snap) = serde_json::from_slice::<SnapShot>(&data) {
                if needed.insert(snap.directory) {
                    queue.push_back(snap.directory);
                }
                for parent in snap.previous {
                    if needed.insert(parent) {
                        queue.push_back(parent);
                    }
                }
            }

            if let Ok(dir) = serde_json::from_slice::<Directory>(&data) {
                for (_, file_id) in dir.files() {
                    needed.insert(file_id);
                }
            }
        }

        Ok(needed.into_iter().collect())
    }

    fn collect_local_objects<S>(
        store: &mut S,
        snapshot_id: ObjectId,
    ) -> Result<Vec<ObjectId>, SyncError>
    where
        S: ObjectStore,
        S::Error: std::fmt::Debug,
    {
        let mut needed = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(snapshot_id);
        needed.insert(snapshot_id);

        while let Some(id) = queue.pop_front() {
            let data = match store
                .read(id)
                .map_err(|e| SyncError::Local(format!("{:?}", e)))?
            {
                Some(d) => d,
                None => return Err(SyncError::ObjectMissing(id)),
            };

            if let Ok(snap) = serde_json::from_slice::<SnapShot>(&data) {
                if needed.insert(snap.directory) {
                    queue.push_back(snap.directory);
                }
                for parent in snap.previous {
                    if needed.insert(parent) {
                        queue.push_back(parent);
                    }
                }
            }

            if let Ok(dir) = serde_json::from_slice::<Directory>(&data) {
                for (_, file_id) in dir.files() {
                    needed.insert(file_id);
                }
            }
        }

        Ok(needed.into_iter().collect())
    }
    fn download_objects<R, S>(
        remote: &R,
        store: &mut S,
        object_ids: &[ObjectId],
    ) -> Result<(), SyncError>
    where
        R: RemoteRepository,
        S: ObjectStore,
        S::Error: std::fmt::Debug,
    {
        const BATCH: usize = 50;
        for chunk in object_ids.chunks(BATCH) {
            let objects = remote
                .get_objects(chunk)
                .map_err(|e| SyncError::Remote(e.to_string()))?;
            for (id, data) in objects {
                if let Some(data) = data {
                    store
                        .insert_with_id(id, &data)
                        .map_err(|e| SyncError::Local(format!("{:?}", e)))?;
                }
            }
        }
        Ok(())
    }
}

pub mod in_memory_remote {
    use super::*;
    use std::sync::{Arc, Mutex};
    use std::collections::BTreeMap;

    #[derive(Default, Clone)]
    pub struct InMemoryRemote {
        branches: Arc<Mutex<BTreeMap<String, ObjectId>>>,
        objects: Arc<Mutex<BTreeMap<ObjectId, Vec<u8>>>>,
    }

    #[derive(Debug)]
    pub struct InMemoryError(String);

    impl std::fmt::Display for InMemoryError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.0)
        }
    }

    impl RemoteRepository for InMemoryRemote {
        type Error = InMemoryError;

        fn list_branches(&self) -> Result<BTreeMap<String, ObjectId>, Self::Error> {
            Ok(self.branches.lock().unwrap().clone())
        }

        fn get_branch(&self, branch: &str) -> Result<Option<ObjectId>, Self::Error> {
            Ok(self.branches.lock().unwrap().get(branch).copied())
        }

        fn has_object(&self, id: ObjectId) -> Result<bool, Self::Error> {
            Ok(self.objects.lock().unwrap().contains_key(&id))
        }

        fn get_object(&self, id: ObjectId) -> Result<Option<Vec<u8>>, Self::Error> {
            Ok(self.objects.lock().unwrap().get(&id).cloned())
        }

        fn get_objects(&self, ids: &[ObjectId]) -> Result<Vec<(ObjectId, Option<Vec<u8>>)>, Self::Error> {
            let objects = self.objects.lock().unwrap();
            Ok(ids.iter().map(|id| (*id, objects.get(id).cloned())).collect())
        }

        fn push_branch(&self, branch: &str, snapshot_id: ObjectId, _force: bool) -> Result<(), Self::Error> {
            self.branches.lock().unwrap().insert(branch.to_string(), snapshot_id);
            Ok(())
        }

        fn upload_objects(&self, objects: &[(ObjectId, Vec<u8>)]) -> Result<(), Self::Error> {
            let mut store = self.objects.lock().unwrap();
            for (id, data) in objects {
                store.insert(*id, data.clone());
            }
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::object_store::ObjectStore;
    use super::*;
    use super::in_memory_remote::InMemoryRemote;
    use crate::object_store::in_memory::InMemoryObjectStore;
    use crate::snapshot::SnapShot;
    use std::collections::BTreeSet;

    #[test]
    fn test_push_and_pull_branch() {
        let mut local_store = InMemoryObjectStore::default();
        let remote = InMemoryRemote::default();

        let dir_id = local_store.insert(
            serde_json::to_vec(&crate::directory::Directory::default()).unwrap().as_slice()
        ).unwrap();

        let snap = SnapShot::new(dir_id, "init".to_string(), BTreeSet::new());
        let snap_id = local_store.insert(
            serde_json::to_vec(&snap).unwrap().as_slice()
        ).unwrap();

        sync::push_branch(&remote, &mut local_store, "main", snap_id, false).unwrap();

        assert_eq!(remote.get_branch("main").unwrap(), Some(snap_id));

        let mut fresh_store = InMemoryObjectStore::default();
        let pulled = sync::pull_branch(&remote, &mut fresh_store, "main").unwrap();
        assert_eq!(pulled, Some(snap_id));
        assert!(fresh_store.has(snap_id).unwrap());
    }

    #[test]
    fn test_pull_nonexistent_branch() {
        let remote = InMemoryRemote::default();
        let mut store = InMemoryObjectStore::default();
        let result = sync::pull_branch(&remote, &mut store, "nonexistent").unwrap();
        assert_eq!(result, None);
    }
}