use std::{
    collections::BTreeMap,
    path::{Path, PathBuf},
};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use crate::object_id::ObjectId;
use crate::object_store::ObjectStore;

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct Directory {
    files: BTreeMap<PathBuf, ObjectId>,
}

impl Directory {
    pub fn files(&self) -> impl Iterator<Item = (&PathBuf, ObjectId)> {
        self.files.iter().map(|(p, id)| (p, *id))
    }

    pub fn get(&self, path: &Path) -> Option<ObjectId> {
        self.files.get(path).copied()
    }

    pub fn insert(&mut self, path: PathBuf, id: ObjectId) {
        self.files.insert(path, id);
    }

    pub fn remove(&mut self, path: &Path) {
        self.files.remove(path);
    }

    pub fn len(&self) -> usize {
        self.files.len()
    }

    pub fn is_empty(&self) -> bool {
        self.files.is_empty()
    }

    pub fn diff<'a>(&'a self, other: &'a Directory) -> Diff<'a> {
        Diff {
            old: self,
            new: other,
        }
    }

    pub fn from_path<S: ObjectStore>(
        path: &Path,
        store: &mut S,
        ignores: &Ignores,
    ) -> Result<Self, S::Error> {
        let mut dir = Directory::default();

        for entry in WalkDir::new(path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let rel = entry
                .path()
                .strip_prefix(path)
                .unwrap()
                .to_path_buf();

            if ignores.is_ignored(&rel) {
                continue;
            }

            let content = std::fs::read(entry.path())
                .map_err(|_| {
                    panic!("failed to read file: {:?}", entry.path())
                });
            let content = content.unwrap();
            let id = store.insert(&content)?;
            dir.insert(rel, id);
        }

        Ok(dir)
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Ignores {
    patterns: Vec<String>,
}

impl Ignores {
    pub fn new(patterns: Vec<String>) -> Self {
        let mut p = vec![
            ".dotforge".to_string(),
            ".git".to_string(),
        ];
        p.extend(patterns);
        Self { patterns: p }
    }

    pub fn add(&mut self, pattern: String) {
        self.patterns.push(pattern);
    }

    pub fn remove(&mut self, pattern: &str) {
        self.patterns.retain(|p| p != pattern);
    }

    pub fn is_ignored(&self, path: &Path) -> bool {
        let s = path.to_string_lossy();
        for pat in &self.patterns {
            if pat.ends_with('/') {
                let trimmed = pat.trim_end_matches('/');
                if s.starts_with(trimmed)
                    || s.contains(&format!("/{}", trimmed))
                {
                    return true;
                }
            } else if pat.starts_with("*.") {
                let ext = &pat[1..];
                if s.ends_with(ext) {
                    return true;
                }
            } else if pat.starts_with('/') {
                if s.starts_with(pat.trim_start_matches('/')) {
                    return true;
                }
            } else {
                if s == pat.as_str()
                    || s.starts_with(&format!("{}/", pat))
                    || s.contains(&format!("/{}/", pat))
                {
                    return true;
                }
            }
        }
        false
    }

    pub fn patterns(&self) -> &[String] {
        &self.patterns
    }
}

pub struct Diff<'a> {
    old: &'a Directory,
    new: &'a Directory,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DirectoryEntry {
    Added(PathBuf, ObjectId),
    Removed(PathBuf, ObjectId),
    Modified(PathBuf, ObjectId, ObjectId),
}

impl<'a> Diff<'a> {
    pub fn entries(&self) -> Vec<DirectoryEntry> {
        let mut result = vec![];

        for (path, new_id) in self.new.files() {
            match self.old.get(path) {
                None => result.push(DirectoryEntry::Added(path.clone(), new_id)),
                Some(old_id) if old_id != new_id => {
                    result.push(DirectoryEntry::Modified(
                        path.clone(),
                        old_id,
                        new_id,
                    ))
                }
                _ => {}
            }
        }

        for (path, old_id) in self.old.files() {
            if self.new.get(path).is_none() {
                result.push(DirectoryEntry::Removed(path.clone(), old_id));
            }
        }

        result.sort_by(|a, b| {
            let path_a = match a {
                DirectoryEntry::Added(p, _) => p,
                DirectoryEntry::Removed(p, _) => p,
                DirectoryEntry::Modified(p, _, _) => p,
            };
            let path_b = match b {
                DirectoryEntry::Added(p, _) => p,
                DirectoryEntry::Removed(p, _) => p,
                DirectoryEntry::Modified(p, _, _) => p,
            };
            path_a.cmp(path_b)
        });

        result
    }

