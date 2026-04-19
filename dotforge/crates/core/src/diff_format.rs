use crate::content_diff::Change;

pub struct DiffFormatter {
    context_lines: usize,
}

impl DiffFormatter {
    pub fn new(context_lines: usize) -> Self {
        Self { context_lines }
    }

    pub fn format(&self, changes: &[Change]) -> String {
        if changes.is_empty() {
            return String::new();
        }

        let mut output = String::new();
        let mut chunks: Vec<(usize, usize)> = vec![];
        let mut in_change = false;
        let mut chunk_start = 0;

        for (i, change) in changes.iter().enumerate() {
            match change {
                Change::Added(_) | Change::Removed(_) => {
                    if !in_change {
                        chunk_start = i.saturating_sub(self.context_lines);
                        in_change = true;
                    }
                }
                Change::Unchanged(_) => {
                    if in_change {
                        let chunk_end = (i + self.context_lines).min(changes.len());
                        chunks.push((chunk_start, chunk_end));
                        in_change = false;
                    }
                }
            }
        }

        if in_change {
            chunks.push((chunk_start, changes.len()));
        }

        for (start, end) in chunks {
            output.push_str(&format!("@@ -{},{} @@\n", start + 1, end - start));
            for change in &changes[start..end] {
                match change {
                    Change::Added(line) => output.push_str(&format!("+{}\n", line)),
                    Change::Removed(line) => output.push_str(&format!("-{}\n", line)),
                    Change::Unchanged(line) => output.push_str(&format!(" {}\n", line)),
                }
            }
        }

        output
    }

    pub fn format_simple(&self, changes: &[Change]) -> String {
        let mut added = 0;
        let mut removed = 0;
        for change in changes {
            match change {
                Change::Added(_) => added += 1,
                Change::Removed(_) => removed += 1,
                Change::Unchanged(_) => {}
            }
        }
        format!("+{} -{}", added, removed)
    }
}

impl Default for DiffFormatter {
    fn default() -> Self {
        Self::new(3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_empty() {
        let f = DiffFormatter::default();
        assert_eq!(f.format(&[]), "");
    }

    #[test]
    fn test_format_added() {
        let changes = vec![
            Change::Unchanged("a".to_string()),
            Change::Added("b".to_string()),
        ];
        let f = DiffFormatter::default();
        let out = f.format(&changes);
        assert!(out.contains("+b"));
        assert!(out.contains(" a"));
    }

    #[test]
    fn test_format_removed() {
        let changes = vec![
            Change::Unchanged("a".to_string()),
            Change::Removed("b".to_string()),
            Change::Unchanged("c".to_string()),
        ];
        let f = DiffFormatter::default();
        let out = f.format(&changes);
        assert!(out.contains("-b"));
    }

    #[test]
    fn test_format_simple() {
        let changes = vec![
            Change::Added("x".to_string()),
            Change::Added("y".to_string()),
            Change::Removed("z".to_string()),
        ];
        let f = DiffFormatter::default();
        assert_eq!(f.format_simple(&changes), "+2 -1");
    }

    #[test]
    fn test_no_output_for_unchanged() {
        let changes = vec![
            Change::Unchanged("a".to_string()),
            Change::Unchanged("b".to_string()),
        ];
        let f = DiffFormatter::default();
        assert_eq!(f.format(&changes), "");
    }
}