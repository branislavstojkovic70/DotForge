use std::{
    collections::BTreeSet,
    fs,
    path::{Path, PathBuf},
};
use serde::{Deserialize, Serialize};
use crate::{
    directory::{Directory, Ignores},
    merge::MergeResult,
    object_id::ObjectId,
    object_store::{directory::DirectoryObjectStore, ObjectStore},
    snapshot::SnapShot,
    remote::RemoteConfig,
};

pub const DOT_DIR: &str = ".dotforge";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalState {
    pub repo_id: String,
    pub contract_address: String,
    pub current_branch: String,
    pub default_branch: String,
    pub branches: std::collections::BTreeMap<String, ObjectId>,
    pub last_fetch: u64,
    pub remote: Option<RemoteConfig>,
}

impl LocalState {
    pub fn new(repo_id: String, contract_address: String) -> Self {
        Self {
            repo_id,
            contract_address,
            current_branch: "main".to_string(),
            default_branch: "main".to_string(),
            branches: Default::default(),
            last_fetch: 0,
            remote: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MergeState {
    pub current_branch: String,
    pub merge_branch: String,
    pub merge_result: MergeResult,
    pub backup_snapshot_id: ObjectId,
}

#[derive(Debug)]
pub enum Error {
    Io(std::io::Error),
    Serde(serde_json::Error),
    MissingObject(ObjectId),
    BranchNotFound(String),
    RepositoryNotInitialized,
    MergeInProgress,
    NoMergeInProgress,
    Other(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Io(e) => write!(f, "io error: {}", e),
            Error::Serde(e) => write!(f, "serde error: {}", e),
            Error::MissingObject(id) => write!(f, "missing object: {}", id),
            Error::BranchNotFound(b) => write!(f, "branch not found: {}", b),
            Error::RepositoryNotInitialized => write!(f, "not a dotforge repository"),
            Error::MergeInProgress => write!(f, "merge in progress"),
            Error::NoMergeInProgress => write!(f, "no merge in progress"),
            Error::Other(s) => write!(f, "{}", s),
        }
    }
}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self { Error::Io(e) }
}

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self { Error::Serde(e) }
}

pub struct DotRev {
    root: PathBuf,
}

impl DotRev {
    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn store_path(&self) -> PathBuf {
        self.root.join("store")
    }

    pub fn state_path(&self) -> PathBuf {
        self.root.join("state.json")
    }

    pub fn ignores_path(&self) -> PathBuf {
        self.root.join("ignores.json")
    }

    pub fn merge_state_path(&self) -> PathBuf {
        self.root.join("merge_state.json")
    }

    pub fn init(
        repo_root: &Path,
        repo_id: String,
        contract_address: String,
    ) -> Result<Self, Error> {
        let dot_path = repo_root.join(DOT_DIR);
        fs::create_dir_all(&dot_path)?;
        fs::create_dir_all(dot_path.join("store"))?;

        let state = LocalState::new(repo_id, contract_address);
        let state_json = serde_json::to_string_pretty(&state)?;
        fs::write(dot_path.join("state.json"), state_json)?;

        let ignores = Ignores::new(vec![]);
        let ignores_json = serde_json::to_string_pretty(&ignores)?;
        fs::write(dot_path.join("ignores.json"), ignores_json)?;

        Ok(Self { root: dot_path })
    }

    pub fn find(start: &Path) -> Result<Self, Error> {
        let mut current = start.to_path_buf();
        loop {
            let candidate = current.join(DOT_DIR);
            if candidate.exists() {
                return Ok(Self { root: candidate });
            }
            if !current.pop() {
                return Err(Error::RepositoryNotInitialized);
            }
        }
    }

    pub fn repo_root(&self) -> PathBuf {
        self.root.parent().unwrap().to_path_buf()
    }

    pub fn open_store(&self) -> Result<DirectoryObjectStore, Error> {
        DirectoryObjectStore::new(self.store_path()).map_err(Error::Io)
    }

    pub fn load_state(&self) -> Result<LocalState, Error> {
        let data = fs::read_to_string(self.state_path())?;
        Ok(serde_json::from_str(&data)?)
    }

    pub fn save_state(&self, state: &LocalState) -> Result<(), Error> {
        let json = serde_json::to_string_pretty(state)?;
        fs::write(self.state_path(), json)?;
        Ok(())
    }

    pub fn load_ignores(&self) -> Result<Ignores, Error> {
        let data = fs::read_to_string(self.ignores_path())?;
        Ok(serde_json::from_str(&data)?)
    }

    pub fn save_ignores(&self, ignores: &Ignores) -> Result<(), Error> {
        let json = serde_json::to_string_pretty(ignores)?;
        fs::write(self.ignores_path(), json)?;
        Ok(())
    }

