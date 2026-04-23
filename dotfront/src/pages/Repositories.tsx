import { Box } from "@mui/material";
import { useRepositories } from "../hooks/useRepositories";
import RepositoriesHeader from "../components/repositories/RepositoriesHeader";
import RepositoriesFilters from "../components/repositories/RepositoriesFilters";
import RepositoriesList from "../components/repositories/RepositoriesList";

export default function Repositories() {
  const { repositories, languages, filters, setFilters, totals } = useRepositories();

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
      <RepositoriesHeader totals={totals} />
      <RepositoriesFilters
        filters={filters}
        languages={languages}
        onChange={setFilters}
      />
      <RepositoriesList repositories={repositories} />
    </Box>
  );
}
