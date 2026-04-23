import { Box } from "@mui/material";
import { useGrants } from "../hooks/useGrants";
import GrantsHeader from "../components/grants/GrantsHeader";
import GrantsFilters from "../components/grants/GrantsFilters";
import GrantsGrid from "../components/grants/GrantsGrid";

export default function Grants() {
  const { grants, categories, statuses, filters, setFilters, totals } = useGrants();

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
      <GrantsHeader totals={totals} />
      <GrantsFilters
        filters={filters}
        categories={categories}
        statuses={statuses}
        onChange={setFilters}
      />
      <GrantsGrid grants={grants} />
    </Box>
  );
}
