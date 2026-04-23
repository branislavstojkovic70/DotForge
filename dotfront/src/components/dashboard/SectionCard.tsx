import { Box, Button, Card, CardContent, Typography, alpha } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
};

export default function SectionCard({ title, subtitle, action, children }: Props) {
  return (
    <Card
      sx={{
        height: "100%",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && (
            <Button
              size="small"
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              onClick={action.onClick}
              sx={{ textTransform: "none", flexShrink: 0 }}
            >
              {action.label}
            </Button>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
