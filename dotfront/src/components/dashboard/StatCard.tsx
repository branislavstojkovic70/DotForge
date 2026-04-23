import { Box, Card, CardContent, Typography, alpha, useTheme } from "@mui/material";
import { TrendingDown, TrendingFlat, TrendingUp } from "@mui/icons-material";
import type { Stat } from "../../hooks/useDashboardData";

type Props = {
  stat: Stat;
};

export default function StatCard({ stat }: Props) {
  const theme = useTheme();

  const trendColor =
    stat.trend === "up"
      ? theme.palette.success.main
      : stat.trend === "down"
      ? theme.palette.error.main
      : theme.palette.text.secondary;

  const TrendIcon =
    stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : TrendingFlat;

  return (
    <Card
      sx={{
        height: "100%",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        transition: "border-color 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: alpha("#E6007A", 0.4),
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
          {stat.label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {stat.value}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: trendColor }}>
          <TrendIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" sx={{ color: trendColor, fontWeight: 500 }}>
            {stat.delta}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
