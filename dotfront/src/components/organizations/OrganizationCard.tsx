import { Avatar, Box, Button, Chip, Divider, Stack, Typography, alpha } from "@mui/material";
import { Paid, Verified } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OrgRole, OrganizationDetail } from "../../hooks/useOrganizations";
import DepositDialog from "../deposit/DepositDialog";

type Props = {
  organization: OrganizationDetail;
};

const roleStyles: Record<OrgRole, { bg: string; fg: string }> = {
  Owner: { bg: alpha("#E6007A", 0.18), fg: "#FF4AA6" },
  Admin: { bg: alpha("#58AD95", 0.18), fg: "#58AD95" },
  Member: { bg: alpha("#64B5F6", 0.18), fg: "#64B5F6" },
  Contributor: { bg: alpha("#BCBDBE", 0.15), fg: "#BCBDBE" },
};

export default function OrganizationCard({ organization }: Props) {
  const navigate = useNavigate();
  const role = roleStyles[organization.role];
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <Box
      onClick={() => navigate(`/organizations/${organization.id}`)}
      sx={{
        position: "relative",
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        cursor: "pointer",
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
            bgcolor: organization.avatarColor,
            color: "#141414",
            fontWeight: 700,
            width: 48,
            height: 48,
          }}
        >
          {organization.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {organization.name}
            </Typography>
            {organization.verified && (
              <Verified sx={{ fontSize: 16, color: "#64B5F6" }} titleAccess="Verified" />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {organization.handle}
          </Typography>
        </Box>
        <Chip
          label={organization.role}
          size="small"
          sx={{
            backgroundColor: role.bg,
            color: role.fg,
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
        {organization.description}
      </Typography>

      <Chip
        label={organization.category}
        size="small"
        sx={{
          alignSelf: "flex-start",
          backgroundColor: alpha("#FFFFFF", 0.06),
          color: "text.secondary",
          fontWeight: 500,
        }}
      />

      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
        }}
      >
        <Stat label="Members" value={organization.members.toString()} />
        <Stat label="Repos" value={organization.repositories.toString()} />
        <Stat label="Grants" value={organization.activeGrants.toString()} />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Total funded
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {organization.totalFunded}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Paid sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              setDepositOpen(true);
            }}
            sx={{
              textTransform: "none",
              borderColor: alpha("#58AD95", 0.4),
              color: "#58AD95",
              "&:hover": {
                borderColor: "#58AD95",
                backgroundColor: alpha("#58AD95", 0.08),
              },
            }}
          >
            Deposit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizations/${organization.id}`);
            }}
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
        </Stack>
      </Box>

      <Box onClick={(e) => e.stopPropagation()}>
        <DepositDialog
          open={depositOpen}
          onClose={() => setDepositOpen(false)}
          orgId={organization.id}
        />
      </Box>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}
