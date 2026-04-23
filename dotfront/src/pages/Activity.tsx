import { Box } from "@mui/material";
import { useActivity } from "../hooks/useActivity";
import ActivityHeader from "../components/activity/ActivityHeader";
import ActivityFilters from "../components/activity/ActivityFilters";
import ActivityTimeline from "../components/activity/ActivityTimeline";

export default function Activity() {
  const { grouped, kinds, filters, setFilters, totals } = useActivity();

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <ActivityHeader totals={totals} />
      <ActivityFilters filters={filters} kinds={kinds} onChange={setFilters} />
      <ActivityTimeline groups={grouped} />
    </Box>
  );
}
