import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  AccountBalanceWallet,
  Close,
  Edit,
  GroupAdd,
  ShieldOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import toast from "react-hot-toast";
import { useDotForge } from "../../hooks/useDotForge";
import {
  ROLE_TO_ID,
  saveMember,
  type MemberRole,
} from "../../utils/localStore";

type AssignableRole = Exclude<MemberRole, "Auditor">;

type Props = {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  onSuccess?: (result: {
    address: Address;
    role: AssignableRole;
    hash: string;
  }) => void;
};

const ROLE_OPTIONS: {
  value: AssignableRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "Owner",
    label: "Owner",
    description: "Full control: can add members, create grants and repos.",
    icon: <ShieldOutlined sx={{ fontSize: 16 }} />,
    color: "#FF4AA6",
  },
  {
    value: "Editor",
    label: "Editor",
    description: "Can create repositories and push commits.",
    icon: <Edit sx={{ fontSize: 16 }} />,
    color: "#58AD95",
  },
  {
    value: "Reader",
    label: "Reader",
    description: "Read-only access to repos and grants.",
    icon: <VisibilityOutlined sx={{ fontSize: 16 }} />,
    color: "#64B5F6",
  },
];

export default function AddMemberDialog({
  open,
  onClose,
  orgId,
  orgName,
  onSuccess,
}: Props) {
  const { isConnected, connect, isConnecting, service, account } = useDotForge();

  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<AssignableRole>("Editor");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAddress("");
    setLabel("");
    setRole("Editor");
    setSubmitting(false);
  }, [open]);

  const addressValid = useMemo(
    () => address.trim().length > 0 && isAddress(address.trim()),
    [address]
  );

  const selfInvite = useMemo(
    () =>
      account &&
      address.trim().toLowerCase() === account.toLowerCase(),
    [account, address]
  );

  const canSubmit =
    isConnected && addressValid && !selfInvite && !submitting;

  const handleSubmit = async () => {
    if (!addressValid) return;
    setSubmitting(true);
    const toastId = toast.loading("Submitting transaction…");
    const trimmed = address.trim() as Address;
    const roleId = ROLE_TO_ID[role];

    console.group(
      `[AddMemberDialog] addMember org=${orgId} addr=${trimmed} role=${role}(${roleId})`
    );

    try {
      const orgIdBigint = BigInt(orgId);

      const myRole = account
        ? await service.getMemberRole(orgIdBigint, account)
        : 0;
      console.log("caller role:", myRole);

      if (myRole !== 1) {
        throw new Error(
          `Only Owner (role=1) can add members. Your role is ${myRole}.`
        );
      }

      const { hash } = await service.addMember(
        orgIdBigint,
        trimmed,
        roleId
      );
      console.log("addMember ok:", hash);

      saveMember({
        orgId,
        address: trimmed,
        role,
        label: label.trim() || undefined,
        txHash: hash,
        addedBy: account ?? "0x0",
        createdAt: new Date().toISOString(),
      });

      toast.success(`${role} invited to ${orgName}`, { id: toastId });
      onSuccess?.({ address: trimmed, role, hash });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add member";
      console.error("[AddMemberDialog] addMember failed:", err);
      toast.error(message, { id: toastId });
    } finally {
      console.groupEnd();
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#1E1E1E",
            border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: alpha("#B388FF", 0.15),
            color: "#B388FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GroupAdd />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Invite member
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            To {orgName} · #{orgId}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={submitting}
          sx={{ color: "text.secondary" }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
            >
              Wallet address
            </Typography>
            <TextField
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x…"
              size="small"
              fullWidth
              error={address.length > 0 && !addressValid}
              helperText={
                address.length === 0
                  ? "EVM address (0x…) of the new member."
                  : !addressValid
                    ? "Enter a valid 0x address."
                    : selfInvite
                      ? "You cannot add yourself."
                      : "Address looks good."
              }
              slotProps={{
                htmlInput: { style: { fontFamily: "monospace" } },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
            >
              Display name (optional)
            </Typography>
            <TextField
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Alice"
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 40 } }}
              helperText="Shown locally to help identify the member."
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
            >
              Role
            </Typography>
            <TextField
              select
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableRole)}
              size="small"
              fullWidth
            >
              {ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: alpha(opt.color, 0.15),
                        color: opt.color,
                      }}
                    >
                      {opt.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {opt.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {opt.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {addressValid && !selfInvite && (
            <>
              <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha("#FFFFFF", 0.03),
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                }}
              >
                <Row label="Organization" value={`${orgName} · #${orgId}`} />
                <Row
                  label="Member"
                  value={`${address.slice(0, 8)}…${address.slice(-6)}`}
                />
                <Row label="Role" value={`${role} (id ${ROLE_TO_ID[role]})`} />
                <Row label="Network" value="Polkadot Hub Testnet" />
              </Box>
            </>
          )}

          {!isConnected && (
            <Button
              variant="outlined"
              fullWidth
              disabled={isConnecting}
              startIcon={
                isConnecting ? (
                  <CircularProgress size={16} sx={{ color: "inherit" }} />
                ) : (
                  <AccountBalanceWallet />
                )
              }
              onClick={() => connect().catch(() => undefined)}
              sx={{
                textTransform: "none",
                borderColor: alpha("#FFFFFF", 0.15),
                color: "#F5F5F5",
              }}
            >
              {isConnecting ? "Connecting…" : "Connect wallet to continue"}
            </Button>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={
            submitting ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : undefined
          }
          sx={{ textTransform: "none", px: 3 }}
        >
          {submitting ? "Inviting…" : "Invite member"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}
