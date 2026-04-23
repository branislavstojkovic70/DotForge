import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import {
  AccountBalance,
  ArrowBack,
  Apartment,
  CalendarToday,
  FolderOutlined,
  Launch,
  Paid,
  Public,
  Verified,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrganizations, type OrgRole } from "../hooks/useOrganizations";
import { useRepositories } from "../hooks/useRepositories";
import { useGrants } from "../hooks/useGrants";
import { useActivity } from "../hooks/useActivity";
import { useDotForge } from "../hooks/useDotForge";
import DepositDialog from "../components/deposit/DepositDialog";
import RepositoryRow from "../components/repositories/RepositoryRow";
import GrantCard from "../components/grants/GrantCard";
import ActivityEventRow from "../components/activity/ActivityEventRow";
import { getStoredOrg } from "../utils/localStore";

const roleStyles: Record<OrgRole, { bg: string; fg: string }> = {
  Owner: { bg: alpha("#E6007A", 0.18), fg: "#FF4AA6" },
  Admin: { bg: alpha("#58AD95", 0.18), fg: "#58AD95" },
  Member: { bg: alpha("#64B5F6", 0.18), fg: "#64B5F6" },
  Contributor: { bg: alpha("#BCBDBE", 0.15), fg: "#BCBDBE" },
};

