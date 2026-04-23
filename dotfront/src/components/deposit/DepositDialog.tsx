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
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { AccountBalanceWallet, Close, Paid } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDotForge } from "../../hooks/useDotForge";
import {
  getStoredOrgs,
  saveDeposit,
  type StoredOrg,
} from "../../utils/localStore";

type Props = {
  open: boolean;
  onClose: () => void;
  orgId?: string;
  onSuccess?: (result: { orgId: string; amount: bigint; hash: string }) => void;
};

const PRESETS = [100, 500, 1000, 5000];

function isValidAmount(value: string): boolean {
  if (!value.trim()) return false;
  if (!/^\d+$/.test(value)) return false;
  try {
    const n = BigInt(value);
    return n > 0n && n <= 18_446_744_073_709_551_615n;
  } catch {
    return false;
  }
}

export default function DepositDialog({ open, onClose, orgId, onSuccess }: Props) {
  const { isConnected, connect, isConnecting, service, account } = useDotForge();

  const [orgs, setOrgs] = useState<StoredOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const list = getStoredOrgs();
    setOrgs(list);
    setSelectedOrgId(orgId ?? list[0]?.orgId ?? "");
    setAmount("");
    setSubmitting(false);
  }, [open, orgId]);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.orgId === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  const amountValid = isValidAmount(amount);
  const canSubmit =
    isConnected && selectedOrgId !== "" && amountValid && !submitting;

  const handleSubmit = async () => {
    if (!selectedOrg || !amountValid) return;
    setSubmitting(true);
    const toastId = toast.loading("Submitting deposit…");
    console.group(
      `[DepositDialog] submit deposit org #${selectedOrg.orgId} amount=${amount}`
    );
    console.log("selectedOrg:", selectedOrg);
    console.log("account:", account);
    try {
      const orgIdBigint = BigInt(selectedOrg.orgId);
      const amountBigint = BigInt(amount);

      try {
        const orgCount = await service.getOrgCount();
        console.log("orgCount on chain:", orgCount.toString());
        if (orgIdBigint > orgCount) {
          throw new Error(
            `Organization #${selectedOrg.orgId} does not exist on chain (orgCount=${orgCount}).`
          );
        }
      } catch (preErr) {
        console.warn("pre-flight getOrgCount failed:", preErr);
      }

      const { hash } = await service.deposit(orgIdBigint, amountBigint);
      console.log("deposit ok, hash:", hash);

      saveDeposit({
        depositId: `${selectedOrg.orgId}-${Date.now()}`,
        orgId: selectedOrg.orgId,
        amount: amountBigint.toString(),
        from: account ?? "0x0",
        txHash: hash,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Deposited ${amount} to ${selectedOrg.name}`, { id: toastId });
      onSuccess?.({
        orgId: selectedOrg.orgId,
        amount: amountBigint,
        hash,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit deposit";
      console.error("[DepositDialog] deposit failed:", err);
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
            backgroundColor: alpha("#E6007A", 0.15),
            color: "#FF4AA6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paid />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Deposit to organization
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Funds added to the on-chain org treasury.
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
          {orgs.length === 0 ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha("#FFC107", 0.08),
                border: `1px solid ${alpha("#FFC107", 0.3)}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                No organizations yet
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Create an organization before making a deposit.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
              >
                Organization
              </Typography>
              <TextField
                select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                size="small"
                fullWidth
              >
                {orgs.map((org) => (
                  <MenuItem key={org.orgId} value={org.orgId}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 20,
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: org.avatarColor,
                          color: "#141414",
                        }}
                      >
                        {org.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <span>{org.name}</span>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        #{org.orgId}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
            >
              Amount
            </Typography>
            <TextField
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              size="small"
              fullWidth
              error={amount !== "" && !amountValid}
              helperText={
                amount !== "" && !amountValid
                  ? "Enter a positive integer (uint64)."
                  : "Amount stored on-chain as uint64."
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        units
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1 }}>
              {PRESETS.map((preset) => (
                <Button
                  key={preset}
                  size="small"
                  variant="outlined"
                  onClick={() => setAmount(preset.toString())}
                  sx={{
                    textTransform: "none",
                    minWidth: 0,
                    px: 1.25,
                    borderColor: alpha("#FFFFFF", 0.12),
                    color: "text.secondary",
                    "&:hover": {
                      borderColor: "#E6007A",
                      backgroundColor: alpha("#E6007A", 0.08),
                      color: "#FF4AA6",
                    },
                  }}
                >
                  +{preset}
                </Button>
              ))}
            </Box>
          </Box>

          {selectedOrg && amountValid && (
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
                <Row label="To" value={`${selectedOrg.name} · #${selectedOrg.orgId}`} />
                <Row label="Amount" value={`${amount} units`} />
                {account && (
                  <Row
                    label="From"
                    value={`${account.slice(0, 6)}…${account.slice(-4)}`}
                  />
                )}
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
          {submitting ? "Depositing…" : "Deposit"}
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
