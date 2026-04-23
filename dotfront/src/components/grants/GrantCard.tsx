import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { CheckCircle, Groups, RadioButtonUnchecked } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatDot, type GrantDetail, type GrantStatus } from "../../hooks/useGrants";

type Props = {
  grant: GrantDetail;
};

const statusStyles: Record<GrantStatus, { bg: string; fg: string }> = {
  Active: { bg: alpha("#58AD95", 0.18), fg: "#58AD95" },
  "Under Review": { bg: alpha("#FFC107", 0.18), fg: "#FFC107" },
  Completed: { bg: alpha("#64B5F6", 0.18), fg: "#64B5F6" },
  Draft: { bg: alpha("#BCBDBE", 0.15), fg: "#BCBDBE" },
  Rejected: { bg: alpha("#FF5252", 0.15), fg: "#FF5252" },
};

export default function GrantCard({ grant }: Props) {
  const navigate = useNavigate();
  const status = statusStyles[grant.status];
  const completedMs = grant.milestones.filter((m) => m.completed).length;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "border-color 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: alpha("#E6007A", 0.4),
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: grant.organizationColor,
            color: "#141414",
            fontWeight: 700,
            width: 44,
            height: 44,
            flexShrink: 0,
          }}
        >
          {grant.organization.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {grant.title}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {grant.organization} · {grant.category}
          </Typography>
        </Box>
        <Chip
          label={grant.status}
          size="small"
          sx={{
            backgroundColor: status.bg,
            color: status.fg,
            fontWeight: 600,
            flexShrink: 0,
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 40,
        }}
      >
        {grant.description}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: alpha("#FFFFFF", 0.03),
          border: `1px solid ${alpha("#FFFFFF", 0.04)}`,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Requested
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {formatDot(grant.amountRequested)} {grant.currency}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Paid out
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#58AD95" }}>
            {formatDot(grant.amountPaid)} {grant.currency}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.75,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Milestones · {completedMs}/{grant.milestones.length}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {grant.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={grant.progress}
          sx={{
            height: 6,
            borderRadius: 999,
            backgroundColor: alpha("#FFFFFF", 0.06),
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#E6007A",
              borderRadius: 999,
            },
          }}
        />
      </Box>

      <Stack spacing={0.75}>
        {grant.milestones.map((ms) => (
          <Box key={ms.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {ms.completed ? (
              <CheckCircle sx={{ fontSize: 16, color: "#58AD95" }} />
            ) : (
              <RadioButtonUnchecked sx={{ fontSize: 16, color: "text.secondary" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                flex: 1,
                color: ms.completed ? "text.primary" : "text.secondary",
                textDecoration: ms.completed ? "none" : "none",
              }}
              noWrap
            >
              {ms.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDot(ms.amount)} {grant.currency}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ color: "text.secondary" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Groups sx={{ fontSize: 16 }} />
            <Typography variant="caption">{grant.teamSize} team</Typography>
          </Box>
          <Typography variant="caption">Applied {grant.appliedAt}</Typography>
          {grant.deadline !== "—" && (
            <Typography variant="caption">Due {grant.deadline}</Typography>
          )}
        </Stack>
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(`/grants/${grant.id}`)}
          sx={{
            textTransform: "none",
            borderColor: alpha("#FFFFFF", 0.12),
            color: "#F5F5F5",
            "&:hover": {
              borderColor: "#E6007A",
              backgroundColor: alpha("#E6007A", 0.08),
            },
          }}
        >
          View
        </Button>
      </Box>
    </Box>
  );
}
