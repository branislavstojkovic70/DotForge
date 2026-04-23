import { Box, Button, Typography, alpha } from "@mui/material";
import {
  Add,
  Apartment,
  Groups,
  Paid,
  Verified,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type Totals = {
  total: number;
  verified: number;
  members: number;
  activeGrants: number;
};

type Props = {
  totals: Totals;
};

type SummaryItem = {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
};

export default function OrganizationsHeader({ totals }: Props) {
  const navigate = useNavigate();

  const summary: SummaryItem[] = [
    {
      label: "Organizations",
      value: totals.total.toString(),
      icon: <Apartment sx={{ fontSize: 18 }} />,
      color: "#E6007A",
    },
    {
      label: "Verified",
      value: totals.verified.toString(),
      icon: <Verified sx={{ fontSize: 18 }} />,
      color: "#64B5F6",
    },
    {
      label: "Total members",
      value: totals.members.toString(),
      icon: <Groups sx={{ fontSize: 18 }} />,
      color: "#58AD95",
    },
    {
      label: "Active grants",
      value: totals.activeGrants.toString(),
      icon: <Paid sx={{ fontSize: 18 }} />,
      color: "#FFC107",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Organizations
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Discover, join and manage teams building in the Polkadot ecosystem.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate("/organizations/new")}
          sx={{
            textTransform: "none",
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "center" },
            px: 2.5,
            py: 1.1,
          }}
        >
          New Organization
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        {summary.map((item) => (
          <Box
            key={item.label}
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "#1E1E1E",
              border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              transition: "border-color 150ms ease",
              "&:hover": { borderColor: alpha(item.color, 0.4) },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(item.color, 0.15),
                color: item.color,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {item.value}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {item.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
