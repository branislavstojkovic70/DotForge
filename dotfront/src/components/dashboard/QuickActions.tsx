import { Box, Button, alpha } from "@mui/material";
import { AccountBalance, Apartment, FolderOutlined, Paid } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DepositDialog from "../deposit/DepositDialog";

type Action = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export default function QuickActions() {
  const navigate = useNavigate();
  const [depositOpen, setDepositOpen] = useState(false);

  const actions: Action[] = [
    {
      label: "New Organization",
      icon: <Apartment />,
      onClick: () => navigate("/organizations/new"),
    },
    {
      label: "New Repository",
      icon: <FolderOutlined />,
      onClick: () => navigate("/repositories/new"),
    },
    {
      label: "Apply for Grant",
      icon: <Paid />,
      onClick: () => navigate("/grants/new"),
    },
    {
      label: "Deposit",
      icon: <AccountBalance />,
      onClick: () => setDepositOpen(true),
    },
  ];

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
        }}
      >
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outlined"
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              py: 1.25,
              borderColor: alpha("#FFFFFF", 0.12),
              color: "#F5F5F5",
              "&:hover": {
                borderColor: "#E6007A",
                backgroundColor: alpha("#E6007A", 0.08),
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      <DepositDialog open={depositOpen} onClose={() => setDepositOpen(false)} />
    </>
  );
}