    pub fn load_merge_state(&self) -> Result<MergeState, Error> {
        let path = self.merge_state_path();
        if !path.exists() {
            return Err(Error::NoMergeInProgress);
        }
        let data = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&data)?)
    }

    pub fn save_merge_state(&self, state: &MergeState) -> Result<(), Error> {
        let json = serde_json::to_string_pretty(state)?;
        fs::write(self.merge_state_path(), json)?;
        Ok(())
    }

    pub fn clear_merge_state(&self) -> Result<(), Error> {
        let path = self.merge_state_path();
        if path.exists() {
            fs::remove_file(path)?;
        }
        Ok(())
    }

    pub fn is_merge_in_progress(&self) -> bool {
        self.merge_state_path().exists()
    }

    pub fn get_snapshot(
        &self,
        store: &DirectoryObjectStore,
        id: ObjectId,
    ) -> Result<SnapShot, Error> {
        let data = store
            .read(id)
            .map_err(Error::Io)?
            .ok_or(Error::MissingObject(id))?;
        serde_json::from_slice(&data).map_err(Error::Serde)
    }

    pub fn get_directory(
        &self,
        store: &DirectoryObjectStore,
        id: ObjectId,
    ) -> Result<Directory, Error> {
        let data = store
            .read(id)
            .map_err(Error::Io)?
            .ok_or(Error::MissingObject(id))?;
        serde_json::from_slice(&data).map_err(Error::Serde)
    }

    pub fn insert_snapshot(
        &self,
        store: &mut DirectoryObjectStore,
        snap: &SnapShot,
    ) -> Result<ObjectId, Error> {
        let data = serde_json::to_vec(snap)?;
        store.insert(&data).map_err(Error::Io)
    }

    pub fn insert_directory(
        &self,
        store: &mut DirectoryObjectStore,
        dir: &Directory,
    ) -> Result<ObjectId, Error> {
        let data = serde_json::to_vec(dir)?;
        store.insert(&data).map_err(Error::Io)
    }

    pub fn head_snapshot_id(&self) -> Result<Option<ObjectId>, Error> {
        let state = self.load_state()?;
        Ok(state.branches.get(&state.current_branch).copied())
    }

    pub fn log(
        &self,
        store: &DirectoryObjectStore,
        snapshot_id: ObjectId,
        limit: usize,
    ) -> Result<Vec<(ObjectId, SnapShot)>, Error> {
        let mut result = vec![];
        let mut current = snapshot_id;
        let mut seen = std::collections::HashSet::new();

        loop {
            if seen.contains(&current) || result.len() >= limit {
                break;
            }
            seen.insert(current);

            let snap = self.get_snapshot(store, current)?;
            let parent = snap.previous.iter().next().copied();
            result.push((current, snap));

            match parent {
                Some(p) => current = p,
                None => break,
            }
        }

        Ok(result)
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use crate::object_store::ObjectStore;

    #[test]
    fn test_init_creates_structure() {
        let dir = tempdir().unwrap();
        let dot = DotRev::init(dir.path(), "test-repo".into(), "0x123".into()).unwrap();
        assert!(dot.store_path().exists());
        assert!(dot.state_path().exists());
        assert!(dot.ignores_path().exists());
    }

    #[test]
    fn test_find_repo() {
        let dir = tempdir().unwrap();
        DotRev::init(dir.path(), "test-repo".into(), "0x123".into()).unwrap();
        let found = DotRev::find(dir.path()).unwrap();
        assert_eq!(found.repo_root(), dir.path());
    }

    #[test]
    fn test_load_and_save_state() {
        let dir = tempdir().unwrap();
        let dot = DotRev::init(dir.path(), "my-repo".into(), "0xabc".into()).unwrap();
        let mut state = dot.load_state().unwrap();
        state.current_branch = "feature-x".to_string();
        dot.save_state(&state).unwrap();
        let loaded = dot.load_state().unwrap();
        assert_eq!(loaded.current_branch, "feature-x");
    }

    #[test]
    fn test_snapshot_roundtrip() {
        let dir = tempdir().unwrap();
        let dot = DotRev::init(dir.path(), "repo".into(), "0x0".into()).unwrap();
        let mut store = dot.open_store().unwrap();

        let directory = Directory::default();
        let dir_id = dot.insert_directory(&mut store, &directory).unwrap();

        let snap = SnapShot::new(dir_id, "init".to_string(), BTreeSet::new());
        let snap_id = dot.insert_snapshot(&mut store, &snap).unwrap();

        let loaded = dot.get_snapshot(&store, snap_id).unwrap();
        assert_eq!(loaded.message, "init");
    }

    #[test]
    fn test_merge_state() {
        let dir = tempdir().unwrap();
        let dot = DotRev::init(dir.path(), "repo".into(), "0x0".into()).unwrap();
        assert!(!dot.is_merge_in_progress());
    }

    #[test]
    fn test_log_single_commit() {
        let dir = tempdir().unwrap();
        let dot = DotRev::init(dir.path(), "repo".into(), "0x0".into()).unwrap();
        let mut store = dot.open_store().unwrap();

        let dir_id = dot.insert_directory(&mut store, &Directory::default()).unwrap();
        let snap = SnapShot::new(dir_id, "first".to_string(), BTreeSet::new());
        let snap_id = dot.insert_snapshot(&mut store, &snap).unwrap();

        let log = dot.log(&store, snap_id, 10).unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].1.message, "first");
    }
}