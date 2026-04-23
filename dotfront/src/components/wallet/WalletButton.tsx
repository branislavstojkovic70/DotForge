import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  alpha,
} from "@mui/material";
import {
  AccountBalanceWallet,
  ContentCopy,
  ExpandMore,
  Logout,
  OpenInNew,
} from "@mui/icons-material";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDotForge } from "../../hooks/useDotForge";

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function addressColor(addr: string): string {
  const palette = ["#E6007A", "#58AD95", "#FFC107", "#64B5F6", "#B388FF", "#FF4AA6"];
  const hash = addr
    .toLowerCase()
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type Props = {
  fullWidth?: boolean;
};

export default function WalletButton({ fullWidth = false }: Props) {
  const { account, isConnected, isConnecting, connect, disconnect } = useDotForge();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      toast.error(message);
    }
  };

  const handleCopy = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account);
    toast.success("Address copied");
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnect();
    setAnchorEl(null);
    toast.success("Disconnected");
  };

  const handleOpenExplorer = () => {
    if (!account) return;
    window.open(
      `https://blockscout-passet-hub.parity-testnet.parity.io/address/${account}`,
      "_blank",
      "noopener,noreferrer"
    );
    setAnchorEl(null);
  };

  if (!isConnected || !account) {
    return (
      <Button
        variant="contained"
        color="primary"
        fullWidth={fullWidth}
        disabled={isConnecting}
        startIcon={
          isConnecting ? (
            <CircularProgress size={16} sx={{ color: "inherit" }} />
          ) : (
            <AccountBalanceWallet />
          )
        }
        onClick={handleConnect}
        sx={{ textTransform: "none", whiteSpace: "nowrap" }}
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const color = addressColor(account);

  return (
    <>
      <Button
        variant="outlined"
        fullWidth={fullWidth}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ExpandMore sx={{ fontSize: 18 }} />}
        sx={{
          textTransform: "none",
          color: "#F5F5F5",
          borderColor: alpha("#FFFFFF", 0.2),
          backgroundColor: alpha("#FFFFFF", 0.08),
          whiteSpace: "nowrap",
          "&:hover": {
            borderColor: alpha("#FFFFFF", 0.4),
            backgroundColor: alpha("#FFFFFF", 0.12),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 20,
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              color: "#141414",
            }}
          >
            {account.slice(2, 3).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
            {shortAddress(account)}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 260,
            backgroundColor: "#1E1E1E",
            border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Connected account
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
            {shortAddress(account)}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Polkadot Hub Testnet
          </Typography>
        </Box>
        <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopy sx={{ fontSize: 18, color: "text.secondary" }} />
          </ListItemIcon>
          Copy address
        </MenuItem>
        <MenuItem onClick={handleOpenExplorer}>
          <ListItemIcon>
            <OpenInNew sx={{ fontSize: 18, color: "text.secondary" }} />
          </ListItemIcon>
          View on explorer
        </MenuItem>
        <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />
        <MenuItem onClick={handleDisconnect} sx={{ color: "#FF5252" }}>
          <ListItemIcon>
            <Logout sx={{ fontSize: 18, color: "#FF5252" }} />
          </ListItemIcon>
          Disconnect
        </MenuItem>
      </Menu>
    </>
  );
}
