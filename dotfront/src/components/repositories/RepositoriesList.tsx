import { Box, Stack, Typography, alpha } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import RepositoryRow from "./RepositoryRow";
import type { RepositoryDetail } from "../../hooks/useRepositories";

type Props = {
  repositories: RepositoryDetail[];
};

export default function RepositoriesList({ repositories }: Props) {
  if (repositories.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          borderRadius: 3,
          border: `1px dashed ${alpha("#FFFFFF", 0.12)}`,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <SearchOff sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          No repositories found
        </Typography>
        <Typography variant="body2">
          Try changing your search, language or visibility filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {repositories.map((repo) => (
        <RepositoryRow key={repo.id} repository={repo} />
      ))}
    </Stack>
  );
}
