import { Box, Button, Typography, alpha } from "@mui/material";
import { AccountBalanceWallet, ArrowBack } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDotForge } from "../hooks/useDotForge";
import OrganizationForm, {
  type OrganizationDraft,
} from "../components/organizations/OrganizationForm";
import OrganizationPreview from "../components/organizations/OrganizationPreview";
import { saveOrg } from "../utils/localStore";

const emptyDraft: OrganizationDraft = {
  name: "",
  handle: "",
  description: "",
  category: "Infrastructure",
  avatarColor: "#E6007A",
};

export default function NewOrganization() {
  const navigate = useNavigate();
  const { isConnected, connect, isConnecting, service } = useDotForge();

  const [draft, setDraft] = useState<OrganizationDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Submitting transaction…");
    try {
      const { result: orgId, hash } = await service.createOrg();

      saveOrg({
        ...draft,
        orgId: orgId.toString(),
        txHash: hash,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Organization #${orgId} created`, { id: toastId });
      navigate("/organizations");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/organizations");
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
          onClick={() => navigate("/organizations")}
          sx={{
            textTransform: "none",
            color: "text.secondary",
            mb: 1.5,
            pl: 0,
            "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
          }}
        >
          Back to organizations
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create organization
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Register a new organization on-chain. Profile details are stored
          locally for now and can be moved to a backend or IPFS later.
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
              Connect your wallet to submit the createOrg transaction on Polkadot Hub Testnet.
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
          <OrganizationForm
            draft={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
            disabled={!isConnected}
          />
        </Box>

        <OrganizationPreview draft={draft} />
      </Box>
    </Box>
  );
}
