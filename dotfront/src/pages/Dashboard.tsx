import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../hooks/useDashboardData";
import StatsOverview from "../components/dashboard/StatsOverview";
import SectionCard from "../components/dashboard/SectionCard";
import OrganizationsList from "../components/dashboard/OrganizationsList";
import RepositoriesList from "../components/dashboard/RepositoriesList";
import GrantsList from "../components/dashboard/GrantsList";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import QuickActions from "../components/dashboard/QuickActions";

export default function Dashboard() {
  const navigate = useNavigate();
  const data = useDashboardData();

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
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Welcome back. Here's what's happening across your organizations.
        </Typography>
      </Box>

      <StatsOverview stats={data.stats} />

      <QuickActions />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <SectionCard
            title="Organizations"
            subtitle="Teams you're part of"
            action={{ label: "View all", onClick: () => navigate("/organizations") }}
          >
            <OrganizationsList organizations={data.organizations} />
          </SectionCard>

          <SectionCard
            title="Recent Repositories"
            subtitle="Latest activity across your repos"
            action={{ label: "View all", onClick: () => navigate("/repositories") }}
          >
            <RepositoriesList repositories={data.repositories} />
          </SectionCard>

          <SectionCard
            title="Active Grants"
            subtitle="Funded and in-progress"
            action={{ label: "View all", onClick: () => navigate("/grants") }}
          >
            <GrantsList grants={data.grants} />
          </SectionCard>
        </Box>

        <Box>
          <SectionCard
            title="Activity"
            subtitle="What happened recently"
            action={{ label: "View all", onClick: () => navigate("/activity") }}
          >
            <ActivityFeed events={data.activity} />
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}
