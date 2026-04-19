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
    let max = n + m;

    if max == 0 {
        return vec![];
    }

    let mut v = vec![0isize; 2 * max + 1];
    let mut trace: Vec<Vec<isize>> = vec![];

    'outer: for d in 0..=(max as isize) {
        trace.push(v.clone());
        let mut k = -d;
        while k <= d {
            let idx = (k + max as isize) as usize;
            let mut x = if k == -d
                || (k != d && v[(idx as isize - 1) as usize] < v[idx + 1])
            {
                v[idx + 1]
            } else {
                v[(idx as isize - 1) as usize] + 1
            };
            let mut y = x - k;
            while x < n as isize && y < m as isize
                && old[x as usize] == new[y as usize]
            {
                x += 1;
                y += 1;
            }
            v[idx] = x;
            if x >= n as isize && y >= m as isize {
                break 'outer;
            }
            k += 2;
        }
    }

    backtrack(&trace, old, new, max)
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
            || (k != d && v[(idx as isize - 1) as usize] < v[idx + 1])
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
            if x == prev_x + 1 {
                changes.push(Change::Removed(old[(x - 1) as usize].clone()));
                x -= 1;
            } else {
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