    pub fn is_empty(&self) -> bool {
        self.entries().is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::object_store::in_memory::InMemoryObjectStore;
    use tempfile::tempdir;

    #[test]
    fn directory_default_is_empty() {
        let d = Directory::default();
        assert!(d.is_empty());
        assert_eq!(d.len(), 0);
    }

    #[test]
    fn directory_get_insert_remove_len() {
        let mut d = Directory::default();
        let id = ObjectId::from(b"x".as_ref());
        assert_eq!(d.get(Path::new("a.txt")), None);

        d.insert(PathBuf::from("a.txt"), id);
        assert_eq!(d.len(), 1);
        assert!(!d.is_empty());
        assert_eq!(d.get(Path::new("a.txt")), Some(id));

        d.insert(PathBuf::from("a.txt"), id);
        assert_eq!(d.len(), 1);

        let id2 = ObjectId::from(b"y".as_ref());
        d.insert(PathBuf::from("a.txt"), id2);
        assert_eq!(d.get(Path::new("a.txt")), Some(id2));

        d.remove(Path::new("a.txt"));
        assert_eq!(d.get(Path::new("a.txt")), None);
        assert!(d.is_empty());
    }

    #[test]
    fn directory_files_iterates_paths_and_ids() {
        let mut d = Directory::default();
        let id_a = ObjectId::from(b"a".as_ref());
        let id_b = ObjectId::from(b"b".as_ref());
        d.insert(PathBuf::from("a.txt"), id_a);
        d.insert(PathBuf::from("b.txt"), id_b);

        let mut pairs: Vec<_> = d.files().map(|(p, i)| (p.clone(), i)).collect();
        pairs.sort_by(|x, y| x.0.cmp(&y.0));
        assert_eq!(pairs.len(), 2);
        assert_eq!(pairs[0].0, PathBuf::from("a.txt"));
        assert_eq!(pairs[1].0, PathBuf::from("b.txt"));
    }

    #[test]
    fn directory_serde_roundtrip() {
        let mut d = Directory::default();
        d.insert(PathBuf::from("x.rs"), ObjectId::from(b"z".as_ref()));
        let json = serde_json::to_string(&d).unwrap();
        let back: Directory = serde_json::from_str(&json).unwrap();
        assert_eq!(back, d);
    }

    #[test]
    fn ignores_dotforge() {
        let ignores = Ignores::new(vec![]);
        assert!(ignores.is_ignored(Path::new(".dotforge/config.json")));
        assert!(ignores.is_ignored(Path::new(".git/HEAD")));
        assert!(!ignores.is_ignored(Path::new("src/main.rs")));
    }

    #[test]
    fn ignores_pattern() {
        let ignores = Ignores::new(vec!["*.pyc".to_string(), "venv/".to_string()]);
        assert!(ignores.is_ignored(Path::new("main.pyc")));
        assert!(ignores.is_ignored(Path::new("venv/lib/python.py")));
        assert!(!ignores.is_ignored(Path::new("main.py")));
    }

    #[test]
    fn ignores_new_includes_defaults_then_custom() {
        let ignores = Ignores::new(vec!["build".to_string()]);
        let pats = ignores.patterns();
        assert!(pats.iter().any(|p| p == ".dotforge"));
        assert!(pats.iter().any(|p| p == ".git"));
        assert!(pats.iter().any(|p| p == "build"));
    }

    #[test]
    fn ignores_add_and_remove() {
        let mut ignores = Ignores::new(vec![]);
        assert!(!ignores.is_ignored(Path::new("tmp.log")));
        ignores.add("*.log".to_string());
        assert!(ignores.is_ignored(Path::new("tmp.log")));
        ignores.remove("*.log");
        assert!(!ignores.is_ignored(Path::new("tmp.log")));
    }

    #[test]
    fn ignores_leading_slash_matches_from_root() {
        let ignores = Ignores::new(vec!["/root-only".to_string()]);
        assert!(ignores.is_ignored(Path::new("root-only")));
        assert!(!ignores.is_ignored(Path::new("nested/root-only")));
    }

    #[test]
    fn ignores_directory_suffix_matches_nested() {
        let ignores = Ignores::new(vec!["dist/".to_string()]);
        assert!(ignores.is_ignored(Path::new("dist/index.js")));
        assert!(ignores.is_ignored(Path::new("pkg/dist/out")));
    }

    #[test]
    fn from_path_loads_files_and_hashes() {
        let root = tempdir().unwrap();
        std::fs::write(root.path().join("a.txt"), b"alpha").unwrap();
        std::fs::create_dir_all(root.path().join("sub")).unwrap();
        std::fs::write(root.path().join("sub/b.txt"), b"beta").unwrap();

        let mut store = InMemoryObjectStore::default();
        let ignores = Ignores::new(vec![]);
        let dir = Directory::from_path(root.path(), &mut store, &ignores).unwrap();

        assert_eq!(dir.len(), 2);
        let id_a = ObjectId::from(b"alpha".as_ref());
        let id_b = ObjectId::from(b"beta".as_ref());
        assert_eq!(dir.get(Path::new("a.txt")), Some(id_a));
        assert_eq!(dir.get(Path::new("sub/b.txt")), Some(id_b));
    }

    #[test]
    fn from_path_skips_ignored_files() {
        let root = tempdir().unwrap();
        std::fs::create_dir_all(root.path().join(".dotforge")).unwrap();
        std::fs::write(root.path().join("keep.txt"), b"ok").unwrap();
        std::fs::write(root.path().join(".dotforge/secret"), b"no").unwrap();

        let mut store = InMemoryObjectStore::default();
        let dir = Directory::from_path(root.path(), &mut store, &Ignores::new(vec![])).unwrap();

        assert_eq!(dir.len(), 1);
        assert_eq!(dir.get(Path::new("keep.txt")), Some(ObjectId::from(b"ok".as_ref())));
        assert_eq!(dir.get(Path::new(".dotforge/secret")), None);
    }

    #[test]
    fn from_path_empty_directory() {
        let root = tempdir().unwrap();
        let mut store = InMemoryObjectStore::default();
        let dir = Directory::from_path(root.path(), &mut store, &Ignores::new(vec![])).unwrap();
        assert!(dir.is_empty());
    }

    #[test]
    fn diff_added() {
        let old = Directory::default();
        let mut new = Directory::default();
        let id = ObjectId::from(b"content".as_ref());
        new.insert(PathBuf::from("file.txt"), id);

        let diff = old.diff(&new);
        let entries = diff.entries();
        assert_eq!(entries.len(), 1);
        assert!(matches!(&entries[0], DirectoryEntry::Added(p, _) if p == Path::new("file.txt")));
    }

    #[test]
    fn diff_removed() {
        let mut old = Directory::default();
        let id = ObjectId::from(b"content".as_ref());
        old.insert(PathBuf::from("file.txt"), id);
        let new = Directory::default();

        let diff = old.diff(&new);
        let entries = diff.entries();
        assert_eq!(entries.len(), 1);
        assert!(matches!(&entries[0], DirectoryEntry::Removed(p, _) if p == Path::new("file.txt")));
    }

    #[test]
    fn diff_modified() {
        let mut old = Directory::default();
        let mut new = Directory::default();
        let id1 = ObjectId::from(b"v1".as_ref());
        let id2 = ObjectId::from(b"v2".as_ref());
        old.insert(PathBuf::from("file.txt"), id1);
        new.insert(PathBuf::from("file.txt"), id2);

        let diff = old.diff(&new);
        let entries = diff.entries();
        assert_eq!(entries.len(), 1);
        assert!(matches!(&entries[0], DirectoryEntry::Modified(p, _, _) if p == Path::new("file.txt")));
    }

    #[test]
    fn diff_is_empty_when_identical() {
        let mut a = Directory::default();
        let mut b = Directory::default();
        let id = ObjectId::from(b"same".as_ref());
        a.insert(PathBuf::from("x.txt"), id);
        b.insert(PathBuf::from("x.txt"), id);

        let diff = a.diff(&b);
        assert!(diff.is_empty());
        assert!(diff.entries().is_empty());
    }

    #[test]
    fn diff_unmodified_same_id_no_entry() {
        let mut old = Directory::default();
        let mut new = Directory::default();
        let id = ObjectId::from(b"fixed".as_ref());
        old.insert(PathBuf::from("unchanged.txt"), id);
        new.insert(PathBuf::from("unchanged.txt"), id);
        new.insert(PathBuf::from("new.txt"), ObjectId::from(b"n".as_ref()));

        let diff = old.diff(&new);
        let entries = diff.entries();
        assert_eq!(entries.len(), 1);
        assert!(matches!(&entries[0], DirectoryEntry::Added(p, _) if p == Path::new("new.txt")));
    }

    #[test]
    fn diff_combined_add_remove_modify_sorted_by_path() {
        let mut old = Directory::default();
        let mut new = Directory::default();

        old.insert(PathBuf::from("a.txt"), ObjectId::from(b"a1".as_ref()));
        old.insert(PathBuf::from("b.txt"), ObjectId::from(b"b".as_ref()));
        old.insert(PathBuf::from("c.txt"), ObjectId::from(b"c1".as_ref()));

        new.insert(PathBuf::from("a.txt"), ObjectId::from(b"a2".as_ref()));
        new.insert(PathBuf::from("c.txt"), ObjectId::from(b"c1".as_ref()));
        new.insert(PathBuf::from("d.txt"), ObjectId::from(b"d".as_ref()));

        let entries = old.diff(&new).entries();
        let paths: Vec<_> = entries
            .iter()
            .map(|e| match e {
                DirectoryEntry::Added(p, _) => p.as_path(),
                DirectoryEntry::Removed(p, _) => p.as_path(),
                DirectoryEntry::Modified(p, _, _) => p.as_path(),
            })
            .collect();

        assert_eq!(paths, vec![
            Path::new("a.txt"),
            Path::new("b.txt"),
            Path::new("d.txt"),
        ]);

        assert!(entries.iter().any(|e| matches!(
            e,
            DirectoryEntry::Modified(p, _, _) if p == Path::new("a.txt")
        )));
        assert!(entries.iter().any(|e| matches!(
            e,
            DirectoryEntry::Removed(p, _) if p == Path::new("b.txt")
        )));
        assert!(entries.iter().any(|e| matches!(
            e,
            DirectoryEntry::Added(p, _) if p == Path::new("d.txt")
        )));
    }
}