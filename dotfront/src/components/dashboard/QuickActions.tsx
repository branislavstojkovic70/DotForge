import { Box, Button, alpha } from "@mui/material";
import { Add, Apartment, FolderOutlined, Paid } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

type Action = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

const actions: Action[] = [
  { label: "New Organization", icon: <Apartment />, path: "/organizations/new" },
  { label: "New Repository", icon: <FolderOutlined />, path: "/repositories/new" },
  { label: "Apply for Grant", icon: <Paid />, path: "/grants/new" },
  { label: "Invite Member", icon: <Add />, path: "/members/invite" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
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
          onClick={() => navigate(action.path)}
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
  );
}
