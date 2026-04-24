import { Box, Chip, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import {
  Apartment,
  CalendarToday,
  FlagOutlined,
  Groups,
  Paid,
} from "@mui/icons-material";
import type { StoredOrg } from "../../utils/localStore";
import type { GrantDraft } from "./GrantForm";

type Props = {
  draft: GrantDraft;
  org: StoredOrg | null;
};

export default function GrantPreview({ draft, org }: Props) {
  const title = draft.title.trim() || "Untitled grant";
  const description =
    draft.description.trim() ||
    "A short summary of what will be built, who benefits, and what success looks like will appear here.";

  const requested = Number(draft.amount) || 0;
  const milestoneTotal = draft.milestones.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );

  const color = org?.avatarColor ?? "#B388FF";

  return (
    <Box
      sx={{
        position: "sticky",
        top: 24,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.6 }}
      >
        Preview
      </Typography>

      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: "#1E1E1E",
          border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label={draft.category}
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: alpha(color, 0.15),
              color,
              border: `1px solid ${alpha(color, 0.35)}`,
            }}
          />
          <Chip
            size="small"
            label="Draft"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: alpha("#FFC107", 0.12),
              color: "#FFC107",
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", lineHeight: 1.55 }}
        >
          {description}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.secondary",
            mt: 0.5,
          }}
        >
          <Apartment sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {org ? `${org.name} · #${org.orgId}` : "No organization selected"}
          </Typography>
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Funding progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              0% funded
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={0}
            sx={{
              height: 6,
              borderRadius: 99,
              backgroundColor: alpha("#FFFFFF", 0.06),
              "& .MuiLinearProgress-bar": {
                backgroundColor: color,
                borderRadius: 99,
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "1fr 1fr",
            mt: 1,
          }}
        >
          <Stat
            icon={<Paid sx={{ fontSize: 14 }} />}
            label="Requested"
            value={`${requested.toLocaleString()} ${draft.currency}`}
          />
          <Stat
            icon={<FlagOutlined sx={{ fontSize: 14 }} />}
            label="Milestones"
            value={
              draft.milestones.length > 0
                ? `${draft.milestones.length} · ${milestoneTotal.toLocaleString()} ${draft.currency}`
                : "None"
            }
          />
          <Stat
            icon={<Groups sx={{ fontSize: 14 }} />}
            label="Team size"
            value={`${draft.teamSize}`}
          />
          <Stat
            icon={<CalendarToday sx={{ fontSize: 14 }} />}
            label="Deadline"
            value={draft.deadline || "—"}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: alpha("#B388FF", 0.06),
          border: `1px solid ${alpha("#B388FF", 0.2)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#B388FF", fontWeight: 700, letterSpacing: 0.4 }}
        >
          ON-CHAIN FLOW
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Step n={1} text="createGrant(orgId, amount) — deducts GRANT_FEE from treasury" />
          <Step n={2} text="assignGrant(grantId, assignee) — Owner picks a builder" />
          <Step n={3} text="submitGrant(grantId) — assignee submits when complete" />
          <Step n={4} text="submitVerdict(grantId, approved) — auditor finalizes" />
        </Stack>
      </Box>
    </Box>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        backgroundColor: alpha("#FFFFFF", 0.03),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          mb: 0.25,
        }}
      >
        {icon}
        <Typography variant="caption">{label}</Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: alpha("#B388FF", 0.2),
          color: "#B388FF",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {n}
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Box>
  );
}
