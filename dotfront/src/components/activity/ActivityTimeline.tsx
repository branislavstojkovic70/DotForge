import { Box, Stack, Typography, alpha } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import ActivityEventRow from "./ActivityEventRow";
import type { ActivityEventDetail } from "../../hooks/useActivity";

type Group = {
  label: string;
  items: ActivityEventDetail[];
};

type Props = {
  groups: Group[];
};

export default function ActivityTimeline({ groups }: Props) {
  if (groups.length === 0) {
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
          No activity yet
        </Typography>
        <Typography variant="body2">
          Try a different event type or search term.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {groups.map((group) => (
        <Box key={group.label}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              {group.label}
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: 1,
                backgroundColor: alpha("#FFFFFF", 0.06),
              }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {group.items.length} event{group.items.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {group.items.map((event) => (
              <ActivityEventRow key={event.id} event={event} />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
