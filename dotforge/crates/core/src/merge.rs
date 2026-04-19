use std::collections::BTreeMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use crate::content_diff::{myers_diff, Change};
use crate::object_id::ObjectId;
use crate::object_store::ObjectStore;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ConflictType {
    BothModified,
    ModifiedDeleted,
    BothAdded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeConflict {
    pub path: PathBuf,
    pub base_id: Option<ObjectId>,
    pub ours_id: Option<ObjectId>,
    pub theirs_id: Option<ObjectId>,
    pub conflict_type: ConflictType,
    pub resolved: bool,
    pub resolution_id: Option<ObjectId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeResult {
    pub merged_files: BTreeMap<PathBuf, ObjectId>,
    pub conflicts: Vec<MergeConflict>,
}

impl MergeResult {
    pub fn has_conflicts(&self) -> bool {
        !self.conflicts.is_empty()
    }

    pub fn is_clean(&self) -> bool {
        self.conflicts.is_empty()
    }
}

#[derive(Debug)]
pub enum MergeError {
    ObjectMissing(ObjectId),
    NotUtf8(PathBuf),
    StoreError(String),
}

impl std::fmt::Display for MergeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MergeError::ObjectMissing(id) => write!(f, "missing object: {}", id),
            MergeError::NotUtf8(p) => write!(f, "not utf8: {:?}", p),
            MergeError::StoreError(e) => write!(f, "store error: {}", e),
        }
    }
}

pub fn three_way_merge<S: ObjectStore>(
    store: &mut S,
    base_files: &BTreeMap<PathBuf, ObjectId>,
    ours_files: &BTreeMap<PathBuf, ObjectId>,
    theirs_files: &BTreeMap<PathBuf, ObjectId>,
) -> Result<MergeResult, MergeError>
where
    S::Error: std::fmt::Debug,
{
    let mut merged_files: BTreeMap<PathBuf, ObjectId> = BTreeMap::new();
    let mut conflicts: Vec<MergeConflict> = vec![];

    let mut all_paths = std::collections::BTreeSet::new();
    for p in base_files.keys().chain(ours_files.keys()).chain(theirs_files.keys()) {
        all_paths.insert(p.clone());
    }

    for path in all_paths {
        let base_id = base_files.get(&path).copied();
        let ours_id = ours_files.get(&path).copied();
        let theirs_id = theirs_files.get(&path).copied();

        match (base_id, ours_id, theirs_id) {
            (Some(b), Some(o), Some(t)) => {
                if o == t {
                    merged_files.insert(path, o);
                } else if o == b {
                    merged_files.insert(path, t);
                } else if t == b {
                    merged_files.insert(path, o);
                } else {
                    match try_line_merge(store, path.clone(), b, o, t) {
                        Ok(merged_id) => {
                            merged_files.insert(path, merged_id);
                        }
                        Err(_) => {
                            conflicts.push(MergeConflict {
                                path,
                                base_id: Some(b),
                                ours_id: Some(o),
                                theirs_id: Some(t),
                                conflict_type: ConflictType::BothModified,
                                resolved: false,
                                resolution_id: None,
                            });
                        }
                    }
                }
            }

            (None, Some(o), None) => {
                merged_files.insert(path, o);
            }

            (None, None, Some(t)) => {
                merged_files.insert(path, t);
            }

            (None, Some(o), Some(t)) => {
                if o == t {
                    merged_files.insert(path, o);
                } else {
                    conflicts.push(MergeConflict {
                        path,
                        base_id: None,
                        ours_id: Some(o),
                        theirs_id: Some(t),
                        conflict_type: ConflictType::BothAdded,
                        resolved: false,
                        resolution_id: None,
                    });
                }
            }

            (Some(_), None, Some(t)) => {
                conflicts.push(MergeConflict {
                    path,
                    base_id,
                    ours_id: None,
                    theirs_id: Some(t),
                    conflict_type: ConflictType::ModifiedDeleted,
                    resolved: false,
                    resolution_id: None,
                });
            }

            (Some(_), Some(o), None) => {
                conflicts.push(MergeConflict {
                    path,
                    base_id,
                    ours_id: Some(o),
                    theirs_id: None,
                    conflict_type: ConflictType::ModifiedDeleted,
                    resolved: false,
                    resolution_id: None,
                });
            }

            (Some(_), None, None) => {}

            (None, None, None) => {}
        }
    }

    Ok(MergeResult { merged_files, conflicts })
}

