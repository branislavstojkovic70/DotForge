use std::path::PathBuf;
use crate::{
    content_diff::{diff_objects, Change, Error as DiffError},
    directory::DirectoryEntry,
    object_id::ObjectId,
    object_store::ObjectStore,
    snapshot::SnapShot,
};

#[derive(Debug, Clone)]
pub struct FileDiff {
    pub path: PathBuf,
    pub kind: DiffKind,
    pub changes: Vec<Change>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DiffKind {
    Added,
    Removed,
    Modified,
}

impl FileDiff {
    pub fn added_count(&self) -> usize {
        self.changes.iter().filter(|c| matches!(c, Change::Added(_))).count()
    }

    pub fn removed_count(&self) -> usize {
        self.changes.iter().filter(|c| matches!(c, Change::Removed(_))).count()
    }

    pub fn summary(&self) -> String {
        match self.kind {
            DiffKind::Added => format!("+{} lines", self.changes.len()),
            DiffKind::Removed => format!("-{} lines", self.changes.len()),
            DiffKind::Modified => format!("+{} -{}", self.added_count(), self.removed_count()),
        }
    }
}

#[derive(Debug)]
pub enum SnapshotDiffError<S: ObjectStore> {
    MissingObject(ObjectId),
    ContentDiff(DiffError<S>),
    Store(S::Error),
}

pub fn diff_snapshots<S: ObjectStore>(
    store: &S,
    _old_snap: &SnapShot,
    _new_snap: &SnapShot,
    old_dir: &crate::directory::Directory,
    new_dir: &crate::directory::Directory,
) -> Result<Vec<FileDiff>, SnapshotDiffError<S>>
where
    S::Error: std::fmt::Debug,
{
    let dir_diff = old_dir.diff(new_dir);
    let mut file_diffs = vec![];

    for entry in dir_diff.entries() {
        match entry {
            DirectoryEntry::Added(path, new_id) => {
                let changes = diff_objects(store, None, Some(new_id))
                    .map_err(SnapshotDiffError::ContentDiff)?;
                file_diffs.push(FileDiff {
                    path,
                    kind: DiffKind::Added,
                    changes,
                });
            }
            DirectoryEntry::Removed(path, old_id) => {
                let changes = diff_objects(store, Some(old_id), None)
                    .map_err(SnapshotDiffError::ContentDiff)?;
                file_diffs.push(FileDiff {
                    path,
                    kind: DiffKind::Removed,
                    changes,
                });
            }
            DirectoryEntry::Modified(path, old_id, new_id) => {
                let changes = diff_objects(store, Some(old_id), Some(new_id))
                    .map_err(SnapshotDiffError::ContentDiff)?;
                if !changes.is_empty() {
                    file_diffs.push(FileDiff {
                        path,
                        kind: DiffKind::Modified,
                        changes,
                    });
                }
            }
        }
    }

    Ok(file_diffs)
}

pub fn diff_snapshot_ids<S: ObjectStore>(
    store: &S,
    old_id: ObjectId,
    new_id: ObjectId,
) -> Result<Vec<FileDiff>, SnapshotDiffError<S>>
where
    S::Error: std::fmt::Debug,
{
    let read_snap = |id: ObjectId| -> Result<SnapShot, SnapshotDiffError<S>> {
        let data = store
            .read(id)
            .map_err(SnapshotDiffError::Store)?
            .ok_or(SnapshotDiffError::MissingObject(id))?;
        serde_json::from_slice(&data)
            .map_err(|_| SnapshotDiffError::MissingObject(id))
    };

    let read_dir = |id: ObjectId| -> Result<crate::directory::Directory, SnapshotDiffError<S>> {
        let data = store
            .read(id)
            .map_err(SnapshotDiffError::Store)?
            .ok_or(SnapshotDiffError::MissingObject(id))?;
        serde_json::from_slice(&data)
            .map_err(|_| SnapshotDiffError::MissingObject(id))
    };

    let old_snap = read_snap(old_id)?;
    let new_snap = read_snap(new_id)?;
    let old_dir = read_dir(old_snap.directory)?;
    let new_dir = read_dir(new_snap.directory)?;

    diff_snapshots(store, &old_snap, &new_snap, &old_dir, &new_dir)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;
    use crate::{
        directory::Directory,
        object_store::{in_memory::InMemoryObjectStore, ObjectStore},
        snapshot::SnapShot,
    };

    fn make_snapshot(
        store: &mut InMemoryObjectStore,
        files: &[(&str, &str)],
        message: &str,
        parent: Option<ObjectId>,
    ) -> (ObjectId, Directory) {
        let mut dir = Directory::default();
        for (path, content) in files {
            let id = store.insert(content.as_bytes()).unwrap();
            dir.insert(PathBuf::from(path), id);
        }
        let dir_data = serde_json::to_vec(&dir).unwrap();
        let dir_id = store.insert(&dir_data).unwrap();

        let mut parents = BTreeSet::new();
        if let Some(p) = parent {
            parents.insert(p);
        }
        let snap = SnapShot::new(dir_id, message.to_string(), parents);
        let snap_data = serde_json::to_vec(&snap).unwrap();
        let snap_id = store.insert(&snap_data).unwrap();
        (snap_id, dir)
    }

    #[test]
    fn test_diff_added_file() {
        let mut store = InMemoryObjectStore::default();
        let (s1, d1) = make_snapshot(&mut store, &[("a.txt", "hello")], "init", None);
        let (s2, d2) = make_snapshot(
            &mut store,
            &[("a.txt", "hello"), ("b.txt", "world")],
            "add b",
            Some(s1),
        );

        let snap1: SnapShot = serde_json::from_slice(&store.read(s1).unwrap().unwrap()).unwrap();
        let snap2: SnapShot = serde_json::from_slice(&store.read(s2).unwrap().unwrap()).unwrap();

        let diffs = diff_snapshots(&store, &snap1, &snap2, &d1, &d2).unwrap();
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].kind, DiffKind::Added);
        assert_eq!(diffs[0].path, PathBuf::from("b.txt"));
    }

    #[test]
    fn test_diff_modified_file() {
        let mut store = InMemoryObjectStore::default();
        let (s1, d1) = make_snapshot(&mut store, &[("a.txt", "hello")], "init", None);
        let (s2, d2) = make_snapshot(&mut store, &[("a.txt", "hello world")], "modify", Some(s1));

        let snap1: SnapShot = serde_json::from_slice(&store.read(s1).unwrap().unwrap()).unwrap();
        let snap2: SnapShot = serde_json::from_slice(&store.read(s2).unwrap().unwrap()).unwrap();

        let diffs = diff_snapshots(&store, &snap1, &snap2, &d1, &d2).unwrap();
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].kind, DiffKind::Modified);
    }

    #[test]
    fn test_diff_removed_file() {
        let mut store = InMemoryObjectStore::default();
        let (s1, d1) = make_snapshot(
            &mut store,
            &[("a.txt", "hello"), ("b.txt", "bye")],
            "init",
            None,
        );
        let (s2, d2) = make_snapshot(&mut store, &[("a.txt", "hello")], "remove b", Some(s1));

        let snap1: SnapShot = serde_json::from_slice(&store.read(s1).unwrap().unwrap()).unwrap();
        let snap2: SnapShot = serde_json::from_slice(&store.read(s2).unwrap().unwrap()).unwrap();

        let diffs = diff_snapshots(&store, &snap1, &snap2, &d1, &d2).unwrap();
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].kind, DiffKind::Removed);
    }

    #[test]
    fn test_diff_no_changes() {
        let mut store = InMemoryObjectStore::default();
        let (s1, d1) = make_snapshot(&mut store, &[("a.txt", "hello")], "init", None);
        let (s2, d2) = make_snapshot(&mut store, &[("a.txt", "hello")], "same", Some(s1));

        let snap1: SnapShot = serde_json::from_slice(&store.read(s1).unwrap().unwrap()).unwrap();
        let snap2: SnapShot = serde_json::from_slice(&store.read(s2).unwrap().unwrap()).unwrap();

        let diffs = diff_snapshots(&store, &snap1, &snap2, &d1, &d2).unwrap();
        assert!(diffs.is_empty());
    }
}