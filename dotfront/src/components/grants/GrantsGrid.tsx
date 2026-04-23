import { Box, Typography, alpha } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import GrantCard from "./GrantCard";
import type { GrantDetail } from "../../hooks/useGrants";

type Props = {
  grants: GrantDetail[];
};

export default function GrantsGrid({ grants }: Props) {
  if (grants.length === 0) {
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
          No grants match your filters
        </Typography>
        <Typography variant="body2">
          Try a different status, category or search term.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
        },
      }}
    >
      {grants.map((grant) => (
        <GrantCard key={grant.id} grant={grant} />
      ))}
    </Box>
  );
}
