import { Box } from "@mui/material";
import StatCard from "./StatCard";
import type { Stat } from "../../hooks/useDashboardData";

type Props = {
  stats: Stat[];
};

export default function StatsOverview({ stats }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
      }}
    >
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </Box>
  );
}
