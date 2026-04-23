import { Avatar, Box, Chip, Link, Typography, alpha } from "@mui/material";
import {
  AccountBalance,
  Apartment,
  CheckCircleOutlined,
  Commit,
  FolderOutlined,
  GroupAdd,
  HighlightOff,
  MergeType,
  Paid,
  Send,
} from "@mui/icons-material";
import type { ActivityEventDetail, ActivityKind } from "../../hooks/useActivity";

type Props = {
  event: ActivityEventDetail;
};

const kindConfig: Record<ActivityKind, { icon: typeof Commit; color: string }> = {
  commit: { icon: Commit, color: "#64B5F6" },
  grant_awarded: { icon: Paid, color: "#58AD95" },
  grant_submitted: { icon: Send, color: "#FFC107" },
  milestone_approved: { icon: CheckCircleOutlined, color: "#58AD95" },
  milestone_rejected: { icon: HighlightOff, color: "#FF5252" },
  repo_created: { icon: FolderOutlined, color: "#E6007A" },
  org_created: { icon: Apartment, color: "#E6007A" },
  member_joined: { icon: GroupAdd, color: "#B388FF" },
  deposit: { icon: AccountBalance, color: "#FFC107" },
  pull_request: { icon: MergeType, color: "#FF4AA6" },
};

export default function ActivityEventRow({ event }: Props) {
  const { icon: Icon, color } = kindConfig[event.kind];

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        p: 2,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        transition: "border-color 150ms ease",
        "&:hover": { borderColor: alpha(color, 0.4) },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha(color, 0.15),
          color,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mb: 0.25,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {event.title}
          </Typography>
          {event.amount && (
            <Chip
              label={event.amount}
              size="small"
              sx={{
                backgroundColor: alpha("#58AD95", 0.15),
                color: "#58AD95",
                fontWeight: 600,
                height: 22,
              }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Avatar
              sx={{
                width: 18,
                height: 18,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: event.actorColor,
                color: "#141414",
              }}
            >
              {event.actor.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {event.actor}
            </Typography>
          </Box>
          <Dot />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {event.organization}
          </Typography>
          {event.repository && (
            <>
              <Dot />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {event.repository}
              </Typography>
            </>
          )}
          {event.txHash && (
            <>
              <Dot />
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                sx={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "#FF4AA6",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {event.txHash}
              </Link>
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {event.timestamp}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function Dot() {
  return (
    <Box
      component="span"
      sx={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        bgcolor: alpha("#FFFFFF", 0.2),
        display: "inline-block",
      }}
    />
  );
}
