import { Box, Stack, Typography, alpha } from "@mui/material";
import { BugReport, FolderOutlined, StarBorder } from "@mui/icons-material";
import type { Repository } from "../../hooks/useDashboardData";

type Props = {
  repositories: Repository[];
};

const languageColors: Record<string, string> = {
  Rust: "#DEA584",
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
};

export default function RepositoriesList({ repositories }: Props) {
  return (
    <Stack spacing={1.5}>
      {repositories.map((repo) => (
        <Box
          key={repo.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha("#FFFFFF", 0.04)}`,
            cursor: "pointer",
            transition: "background-color 150ms ease, border-color 150ms ease",
            "&:hover": {
              backgroundColor: alpha("#FFFFFF", 0.03),
              borderColor: alpha("#E6007A", 0.3),
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: alpha("#E6007A", 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderOutlined sx={{ color: "#FF4AA6", fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {repo.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {repo.organization} · updated {repo.updatedAt}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0, alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: languageColors[repo.language] ?? "#BCBDBE",
                }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {repo.language}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color: "text.secondary" }}>
              <StarBorder sx={{ fontSize: 16 }} />
              <Typography variant="caption">{repo.stars}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color: "text.secondary" }}>
              <BugReport sx={{ fontSize: 16 }} />
              <Typography variant="caption">{repo.openIssues}</Typography>
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
