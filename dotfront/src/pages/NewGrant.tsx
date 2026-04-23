import { Box, Button, Typography, alpha } from "@mui/material";
import {
  AccountBalanceWallet,
  Apartment,
  ArrowBack,
} from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDotForge } from "../hooks/useDotForge";
import GrantForm, {
  type GrantDraft,
} from "../components/grants/GrantForm";
import GrantPreview from "../components/grants/GrantPreview";
import { getStoredOrgs, saveGrant } from "../utils/localStore";

const GRANT_FEE = 100_000_000n;
const ROLE_LABEL: Record<number, string> = {
  0: "None",
  1: "Owner",
  2: "Editor",
  3: "Reader",
  4: "Auditor",
};

const makeEmptyDraft = (orgId: string): GrantDraft => ({
  orgId,
  title: "",
  description: "",
  category: "Infrastructure",
  amount: "",
  currency: "DOT",
  deadline: "",
  teamSize: 1,
  milestones: [],
});

export default function NewGrant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, connect, isConnecting, service, account } = useDotForge();

  const orgs = useMemo(() => getStoredOrgs(), []);
  const preselectedOrgId = (location.state as { orgId?: string } | null)?.orgId;

  const [draft, setDraft] = useState<GrantDraft>(() => {
    const initialOrg =
      (preselectedOrgId && orgs.find((o) => o.orgId === preselectedOrgId)?.orgId) ||
      orgs[0]?.orgId ||
      "";
    return makeEmptyDraft(initialOrg);
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.orgId === draft.orgId) ?? null,
    [orgs, draft.orgId]
  );

  const handleSubmit = async () => {
    if (!selectedOrg) return;
    const amountNum = BigInt(Math.floor(Number(draft.amount)));
    if (amountNum <= 0n) {
      toast.error("Amount must be greater than zero");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting transaction…");

    console.group(
      `[NewGrant] submit createGrant for org #${selectedOrg.orgId} amount=${amountNum}`
    );
    console.log("draft:", draft);
    console.log("selectedOrg:", selectedOrg);
    console.log("account:", account);

    try {
      const orgIdBigint = BigInt(selectedOrg.orgId);

      console.log("running pre-flight checks…");
      const orgCount = await service.getOrgCount();
      console.log("orgCount on chain:", orgCount.toString());

      if (orgIdBigint > orgCount) {
        throw new Error(
          `Organization #${selectedOrg.orgId} does not exist on chain (orgCount=${orgCount}).`
        );
      }

      const [role, balance] = await Promise.all([
        account
          ? service.getMemberRole(orgIdBigint, account)
          : Promise.resolve(0),
        service.getOrgBalance(orgIdBigint),
      ]);
      console.log("member role:", role, `(${ROLE_LABEL[role] ?? "?"})`);

      const needed = amountNum + GRANT_FEE;
      console.log(
        "org balance:",
        balance.toString(),
        "needed (amount + GRANT_FEE):",
        needed.toString()
      );

      if (role !== 1) {
        throw new Error(
          `Only Owner can create grants. Your role is ${ROLE_LABEL[role] ?? role}.`
        );
      }
      if (balance < needed) {
        throw new Error(
          `Org #${selectedOrg.orgId} needs ${needed} (has ${balance}). Deposit first.`
        );
      }

      console.log("pre-flight ok → calling createGrant…");
      const { result: grantId, hash } = await service.createGrant(
        orgIdBigint,
        amountNum
      );
      console.log("createGrant ok, grantId:", grantId.toString(), "hash:", hash);

      saveGrant({
        grantId: grantId.toString(),
        orgId: selectedOrg.orgId,
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        amount: draft.amount,
        currency: draft.currency,
        deadline: draft.deadline.trim(),
        teamSize: draft.teamSize,
        milestones: draft.milestones
          .filter((m) => m.title.trim())
          .map((m) => ({
            id: m.id,
            title: m.title.trim(),
            amount: Number(m.amount) || 0,
          })),
        txHash: hash,
        createdBy: account ?? "0x0",
        createdAt: new Date().toISOString(),
      });

      toast.success(`Grant #${grantId} created`, { id: toastId });
      navigate("/grants");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create grant";
      console.error("[NewGrant] createGrant failed:", err);
      toast.error(message, { id: toastId });
    } finally {
      console.groupEnd();
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/grants");
  };

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box>
        <Button
          size="small"
          startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
          onClick={() => navigate("/grants")}
          sx={{
            textTransform: "none",
            color: "text.secondary",
            mb: 1.5,
            pl: 0,
            "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
          }}
        >
          Back to grants
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create grant
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Allocate funds from an organization's treasury to sponsor work.
          Grants are identified by a numeric ID assigned by the contract.
        </Typography>
      </Box>

      {!isConnected && (
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            backgroundColor: alpha("#FFC107", 0.08),
            border: `1px solid ${alpha("#FFC107", 0.3)}`,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <AccountBalanceWallet sx={{ color: "#FFC107" }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Wallet required
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Connect your wallet to submit the createGrant transaction.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            disabled={isConnecting}
            startIcon={<AccountBalanceWallet />}
            onClick={() => connect().catch(() => undefined)}
            sx={{ textTransform: "none" }}
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </Button>
        </Box>
      )}

      {orgs.length === 0 && (
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: alpha("#E6007A", 0.08),
            border: `1px solid ${alpha("#E6007A", 0.3)}`,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Apartment sx={{ color: "#FF4AA6", fontSize: 28 }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              No organizations yet
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Grants are funded by an organization's treasury. Create an
              organization first.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/organizations/new")}
            sx={{ textTransform: "none" }}
          >
            Create organization
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 360px" },
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "#1E1E1E",
            border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
          }}
        >
          <GrantForm
            draft={draft}
            orgs={orgs}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
            disabled={!isConnected || orgs.length === 0}
          />
        </Box>

        <GrantPreview draft={draft} org={selectedOrg} />
      </Box>
    </Box>
  );
}
