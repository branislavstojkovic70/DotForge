import { Box, Typography, alpha } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import OrganizationCard from "./OrganizationCard";
import type { OrganizationDetail } from "../../hooks/useOrganizations";

type Props = {
  organizations: OrganizationDetail[];
};

export default function OrganizationsGrid({ organizations }: Props) {
  if (organizations.length === 0) {
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
          No organizations found
        </Typography>
        <Typography variant="body2">
          Try changing your search, category or filter.
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
          sm: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        },
      }}
    >
      {organizations.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </Box>
  );
}
