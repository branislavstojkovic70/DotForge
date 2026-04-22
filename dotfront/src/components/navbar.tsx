import {
  AppBar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AccountBalanceWallet,
  Apartment,
  FiberManualRecord,
  FolderOutlined,
  GridView,
  Menu as MenuIcon,
  Paid,
  Timeline,
} from "@mui/icons-material";
import { useState } from "react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

export default function Navbar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <GridView />, path: "/" },
    { label: "Organizations", icon: <Apartment />, path: "/organizations" },
    { label: "Repositories", icon: <FolderOutlined />, path: "/repositories" },
    { label: "Grants", icon: <Paid />, path: "/grants" },
    { label: "Activity", icon: <Timeline />, path: "/activity" },
  ];

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
  };

  const handleConnectWallet = () => {
    navigate("/connect");
  };

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="relative" sx={{ flex: "0 1 auto" }}>
        <Toolbar
          sx={{
            minHeight: "64px",
            px: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Logo levo */}
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: 1,
              flex: "1 1 0%",
            }}
          >
            <img
              src="/dotforgee.png"
              alt="DotForge Logo"
              style={{ height: 40, width: "auto", display: "block" }}
            />
            <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.3 }}>
              DotForge
            </Typography>
          </Box>

          {/* Centralni meni */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
              flex: "2 1 0%",
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                startIcon={item.icon}
                onClick={() => handleNavClick(item)}
                sx={{ color: "#F5F5F5", textTransform: "capitalize" }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Desno: wallet + network badge (desktop) / burger (mobile) */}
          <Box
            sx={{
              flex: "1 1 0%",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {!isMobile && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AccountBalanceWallet />}
                  onClick={handleConnectWallet}
                  sx={{ textTransform: "none" }}
                >
                  Connect Wallet
                </Button>
                <Chip
                  icon={<FiberManualRecord sx={{ fontSize: 10, color: "#58AD95 !important" }} />}
                  label="Paseo testnet"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "#FFFFFF",
                    fontWeight: 500,
                    ".MuiChip-icon": { ml: 1 },
                  }}
                />
              </>
            )}
            {isMobile && (
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer za mobile */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {navItems.map((item) => (
              // @ts-ignore
              <ListItem
                button
                key={item.label}
                // @ts-ignore
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerOpen(false);
                  handleNavClick(item);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            {/* @ts-ignore */}
            <ListItem
              button
              // @ts-ignore
              onClick={(e) => {
                e.stopPropagation();
                setDrawerOpen(false);
                handleConnectWallet();
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet />
              </ListItemIcon>
              <ListItemText primary="Connect Wallet" />
            </ListItem>
          </List>
          <Box sx={{ px: 2, pb: 2 }}>
            <Chip
              icon={<FiberManualRecord sx={{ fontSize: 10, color: "#58AD95 !important" }} />}
              label="Paseo testnet"
              size="small"
              sx={{ width: "100%", justifyContent: "flex-start" }}
            />
          </Box>
        </Box>
      </Drawer>

      <div id="detail" style={{ flex: "1 1 auto", width: "100%" }}>
        <Outlet />
      </div>
    </Box>
  );
}
