import { Box, Button, Typography, alpha } from "@mui/material";
import {
  Add,
  HourglassTop,
  Paid,
  RocketLaunch,
  Savings,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { formatDot } from "../../hooks/useGrants";

type Totals = {
  total: number;
  active: number;
  underReview: number;
  totalRequested: number;
  totalPaid: number;
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

export default function GrantsHeader({ totals }: Props) {
  const navigate = useNavigate();

  const summary: SummaryItem[] = [
    {
      label: "Active grants",
      value: totals.active.toString(),
      icon: <RocketLaunch sx={{ fontSize: 18 }} />,
      color: "#58AD95",
    },
    {
      label: "Under review",
      value: totals.underReview.toString(),
      icon: <HourglassTop sx={{ fontSize: 18 }} />,
      color: "#FFC107",
    },
    {
      label: "Total paid",
      value: `${formatDot(totals.totalPaid)} DOT`,
      icon: <Paid sx={{ fontSize: 18 }} />,
      color: "#E6007A",
    },
    {
      label: "Total requested",
      value: `${formatDot(totals.totalRequested)} DOT`,
      icon: <Savings sx={{ fontSize: 18 }} />,
      color: "#64B5F6",
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
            Grants
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Track funded work, review milestones and apply for new grants.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate("/grants/new")}
          sx={{
            textTransform: "none",
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "center" },
            px: 2.5,
            py: 1.1,
          }}
        >
          Apply for Grant
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
