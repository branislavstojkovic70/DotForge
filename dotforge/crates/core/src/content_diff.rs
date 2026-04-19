use crate::object_id::ObjectId;
use crate::object_store::ObjectStore;

#[derive(Debug, Clone, PartialEq)]
pub enum Change {
    Added(String),
    Removed(String),
    Unchanged(String),
}

#[derive(Debug)]
pub enum Error<S: ObjectStore> {
    Store(S::Error),
    NotFound(ObjectId),
    NotUtf8,
}

pub fn diff_objects<S: ObjectStore>(
    store: &S,
    old_id: Option<ObjectId>,
    new_id: Option<ObjectId>,
) -> Result<Vec<Change>, Error<S>> {
    let old_lines = match old_id {
        None => vec![],
        Some(id) => {
            let data = store.read(id)
                .map_err(Error::Store)?
                .ok_or(Error::NotFound(id))?;
            let s = std::str::from_utf8(&data)
                .map_err(|_| Error::NotUtf8)?;
            s.lines().map(|l| l.to_string()).collect()
        }
    };

    let new_lines = match new_id {
        None => vec![],
        Some(id) => {
            let data = store.read(id)
                .map_err(Error::Store)?
                .ok_or(Error::NotFound(id))?;
            let s = std::str::from_utf8(&data)
                .map_err(|_| Error::NotUtf8)?;
            s.lines().map(|l| l.to_string()).collect()
        }
    };

    Ok(myers_diff(&old_lines, &new_lines))
}

pub fn myers_diff(old: &[String], new: &[String]) -> Vec<Change> {
    let n = old.len();
    let m = new.len();

    // build LCS table
    let mut dp = vec![vec![0usize; m + 1]; n + 1];
    for i in (0..n).rev() {
        for j in (0..m).rev() {
            dp[i][j] = if old[i] == new[j] {
                dp[i + 1][j + 1] + 1
            } else {
                dp[i + 1][j].max(dp[i][j + 1])
            };
        }
    }

    // backtrack
    let mut changes = vec![];
    let mut i = 0;
    let mut j = 0;

    while i < n || j < m {
        if i < n && j < m && old[i] == new[j] {
            changes.push(Change::Unchanged(old[i].clone()));
            i += 1;
            j += 1;
        } else if j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j]) {
            changes.push(Change::Added(new[j].clone()));
            j += 1;
        } else {
            changes.push(Change::Removed(old[i].clone()));
            i += 1;
        }
    }

    changes
}

fn backtrack(
    trace: &[Vec<isize>],
    old: &[String],
    new: &[String],
    max: usize,
) -> Vec<Change> {
    let mut changes = vec![];
    let mut x = old.len() as isize;
    let mut y = new.len() as isize;

    for (d, v) in trace.iter().enumerate().rev() {
        let d = d as isize;
        let k = x - y;
        let idx = (k + max as isize) as usize;

        let prev_k = if k == -d
            || (k != d && v.get((idx as isize - 1) as usize).copied().unwrap_or(-1)
                < v.get(idx + 1).copied().unwrap_or(-1))
        {
            k + 1
        } else {
            k - 1
        };

        let prev_idx = (prev_k + max as isize) as usize;
        let prev_x = v[prev_idx];
        let prev_y = prev_x - prev_k;

        while x > prev_x + 1 && y > prev_y + 1 {
            x -= 1;
            y -= 1;
            changes.push(Change::Unchanged(old[x as usize].clone()));
        }

        if d > 0 {
            if x > prev_x {
                changes.push(Change::Removed(old[(x - 1) as usize].clone()));
                x -= 1;
            } else if y > prev_y {
                changes.push(Change::Added(new[(y - 1) as usize].clone()));
                y -= 1;
            }
        }

        while x > prev_x && y > prev_y {
            x -= 1;
            y -= 1;
            changes.push(Change::Unchanged(old[x as usize].clone()));
        }
    }

    changes.reverse();
    changes
}

#[cfg(test)]
mod tests {
    use super::*;

    fn s(lines: &[&str]) -> Vec<String> {
        lines.iter().map(|l| l.to_string()).collect()
    }

    #[test]
    fn test_identical() {
        let lines = s(&["a", "b", "c"]);
        let diff = myers_diff(&lines, &lines);
        assert!(diff.iter().all(|c| matches!(c, Change::Unchanged(_))));
    }

    #[test]
    fn test_added_line() {
        let old = s(&["a", "b"]);
        let new = s(&["a", "b", "c"]);
        let diff = myers_diff(&old, &new);
        assert!(diff.iter().any(|c| matches!(c, Change::Added(l) if l == "c")));
    }

    #[test]
    fn test_removed_line() {
        let old = s(&["a", "b", "c"]);
        let new = s(&["a", "c"]);
        let diff = myers_diff(&old, &new);
        assert!(diff.iter().any(|c| matches!(c, Change::Removed(l) if l == "b")));
    }

    #[test]
    fn test_empty_old() {
        let old = s(&[]);
        let new = s(&["a", "b"]);
        let diff = myers_diff(&old, &new);
        assert_eq!(diff.len(), 2);
        assert!(diff.iter().all(|c| matches!(c, Change::Added(_))));
    }

    #[test]
    fn test_empty_new() {
        let old = s(&["a", "b"]);
        let new = s(&[]);
        let diff = myers_diff(&old, &new);
        assert_eq!(diff.len(), 2);
        assert!(diff.iter().all(|c| matches!(c, Change::Removed(_))));
    }
}