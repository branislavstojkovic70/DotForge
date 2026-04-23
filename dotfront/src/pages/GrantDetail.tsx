import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  AccountBalance,
  Apartment,
  ArrowBack,
  CalendarToday,
  CheckCircle,
  Close,
  ContentCopy,
  FlagOutlined,
  GavelOutlined,
  Groups,
  Launch,
  Paid,
  PersonAddAlt1,
  RadioButtonUnchecked,
  Send,
  ShieldOutlined,
  ThumbDown,
  ThumbUp,
  Verified,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import type { Address } from "viem";
import { isAddress } from "viem";
import {
  formatDot,
  useGrants,
  type GrantDetail as GrantDetailType,
  type GrantStatus,
} from "../hooks/useGrants";
import { useActivity } from "../hooks/useActivity";
import { useDotForge } from "../hooks/useDotForge";
import { useStoredGrants } from "../hooks/useStoredData";
import ActivityEventRow from "../components/activity/ActivityEventRow";
import {
  getStoredGrant,
  updateStoredGrant,
  type StoredGrant,
} from "../utils/localStore";

function shortHash(hash: string): string {
  if (!hash) return "—";
  if (hash.length < 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function shortAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const STATUS_LABEL: Record<number, string> = {
  0: "Created · unassigned",
  1: "Assigned · in progress",
  2: "Submitted · pending verdict",
  3: "Approved",
  4: "Rejected",
};

const statusChipStyles: Record<GrantStatus, { bg: string; fg: string }> = {
  Active: { bg: alpha("#58AD95", 0.18), fg: "#58AD95" },
  "Under Review": { bg: alpha("#FFC107", 0.18), fg: "#FFC107" },
  Completed: { bg: alpha("#64B5F6", 0.18), fg: "#64B5F6" },
  Draft: { bg: alpha("#BCBDBE", 0.15), fg: "#BCBDBE" },
  Rejected: { bg: alpha("#FF5252", 0.15), fg: "#FF5252" },
};

export default function GrantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allGrants } = useGrants();
  const { allEvents } = useActivity();
  const { service, account, isConnected, connect } = useDotForge();
  const storedGrants = useStoredGrants();

  const grant = useMemo<GrantDetailType | undefined>(
    () => allGrants.find((g) => g.id === id),
    [allGrants, id]
  );

  const chainId = useMemo(() => {
    if (!id) return null;
    const match = /^grant-chain-(\d+)$/.exec(id);
    if (!match) return null;
    const numeric = match[1];
    if (storedGrants.some((g) => g.grantId === numeric)) return numeric;
    return null;
  }, [id, storedGrants]);

  const storedGrant = useMemo<StoredGrant | null>(
    () => (chainId ? getStoredGrant(chainId) : null),
    [chainId, storedGrants]
  );

  const events = useMemo(
    () => (grant ? allEvents.filter((e) => e.repo === grant.title || e.organization === grant.organization).slice(0, 8) : []),
    [allEvents, grant]
  );

  const [onChainStatus, setOnChainStatus] = useState<number | null>(null);
  const [onChainAmount, setOnChainAmount] = useState<bigint | null>(null);
  const [onChainOrg, setOnChainOrg] = useState<bigint | null>(null);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  const refreshChain = useCallback(async () => {
    if (!chainId) return;
    try {
      const grantIdBigint = BigInt(chainId);
      const [st, amt, org] = await Promise.all([
        service.getGrantStatus(grantIdBigint),
        service.getGrantAmount(grantIdBigint),
        service.getGrantOrg(grantIdBigint),
      ]);
      setOnChainStatus(st);
      setOnChainAmount(amt);
      setOnChainOrg(org);
      setOnChainError(null);
      if (storedGrant && storedGrant.statusCode !== st) {
        updateStoredGrant(chainId, { statusCode: st });
      }
    } catch (err) {
      setOnChainError(err instanceof Error ? err.message : "chain read failed");
    }
  }, [chainId, service, storedGrant]);

  useEffect(() => {
    void refreshChain();
  }, [refreshChain]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState<"assign" | "submit" | "approve" | "reject" | null>(null);

  if (!grant) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 6, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Grant not found
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          The grant you're looking for doesn't exist or hasn't been indexed yet.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/grants")}
          sx={{ textTransform: "none" }}
        >
          Back to grants
        </Button>
      </Box>
    );
  }

  const statusStyle = statusChipStyles[grant.status];
  const completedMs = grant.milestones.filter((m) => m.completed).length;

  const isOwner =
    !!storedGrant &&
    !!account &&
    storedGrant.createdBy.toLowerCase() === account.toLowerCase();
  const isAssignee =
    !!storedGrant?.assignee &&
    !!account &&
    storedGrant.assignee.toLowerCase() === account.toLowerCase();

  const canAssign = !!chainId && isOwner && onChainStatus === 0;
  const canSubmit = !!chainId && isAssignee && onChainStatus === 1;
  const canVerdict = !!chainId && onChainStatus === 2;

  const handleAssign = async (assignee: Address) => {
    if (!chainId) return;
    setBusy("assign");
    const toastId = toast.loading("Assigning grant…");
    try {
      const { hash } = await service.assignGrant(BigInt(chainId), assignee);
      updateStoredGrant(chainId, {
        assignee,
        assignedTxHash: hash,
        assignedAt: new Date().toISOString(),
        statusCode: 1,
      });
      toast.success("Grant assigned", { id: toastId });
      setAssignOpen(false);
      await refreshChain();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed", {
        id: toastId,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (!chainId) return;
    setBusy("submit");
    const toastId = toast.loading("Submitting grant for review…");
    try {
      const { hash } = await service.submitGrant(BigInt(chainId));
      updateStoredGrant(chainId, {
        submittedTxHash: hash,
        submittedAt: new Date().toISOString(),
        statusCode: 2,
      });
      toast.success("Submitted for review", { id: toastId });
      await refreshChain();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed", {
        id: toastId,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleVerdict = async (approved: boolean) => {
    if (!chainId) return;
    setBusy(approved ? "approve" : "reject");
    const toastId = toast.loading(
      approved ? "Approving grant…" : "Rejecting grant…"
    );
    try {
      const { hash } = await service.submitVerdict(
        BigInt(chainId),
        approved
      );
      updateStoredGrant(chainId, {
        verdictTxHash: hash,
        verdictAt: new Date().toISOString(),
        statusCode: approved ? 3 : 4,
      });
      toast.success(approved ? "Grant approved" : "Grant rejected", {
        id: toastId,
      });
      await refreshChain();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verdict failed", {
        id: toastId,
      });
    } finally {
      setBusy(null);
    }
  };

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(label))
      .catch(() => toast.error("Copy failed"));
  };

  const totalMilestoneAmount = grant.milestones.reduce(
    (sum, m) => sum + m.amount,
    0
  );

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Button
        size="small"
        startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
        onClick={() => navigate("/grants")}
        sx={{
          textTransform: "none",
          color: "text.secondary",
          alignSelf: "flex-start",
          pl: 0,
          "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
        }}
      >
        Back to grants
      </Button>

      {/* Hero */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          backgroundColor: "#1E1E1E",
          border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2.5,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <Avatar
            sx={{
              bgcolor: grant.organizationColor,
              color: "#141414",
              fontWeight: 700,
              width: 64,
              height: 64,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {grant.organization.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                size="small"
                label={grant.category}
                sx={{
                  backgroundColor: alpha(grant.organizationColor, 0.15),
                  color: grant.organizationColor,
                  border: `1px solid ${alpha(grant.organizationColor, 0.35)}`,
                  fontWeight: 600,
                }}
              />
              <Chip
                size="small"
                label={grant.status}
                sx={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.fg,
                  fontWeight: 600,
                }}
              />
              {chainId ? (
                <Chip
                  size="small"
                  icon={<Verified sx={{ fontSize: 14, color: "#58AD95" }} />}
                  label="On-chain"
                  sx={{
                    backgroundColor: alpha("#58AD95", 0.12),
                    color: "#58AD95",
                    fontWeight: 600,
                    ".MuiChip-icon": { color: "#58AD95" },
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  label="Mock"
                  sx={{
                    backgroundColor: alpha("#BCBDBE", 0.12),
                    color: "#BCBDBE",
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75 }}>
              {grant.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", lineHeight: 1.6, mb: 1.5 }}
            >
              {grant.description}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <HeroMeta icon={<Apartment sx={{ fontSize: 14 }} />}>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { color: "#E6007A" },
                  }}
                  onClick={() => {
                    const orgId = storedGrant?.orgId;
                    if (orgId) navigate(`/organizations/${orgId}`);
                  }}
                >
                  {grant.organization}
                </Typography>
              </HeroMeta>
              <HeroMeta icon={<Groups sx={{ fontSize: 14 }} />}>
                {grant.teamSize} team
              </HeroMeta>
              <HeroMeta icon={<CalendarToday sx={{ fontSize: 14 }} />}>
                Applied {grant.appliedAt}
              </HeroMeta>
              {grant.deadline !== "—" && (
                <HeroMeta icon={<CalendarToday sx={{ fontSize: 14 }} />}>
                  Due {grant.deadline}
                </HeroMeta>
              )}
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}
          >
            {canAssign && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddAlt1 />}
                onClick={() => setAssignOpen(true)}
                disabled={busy === "assign"}
                sx={{ textTransform: "none" }}
              >
                Assign grant
              </Button>
            )}
            {canSubmit && (
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  busy === "submit" ? (
                    <CircularProgress size={14} sx={{ color: "inherit" }} />
                  ) : (
                    <Send />
                  )
                }
                onClick={handleSubmit}
                disabled={!!busy}
                sx={{ textTransform: "none" }}
              >
                Submit for review
              </Button>
            )}
            {canVerdict && (
              <>
                <Button
                  variant="contained"
                  startIcon={
                    busy === "approve" ? (
                      <CircularProgress size={14} sx={{ color: "inherit" }} />
                    ) : (
                      <ThumbUp />
                    )
                  }
                  onClick={() => handleVerdict(true)}
                  disabled={!!busy}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#58AD95",
                    "&:hover": { backgroundColor: "#4A9680" },
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    busy === "reject" ? (
                      <CircularProgress size={14} sx={{ color: "inherit" }} />
                    ) : (
                      <ThumbDown />
                    )
                  }
                  onClick={() => handleVerdict(false)}
                  disabled={!!busy}
                  sx={{
                    textTransform: "none",
                    borderColor: alpha("#FF5252", 0.4),
                    color: "#FF5252",
                    "&:hover": {
                      borderColor: "#FF5252",
                      backgroundColor: alpha("#FF5252", 0.08),
                    },
                  }}
                >
                  Reject
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {!isConnected && chainId && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha("#FFC107", 0.08),
              border: `1px solid ${alpha("#FFC107", 0.25)}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="caption" sx={{ color: "#FFC107", flex: 1 }}>
              Connect your wallet to take lifecycle actions on this grant.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => connect().catch(() => undefined)}
              sx={{
                textTransform: "none",
                borderColor: alpha("#FFC107", 0.5),
                color: "#FFC107",
                "&:hover": { borderColor: "#FFC107" },
              }}
            >
              Connect wallet
            </Button>
          </Box>
        )}
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        <StatCard
          icon={<Paid sx={{ fontSize: 18 }} />}
          label="Requested"
          value={`${formatDot(grant.amountRequested)} ${grant.currency}`}
          color="#E6007A"
        />
        <StatCard
          icon={<AccountBalance sx={{ fontSize: 18 }} />}
          label="Paid out"
          value={`${formatDot(grant.amountPaid)} ${grant.currency}`}
          hint={
            grant.amountRequested > 0
              ? `${Math.round((grant.amountPaid / grant.amountRequested) * 100)}%`
              : undefined
          }
          color="#58AD95"
        />
        <StatCard
          icon={<FlagOutlined sx={{ fontSize: 18 }} />}
          label="Milestones"
          value={`${completedMs}/${grant.milestones.length}`}
          hint={
            grant.milestones.length > 0
              ? `${formatDot(totalMilestoneAmount)} ${grant.currency} total`
              : "No milestones"
          }
          color="#B388FF"
        />
        <StatCard
          icon={<GavelOutlined sx={{ fontSize: 18 }} />}
          label="Chain status"
          value={onChainStatus !== null ? STATUS_LABEL[onChainStatus] ?? `#${onChainStatus}` : chainId ? "Loading…" : "Off-chain"}
          color="#64B5F6"
        />
      </Box>

      {/* Progress */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: "#1E1E1E",
          border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Overall progress
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#E6007A" }}>
            {grant.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={grant.progress}
          sx={{
            height: 8,
            borderRadius: 999,
            backgroundColor: alpha("#FFFFFF", 0.06),
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#E6007A",
              borderRadius: 999,
            },
          }}
        />
      </Box>

      {/* Main grid */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 380px" },
          alignItems: "flex-start",
        }}
      >
        {/* Milestones */}
        <Section title="Milestones" count={grant.milestones.length}>
          {grant.milestones.length === 0 ? (
            <EmptyState
              icon={<FlagOutlined sx={{ fontSize: 28, color: "text.secondary" }} />}
              title="No milestones defined"
              description="This grant doesn't break work into milestones."
            />
          ) : (
            <Stack spacing={1.25}>
              {grant.milestones.map((m, idx) => (
                <Box
                  key={m.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.75,
                    borderRadius: 2,
                    backgroundColor: alpha(
                      "#FFFFFF",
                      m.completed ? 0.04 : 0.02
                    ),
                    border: `1px solid ${alpha(
                      m.completed ? "#58AD95" : "#FFFFFF",
                      m.completed ? 0.2 : 0.05
                    )}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: m.completed
                        ? alpha("#58AD95", 0.2)
                        : alpha("#FFFFFF", 0.05),
                      color: m.completed ? "#58AD95" : "text.secondary",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {m.completed ? <CheckCircle sx={{ fontSize: 18 }} /> : idx + 1}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        textDecoration: m.completed ? "none" : "none",
                        color: m.completed ? "text.primary" : "text.primary",
                      }}
                    >
                      {m.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      Milestone {idx + 1} ·{" "}
                      {m.completed ? "Completed" : "Pending"}
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: m.completed ? "#58AD95" : "text.primary" }}
                  >
                    {formatDot(m.amount)} {grant.currency}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Section>

        {/* Right column: on-chain + lifecycle + activity */}
        <Stack spacing={3}>
          <InfoPanel title="On-chain details">
            {chainId ? (
              <Stack spacing={1.25}>
                <InfoRow label="Grant ID" value={`#${chainId}`} />
                <InfoRow
                  label="Organization ID"
                  value={
                    onChainOrg !== null
                      ? `#${onChainOrg.toString()}`
                      : storedGrant?.orgId
                        ? `#${storedGrant.orgId}`
                        : "—"
                  }
                />
                <InfoRow
                  label="Status code"
                  value={
                    onChainStatus !== null
                      ? `${onChainStatus} · ${STATUS_LABEL[onChainStatus] ?? "?"}`
                      : "loading…"
                  }
                />
                <InfoRow
                  label="Amount (raw)"
                  value={
                    onChainAmount !== null
                      ? onChainAmount.toString()
                      : storedGrant?.amount ?? "—"
                  }
                />
                {storedGrant?.assignee && (
                  <InfoRow
                    label="Assignee"
                    value={shortAddr(storedGrant.assignee)}
                    onCopy={() => copy(storedGrant.assignee!, "Assignee copied")}
                  />
                )}
                {storedGrant?.createdBy && (
                  <InfoRow
                    label="Created by"
                    value={shortAddr(storedGrant.createdBy)}
                    onCopy={() =>
                      copy(storedGrant.createdBy, "Creator address copied")
                    }
                  />
                )}
                {storedGrant?.txHash && (
                  <InfoRow
                    label="Create tx"
                    value={shortHash(storedGrant.txHash)}
                    onCopy={() => copy(storedGrant.txHash, "Tx hash copied")}
                  />
                )}
                {onChainError && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#FF5252", mt: 0.5 }}
                  >
                    {onChainError}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontStyle: "italic" }}
              >
                This is a showcase grant not yet anchored on-chain.
              </Typography>
            )}
          </InfoPanel>

          <InfoPanel title="Lifecycle">
            <Stack spacing={1.5}>
              <LifecycleStep
                n={1}
                label="Created"
                description="Owner submits createGrant(orgId, amount)"
                active={(onChainStatus ?? 0) >= 0}
                done={(onChainStatus ?? 0) >= 1}
              />
              <LifecycleStep
                n={2}
                label="Assigned"
                description="Owner picks a builder to own delivery"
                active={onChainStatus === 1}
                done={(onChainStatus ?? 0) >= 2}
              />
              <LifecycleStep
                n={3}
                label="Submitted"
                description="Assignee submits completed work"
                active={onChainStatus === 2}
                done={(onChainStatus ?? 0) >= 3}
              />
              <LifecycleStep
                n={4}
                label="Verdict"
                description="Registered auditor approves or rejects"
                active={onChainStatus === 2}
                done={(onChainStatus ?? 0) >= 3}
                accent={
                  onChainStatus === 4
                    ? "#FF5252"
                    : onChainStatus === 3
                      ? "#58AD95"
                      : undefined
                }
                terminal={onChainStatus === 4 ? "Rejected" : onChainStatus === 3 ? "Approved" : undefined}
              />
            </Stack>
          </InfoPanel>

          {events.length > 0 && (
            <Section title="Related activity" count={events.length}>
              <Stack spacing={1}>
                {events.slice(0, 6).map((event) => (
                  <ActivityEventRow key={event.id} event={event} />
                ))}
              </Stack>
            </Section>
          )}
        </Stack>
      </Box>

      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSubmit={handleAssign}
        busy={busy === "assign"}
        grantTitle={grant.title}
      />
    </Box>
  );
}

function HeroMeta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 500 }}>
        {children}
      </Typography>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        alignItems: "center",
        gap: 1.75,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          backgroundColor: alpha(color, 0.15),
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
          {label}
          {hint ? ` · ${hint}` : ""}
        </Typography>
      </Box>
    </Box>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {typeof count === "number" && (
            <Chip
              size="small"
              label={count}
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: alpha("#FFFFFF", 0.06),
                color: "text.secondary",
              }}
            />
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.6,
          color: "text.secondary",
          textTransform: "uppercase",
          display: "block",
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  href,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  href?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontFamily: "monospace",
            textAlign: "right",
          }}
          noWrap
        >
          {value}
        </Typography>
        {onCopy && (
          <Tooltip title="Copy">
            <IconButton size="small" onClick={onCopy} sx={{ color: "text.secondary", p: 0.25 }}>
              <ContentCopy sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
        {href && (
          <Tooltip title="Open">
            <IconButton
              size="small"
              component="a"
              href={href}
              target="_blank"
              rel="noreferrer"
              sx={{ color: "text.secondary", p: 0.25 }}
            >
              <Launch sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

function LifecycleStep({
  n,
  label,
  description,
  active,
  done,
  accent,
  terminal,
}: {
  n: number;
  label: string;
  description: string;
  active: boolean;
  done: boolean;
  accent?: string;
  terminal?: string;
}) {
  const color = accent ?? (done ? "#58AD95" : active ? "#FFC107" : "#555");
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          backgroundColor: alpha(color, 0.15),
          color,
          fontWeight: 700,
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `1px solid ${alpha(color, 0.4)}`,
        }}
      >
        {done ? <CheckCircle sx={{ fontSize: 14 }} /> : n}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {terminal && (
            <Chip
              size="small"
              label={terminal}
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: alpha(color, 0.15),
                color,
              }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px dashed ${alpha("#FFFFFF", 0.1)}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1,
      }}
    >
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", maxWidth: 340 }}>
        {description}
      </Typography>
    </Box>
  );
}

function AssignDialog({
  open,
  onClose,
  onSubmit,
  busy,
  grantTitle,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (addr: Address) => void;
  busy: boolean;
  grantTitle: string;
}) {
  const [addr, setAddr] = useState("");

  useEffect(() => {
    if (!open) setAddr("");
  }, [open]);

  const valid = addr.trim().length > 0 && isAddress(addr.trim());

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
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
        sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: alpha("#E6007A", 0.15),
            color: "#E6007A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PersonAddAlt1 />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Assign grant
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {grantTitle}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={busy}
          sx={{ color: "text.secondary" }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
        >
          Assignee wallet
        </Typography>
        <TextField
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="0x…"
          size="small"
          fullWidth
          error={addr.length > 0 && !valid}
          helperText={
            addr.length === 0
              ? "The builder responsible for delivering this grant."
              : !valid
                ? "Enter a valid 0x address."
                : "Address looks good."
          }
          slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
        />
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha("#B388FF", 0.08),
            border: `1px solid ${alpha("#B388FF", 0.2)}`,
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <ShieldOutlined sx={{ fontSize: 16, color: "#B388FF", mt: 0.25 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Only Owners of the grant's organization can assign. The contract
            rejects assignments on grants that are already in progress.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSubmit(addr.trim() as Address)}
          disabled={!valid || busy}
          startIcon={
            busy ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : undefined
          }
          sx={{ textTransform: "none", px: 3 }}
        >
          {busy ? "Assigning…" : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
