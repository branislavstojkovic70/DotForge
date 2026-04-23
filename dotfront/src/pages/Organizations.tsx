import { Box } from "@mui/material";
import { useOrganizations } from "../hooks/useOrganizations";
import OrganizationsHeader from "../components/organizations/OrganizationsHeader";
import OrganizationsFilters from "../components/organizations/OrganizationsFilters";
import OrganizationsGrid from "../components/organizations/OrganizationsGrid";

export default function Organizations() {
  const { organizations, categories, filters, setFilters, totals } = useOrganizations();

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <OrganizationsHeader totals={totals} />
      <OrganizationsFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />
      <OrganizationsGrid organizations={organizations} />
    </Box>
  );
}
