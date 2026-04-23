import { Box, Typography, alpha } from "@mui/material";
import { Apartment, Commit, Paid, Timeline } from "@mui/icons-material";
import type { ReactNode } from "react";

type Totals = {
  total: number;
  commits: number;
  grantsAwarded: number;
  organizations: number;
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

export default function ActivityHeader({ totals }: Props) {
  const summary: SummaryItem[] = [
    {
      label: "Total events",
      value: totals.total.toString(),
      icon: <Timeline sx={{ fontSize: 18 }} />,
      color: "#E6007A",
    },
    {
      label: "Commits",
      value: totals.commits.toString(),
      icon: <Commit sx={{ fontSize: 18 }} />,
      color: "#64B5F6",
    },
    {
      label: "Grants paid",
      value: totals.grantsAwarded.toString(),
      icon: <Paid sx={{ fontSize: 18 }} />,
      color: "#58AD95",
    },
    {
      label: "Active orgs",
      value: totals.organizations.toString(),
      icon: <Apartment sx={{ fontSize: 18 }} />,
      color: "#FFC107",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Activity
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Every commit, grant and organization event across DotForge.
        </Typography>
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
