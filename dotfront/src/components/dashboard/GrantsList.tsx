import { Box, Chip, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import type { Grant, GrantStatus } from "../../hooks/useDashboardData";

type Props = {
  grants: Grant[];
};

const statusStyles: Record<GrantStatus, { bg: string; fg: string }> = {
  Active: { bg: alpha("#58AD95", 0.15), fg: "#58AD95" },
  Review: { bg: alpha("#FFC107", 0.15), fg: "#FFC107" },
  Completed: { bg: alpha("#64B5F6", 0.15), fg: "#64B5F6" },
  Draft: { bg: alpha("#BCBDBE", 0.15), fg: "#BCBDBE" },
};

export default function GrantsList({ grants }: Props) {
  return (
    <Stack spacing={2}>
      {grants.map((grant) => {
        const styles = statusStyles[grant.status];
        return (
          <Box
            key={grant.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha("#FFFFFF", 0.04)}`,
              cursor: "pointer",
              transition: "border-color 150ms ease",
              "&:hover": { borderColor: alpha("#E6007A", 0.3) },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
                mb: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                  {grant.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {grant.organization} · {grant.milestone}
                </Typography>
              </Box>
              <Chip
                label={grant.status}
                size="small"
                sx={{
                  backgroundColor: styles.bg,
                  color: styles.fg,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {grant.amount}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {grant.currency}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={grant.progress}
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: alpha("#FFFFFF", 0.06),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#E6007A",
                    borderRadius: 999,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 32 }}>
                {grant.progress}%
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
