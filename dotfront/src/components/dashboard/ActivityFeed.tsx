import { Box, Stack, Typography, alpha } from "@mui/material";
import {
  Apartment,
  CheckCircleOutlined,
  Commit,
  FolderOutlined,
  Paid,
} from "@mui/icons-material";
import type { ActivityEvent, ActivityKind } from "../../hooks/useDashboardData";

type Props = {
  events: ActivityEvent[];
};

const kindConfig: Record<ActivityKind, { icon: typeof Commit; color: string }> = {
  commit: { icon: Commit, color: "#64B5F6" },
  grant: { icon: Paid, color: "#58AD95" },
  organization: { icon: Apartment, color: "#E6007A" },
  repository: { icon: FolderOutlined, color: "#FFC107" },
  milestone: { icon: CheckCircleOutlined, color: "#BCBDBE" },
};

export default function ActivityFeed({ events }: Props) {
  return (
    <Stack spacing={2}>
      {events.map((event, index) => {
        const { icon: Icon, color } = kindConfig[event.kind];
        const isLast = index === events.length - 1;
        return (
          <Box key={event.id} sx={{ display: "flex", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: alpha(color, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon sx={{ fontSize: 16, color }} />
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    flex: 1,
                    width: 2,
                    minHeight: 16,
                    backgroundColor: alpha("#FFFFFF", 0.06),
                    mt: 0.5,
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: isLast ? 0 : 1.5, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {event.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.25 }}>
                {event.description}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {event.actor} · {event.timestamp}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
