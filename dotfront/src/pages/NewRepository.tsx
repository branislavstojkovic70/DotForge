import { Box, Button, Typography, alpha } from "@mui/material";
import {
  AccountBalanceWallet,
  Apartment,
  ArrowBack,
} from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDotForge } from "../hooks/useDotForge";
import RepositoryForm, {
  type RepositoryDraft,
} from "../components/repositories/RepositoryForm";
import RepositoryPreview from "../components/repositories/RepositoryPreview";
import { getStoredOrgs, saveRepo } from "../utils/localStore";

const makeEmptyDraft = (orgId: string): RepositoryDraft => ({
  orgId,
  name: "",
  description: "",
  language: "Rust",
  visibility: "Public",
  topics: [],
});

export default function NewRepository() {
  const navigate = useNavigate();
  const { isConnected, connect, isConnecting, service } = useDotForge();

  const orgs = useMemo(() => getStoredOrgs(), []);
  const [draft, setDraft] = useState<RepositoryDraft>(() =>
    makeEmptyDraft(orgs[0]?.orgId ?? "")
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.orgId === draft.orgId) ?? null,
    [orgs, draft.orgId]
  );

  const handleSubmit = async () => {
    if (!selectedOrg) return;
    setSubmitting(true);
    const toastId = toast.loading("Submitting transaction…");
    try {
      const orgIdBigint = BigInt(selectedOrg.orgId);
      const { result: repoId, hash } = await service.createRepo(orgIdBigint);

      saveRepo({
        repoId: repoId.toString(),
        orgId: selectedOrg.orgId,
        name: draft.name,
        description: draft.description,
        language: draft.language,
        visibility: draft.visibility,
        topics: draft.topics,
        txHash: hash,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Repository #${repoId} created`, { id: toastId });
      navigate("/repositories");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create repository";
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/repositories");
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
          onClick={() => navigate("/repositories")}
          sx={{
            textTransform: "none",
            color: "text.secondary",
            mb: 1.5,
            pl: 0,
            "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
          }}
        >
          Back to repositories
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create repository
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Register a new repository under one of your organizations. The
          contract assigns a numeric repository ID on success.
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
              Connect your wallet to submit the createRepo transaction.
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
              Repositories live under an organization. Create one first.
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
          <RepositoryForm
            draft={draft}
            orgs={orgs}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
            disabled={!isConnected || orgs.length === 0}
          />
        </Box>

        <RepositoryPreview draft={draft} org={selectedOrg} />
      </Box>
    </Box>
  );
}