function formatBalance(n: bigint): string {
  const value = Number(n);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allOrganizations } = useOrganizations();
  const { allRepositories } = useRepositories();
  const { allGrants } = useGrants();
  const { allEvents } = useActivity();
  const { service } = useDotForge();

  const [depositOpen, setDepositOpen] = useState(false);
  const [onChainBalance, setOnChainBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const organization = useMemo(
    () => allOrganizations.find((o) => o.id === id),
    [allOrganizations, id]
  );

  const storedOrg = useMemo(() => (id ? getStoredOrg(id) : null), [id]);

  const repos = useMemo(
    () =>
      organization
        ? allRepositories.filter((r) => r.organization === organization.name)
        : [],
    [allRepositories, organization]
  );

  const grants = useMemo(
    () =>
      organization
        ? allGrants.filter((g) => g.organization === organization.name)
        : [],
    [allGrants, organization]
  );

  const events = useMemo(
    () =>
      organization
        ? allEvents.filter((e) => e.organization === organization.name)
        : [],
    [allEvents, organization]
  );

  useEffect(() => {
    if (!organization || organization.source !== "chain" || !id) {
      setOnChainBalance(null);
      return;
    }
    let cancelled = false;
    setBalanceError(null);
    service
      .getOrgBalance(BigInt(id))
      .then((bal) => {
        if (!cancelled) setOnChainBalance(bal);
      })
      .catch((err) => {
        if (!cancelled) {
          setBalanceError(err instanceof Error ? err.message : "Failed to read balance");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [organization, id, service]);

  if (!organization) {
    return (
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 6, md: 8 },
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Organization not found
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
          We couldn't find an organization with id <code>{id}</code>. It may not
          exist yet, or your local cache might be stale.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/organizations")}
          sx={{ textTransform: "none" }}
        >
          Back to organizations
        </Button>
      </Box>
    );
  }

  const role = roleStyles[organization.role];
  const isChain = organization.source === "chain";

  return (
    <Box
      sx={{
        maxWidth: 1280,
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
        onClick={() => navigate("/organizations")}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          color: "text.secondary",
          pl: 0,
          "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
        }}
      >
        Back to organizations
      </Button>

      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 4,
          backgroundColor: "#1E1E1E",
          border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
          p: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 15% 0%, ${alpha(
              organization.avatarColor,
              0.25
            )} 0%, transparent 45%), radial-gradient(circle at 90% 100%, ${alpha(
              organization.avatarColor,
              0.15
            )} 0%, transparent 55%)`,
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 3,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Avatar
              sx={{
                bgcolor: organization.avatarColor,
                color: "#141414",
                fontWeight: 800,
                width: 88,
                height: 88,
                fontSize: 36,
                flexShrink: 0,
              }}
            >
              {organization.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {organization.name}
                </Typography>
                {organization.verified && (
                  <Verified sx={{ fontSize: 22, color: "#64B5F6" }} />
                )}
                <Chip
                  label={organization.role}
                  size="small"
                  sx={{
                    backgroundColor: role.bg,
                    color: role.fg,
                    fontWeight: 600,
                  }}
                />
                {isChain && (
                  <Chip
                    label="On-chain"
                    size="small"
                    sx={{
                      backgroundColor: alpha("#58AD95", 0.15),
                      color: "#58AD95",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  mt: 0.5,
                  color: "text.secondary",
                  alignItems: "center",
                  flexWrap: "wrap",
                  rowGap: 0.5,
                }}
              >
                <Typography variant="body2">{organization.handle}</Typography>
                <Typography variant="body2">·</Typography>
                <Chip
                  label={organization.category}
                  size="small"
                  sx={{
                    backgroundColor: alpha("#FFFFFF", 0.06),
                    color: "text.secondary",
                    fontWeight: 500,
                    height: 22,
                  }}
                />
                <Typography variant="body2">·</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 14 }} />
                  <Typography variant="body2">Joined {organization.joinedAt}</Typography>
                </Box>
                <Typography variant="body2">·</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  #{organization.id}
                </Typography>
              </Stack>
            </Box>
            <Stack
              direction={{ xs: "row", md: "row" }}
              spacing={1}
              sx={{ flexShrink: 0, flexWrap: "wrap", rowGap: 1 }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<Paid />}
                onClick={() => setDepositOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Deposit
              </Button>
              <Button
                variant="outlined"
                startIcon={<FolderOutlined />}
                onClick={() =>
                  navigate("/repositories/new", {
                    state: { orgId: organization.id },
                  })
                }
                sx={{
                  textTransform: "none",
                  borderColor: alpha("#FFFFFF", 0.15),
                  color: "#F5F5F5",
                  "&:hover": {
                    borderColor: "#E6007A",
                    backgroundColor: alpha("#E6007A", 0.08),
                  },
                }}
              >
                New Repository
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 820,
              lineHeight: 1.6,
            }}
          >
            {organization.description}
          </Typography>

          {isChain && storedOrg?.txHash && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                alignSelf: "flex-start",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                backgroundColor: alpha("#FFFFFF", 0.04),
                border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
              }}
            >
              <Launch sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: "monospace",
                }}
              >
                Tx: {storedOrg.txHash.slice(0, 10)}…{storedOrg.txHash.slice(-8)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        <StatCard
          icon={<Apartment sx={{ fontSize: 18 }} />}
          label="Members"
          value={organization.members.toString()}
          color="#64B5F6"
        />
        <StatCard
          icon={<FolderOutlined sx={{ fontSize: 18 }} />}
          label="Repositories"
          value={repos.length.toString()}
          hint={
            organization.repositories !== repos.length
              ? `${organization.repositories} reported`
              : undefined
          }
          color="#E6007A"
        />
        <StatCard
          icon={<Paid sx={{ fontSize: 18 }} />}
          label="Active grants"
          value={organization.activeGrants.toString()}
          color="#FFC107"
        />
        <StatCard
          icon={<AccountBalance sx={{ fontSize: 18 }} />}
          label={isChain ? "On-chain balance" : "Total funded"}
          value={
            isChain
              ? onChainBalance !== null
                ? formatBalance(onChainBalance)
                : balanceError
                  ? "error"
                  : "…"
              : organization.totalFunded
          }
          hint={isChain ? "units" : undefined}
          color="#58AD95"
        />
      </Box>

      {/* Repositories */}
      <Section
        title="Repositories"
        count={repos.length}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderOutlined sx={{ fontSize: 16 }} />}
            onClick={() =>
              navigate("/repositories/new", {
                state: { orgId: organization.id },
              })
            }
            sx={{
              textTransform: "none",
              borderColor: alpha("#FFFFFF", 0.12),
              color: "#F5F5F5",
              "&:hover": {
                borderColor: "#E6007A",
                backgroundColor: alpha("#E6007A", 0.08),
              },
            }}
          >
            New repository
          </Button>
        }
      >
        {repos.length === 0 ? (
          <EmptyState
            icon={<FolderOutlined sx={{ fontSize: 28, color: "text.secondary" }} />}
            title="No repositories yet"
            description="Create the first repository for this organization. It will be registered on-chain under the org's ID."
            action={
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  navigate("/repositories/new", {
                    state: { orgId: organization.id },
                  })
                }
                sx={{ textTransform: "none" }}
              >
                Create repository
              </Button>
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {repos.slice(0, 8).map((repo) => (
              <RepositoryRow key={repo.id} repository={repo} />
            ))}
            {repos.length > 8 && (
              <Button
                variant="text"
                onClick={() => navigate("/repositories")}
                sx={{
                  textTransform: "none",
                  alignSelf: "center",
                  color: "text.secondary",
                }}
              >
                View all {repos.length} repositories
              </Button>
            )}
          </Stack>
        )}
      </Section>

      {/* Grants */}
      <Section title="Grants" count={grants.length}>
        {grants.length === 0 ? (
          <EmptyState
            icon={<Paid sx={{ fontSize: 28, color: "text.secondary" }} />}
            title="No grants yet"
            description="This organization hasn't submitted any grant applications."
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
          >
            {grants.map((grant) => (
              <GrantCard key={grant.id} grant={grant} />
            ))}
          </Box>
        )}
      </Section>

      {/* Activity */}
      <Section title="Activity" count={events.length}>
        {events.length === 0 ? (
          <EmptyState
            icon={<Public sx={{ fontSize: 28, color: "text.secondary" }} />}
            title="No activity yet"
            description="Actions performed under this organization will appear here."
          />
        ) : (
          <Stack spacing={1.5}>
            {events.slice(0, 10).map((event) => (
              <ActivityEventRow key={event.id} event={event} />
            ))}
            {events.length > 10 && (
              <Button
                variant="text"
                onClick={() => navigate("/activity")}
                sx={{
                  textTransform: "none",
                  alignSelf: "center",
                  color: "text.secondary",
                }}
              >
                View all activity
              </Button>
            )}
          </Stack>
        )}
      </Section>

      <DepositDialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        orgId={organization.id}
      />
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
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(color, 0.15),
            color,
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {hint}
          </Typography>
        )}
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
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {typeof count === "number" && (
            <Chip
              label={count}
              size="small"
              sx={{
                backgroundColor: alpha("#FFFFFF", 0.06),
                color: "text.secondary",
                fontWeight: 600,
                height: 22,
                minWidth: 28,
              }}
            />
          )}
        </Box>
        {action}
      </Box>
      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06), mb: 2 }} />
      {children}
    </Box>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px dashed ${alpha("#FFFFFF", 0.12)}`,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: alpha("#FFFFFF", 0.04),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", maxWidth: 420, mb: action ? 1.5 : 0 }}
      >
        {description}
      </Typography>
      {action}
    </Box>
  );
}