fn try_line_merge<S: ObjectStore>(
    store: &mut S,
    path: PathBuf,
    base_id: ObjectId,
    ours_id: ObjectId,
    theirs_id: ObjectId,
) -> Result<ObjectId, MergeError>
where
    S::Error: std::fmt::Debug,
{
    let read = |id: ObjectId| -> Result<Vec<String>, MergeError> {
        let data = store.read(id)
            .map_err(|e| MergeError::StoreError(format!("{:?}", e)))?
            .ok_or(MergeError::ObjectMissing(id))?;
        let s = std::str::from_utf8(&data)
            .map_err(|_| MergeError::NotUtf8(path.clone()))?;
        Ok(s.lines().map(|l| l.to_string()).collect())
    };

    let base_lines = read(base_id)?;
    let ours_lines = read(ours_id)?;
    let theirs_lines = read(theirs_id)?;

    if ours_lines == theirs_lines {
        let id = store.insert(ours_lines.join("\n").as_bytes())
            .map_err(|e| MergeError::StoreError(format!("{:?}", e)))?;
        return Ok(id);
    }

    let ours_diff = myers_diff(&base_lines, &ours_lines);
    let theirs_diff = myers_diff(&base_lines, &theirs_lines);

    let mut ours_changed: std::collections::BTreeSet<usize> = Default::default();
    let mut theirs_changed: std::collections::BTreeSet<usize> = Default::default();

    let mut base_idx = 0;
    for change in &ours_diff {
        match change {
            Change::Unchanged(_) => { base_idx += 1; }
            Change::Removed(_) => { ours_changed.insert(base_idx); base_idx += 1; }
            Change::Added(_) => {}
        }
    }

    base_idx = 0;
    for change in &theirs_diff {
        match change {
            Change::Unchanged(_) => { base_idx += 1; }
            Change::Removed(_) => { theirs_changed.insert(base_idx); base_idx += 1; }
            Change::Added(_) => {}
        }
    }

    for idx in &ours_changed {
        if theirs_changed.contains(idx) {
            return Err(MergeError::StoreError("conflict".to_string()));
        }
    }

    let mut result: Vec<String> = vec![];
    let mut oi = 0;
    let mut ti = 0;

    loop {
        match (ours_diff.get(oi), theirs_diff.get(ti)) {
            (None, None) => break,
            (Some(Change::Unchanged(l)), Some(Change::Unchanged(_))) => {
                result.push(l.clone());
                oi += 1; ti += 1;
            }
            (Some(Change::Added(l)), _) => {
                result.push(l.clone());
                oi += 1;
            }
            (_, Some(Change::Added(l))) => {
                result.push(l.clone());
                ti += 1;
            }
            (Some(Change::Removed(_)), Some(Change::Removed(_))) => {
                oi += 1; ti += 1;
            }
            (Some(Change::Removed(_)), Some(Change::Unchanged(_))) => {
                oi += 1; ti += 1;
            }
            (Some(Change::Unchanged(_)), Some(Change::Removed(_))) => {
                oi += 1; ti += 1;
            }
            (Some(c), None) => {
                if let Change::Unchanged(l) | Change::Added(l) = c {
                    result.push(l.clone());
                }
                oi += 1;
            }
            (None, Some(c)) => {
                if let Change::Unchanged(l) | Change::Added(l) = c {
                    result.push(l.clone());
                }
                ti += 1;
            }
        }
    }

    let content = result.join("\n");
    let id = store.insert(content.as_bytes())
        .map_err(|e| MergeError::StoreError(format!("{:?}", e)))?;
    Ok(id)
}

