import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  ArrowBack,
  BugReport,
  CallSplit,
  ContentCopy,
  FileCopyOutlined,
  History,
  Launch,
  Lock,
  MergeType,
  Paid,
  Public,
  StarBorder,
  Tag,
  Terminal,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  languageColors,
  useRepositories,
  type RepositoryDetail as RepoDetailType,
} from "../hooks/useRepositories";
import { useOrganizations } from "../hooks/useOrganizations";
import { useActivity } from "../hooks/useActivity";
import { useGrants } from "../hooks/useGrants";
import { useDotForge } from "../hooks/useDotForge";
import ActivityEventRow from "../components/activity/ActivityEventRow";
import GrantCard from "../components/grants/GrantCard";
import { getStoredRepos } from "../utils/localStore";

function shortHash(hash: string): string {
  if (!hash) return "—";
  if (hash.length < 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export default function RepositoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allRepositories } = useRepositories();
  const { allOrganizations } = useOrganizations();
  const { allEvents } = useActivity();
  const { allGrants } = useGrants();
  const { service } = useDotForge();

  const [onChainOrgId, setOnChainOrgId] = useState<bigint | null>(null);
  const [onChainError, setOnChainError] = useState<string | null>(null);
  const [latestCommit, setLatestCommit] = useState<bigint | null>(null);
  const [latestCommitLoading, setLatestCommitLoading] = useState(false);
  const [latestCommitError, setLatestCommitError] = useState<string | null>(null);

  const repository = useMemo<RepoDetailType | undefined>(
    () => allRepositories.find((r) => r.id === id),
    [allRepositories, id]
  );

  const organization = useMemo(
    () =>
      repository
        ? allOrganizations.find((o) => o.name === repository.organization)
        : undefined,
    [allOrganizations, repository]
  );

  const storedRepo = useMemo(
    () => (id ? getStoredRepos().find((r) => r.repoId === id) ?? null : null),
    [id]
  );

  const events = useMemo(
    () =>
      repository
        ? allEvents.filter((e) => e.repository === repository.name)
        : [],
    [allEvents, repository]
  );

  const grants = useMemo(
    () =>
      repository
        ? allGrants.filter((g) => g.organization === repository.organization)
        : [],
    [allGrants, repository]
  );

  const isChain = repository?.source === "chain";

  useEffect(() => {
    if (!isChain || !id) {
      setOnChainOrgId(null);
      return;
    }
    let cancelled = false;
    setOnChainError(null);
    service
      .getRepoOrg(BigInt(id))
      .then((orgId) => {
        if (!cancelled) setOnChainOrgId(orgId);
      })
      .catch((err) => {
        if (!cancelled) {
          setOnChainError(err instanceof Error ? err.message : "Failed to read on-chain org");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isChain, id, service]);

  useEffect(() => {
    if (!isChain || !id) {
      setLatestCommit(null);
      setLatestCommitError(null);
      return;
    }
    let cancelled = false;
    setLatestCommitLoading(true);
    setLatestCommitError(null);
    service
      .getBranch(BigInt(id), "main")
      .then((cid) => {
        if (!cancelled) setLatestCommit(cid);
      })
      .catch((err) => {
        if (!cancelled) {
          setLatestCommitError(
            err instanceof Error ? err.message : "Failed to read latest commit"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLatestCommitLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isChain, id, service]);

  if (!repository) {
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
          Repository not found
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
          We couldn't find a repository with id <code>{id}</code>.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/repositories")}
          sx={{ textTransform: "none" }}
        >
          Back to repositories
        </Button>
      </Box>
    );
  }

  const cloneUrl = `dotforge://${repository.organization.toLowerCase().replace(/\s+/g, "-")}/${repository.name}`;

  const copy = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Copy failed"));
  };

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
        onClick={() => navigate("/repositories")}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          color: "text.secondary",
          pl: 0,
          "&:hover": { color: "#FFFFFF", backgroundColor: "transparent" },
        }}
      >
        Back to repositories
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
              repository.organizationColor,
              0.22
            )} 0%, transparent 45%), radial-gradient(circle at 90% 100%, ${alpha(
              languageColors[repository.language],
              0.18
            )} 0%, transparent 55%)`,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
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
                bgcolor: repository.organizationColor,
                color: "#141414",
                fontWeight: 800,
                width: 72,
                height: 72,
                fontSize: 28,
                flexShrink: 0,
                cursor: organization ? "pointer" : "default",
              }}
              onClick={() =>
                organization && navigate(`/organizations/${organization.id}`)
              }
            >
              {repository.organization.charAt(0).toUpperCase()}
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
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: "text.secondary",
                    cursor: organization ? "pointer" : "default",
                    "&:hover": organization
                      ? { color: "#F5F5F5" }
                      : undefined,
                  }}
                  onClick={() =>
                    organization && navigate(`/organizations/${organization.id}`)
                  }
                >
                  {repository.organization}
                </Typography>
                <Typography variant="h5" sx={{ color: "text.secondary" }}>
                  /
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {repository.name}
                </Typography>
                {repository.visibility === "Private" ? (
                  <Chip
                    size="small"
                    icon={<Lock sx={{ fontSize: 14 }} />}
                    label="Private"
                    sx={{
                      backgroundColor: alpha("#BCBDBE", 0.15),
                      color: "text.secondary",
                      fontWeight: 600,
                      ".MuiChip-icon": { ml: 0.75, color: "text.secondary" },
                    }}
                  />
                ) : (
                  <Chip
                    size="small"
                    icon={<Public sx={{ fontSize: 14 }} />}
                    label="Public"
                    sx={{
                      backgroundColor: alpha("#FFFFFF", 0.06),
                      color: "text.secondary",
                      fontWeight: 600,
                      ".MuiChip-icon": { ml: 0.75, color: "text.secondary" },
                    }}
                  />
                )}
                {repository.hasGrant && (
                  <Chip
                    size="small"
                    icon={<Paid sx={{ fontSize: 14 }} />}
                    label="Grant"
                    sx={{
                      backgroundColor: alpha("#58AD95", 0.15),
                      color: "#58AD95",
                      fontWeight: 600,
                      ".MuiChip-icon": { ml: 0.75, color: "#58AD95" },
                    }}
                  />
                )}
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
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  mt: 1.25,
                  maxWidth: 820,
                  lineHeight: 1.6,
                }}
              >
                {repository.description}
              </Typography>

              {repository.topics.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.75,
                    flexWrap: "wrap",
                    mt: 1.5,
                  }}
                >
                  {repository.topics.map((topic) => (
                    <Chip
                      key={topic}
                      icon={<Tag sx={{ fontSize: 12 }} />}
                      label={topic}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: 11,
                        backgroundColor: alpha("#FFFFFF", 0.05),
                        color: "text.secondary",
                        border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
                        ".MuiChip-icon": { ml: 0.75, color: "text.secondary" },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<StarBorder />}
                sx={{
                  textTransform: "none",
                  borderColor: alpha("#FFFFFF", 0.15),
                  color: "#F5F5F5",
                  "&:hover": {
                    borderColor: "#FFC107",
                    backgroundColor: alpha("#FFC107", 0.08),
                    color: "#FFC107",
                  },
                }}
              >
                Star
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FileCopyOutlined />}
                onClick={() => copy(cloneUrl, "Clone URL")}
                sx={{ textTransform: "none" }}
              >
                Clone
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
          },
        }}
      >
        <StatCard
          icon={
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: languageColors[repository.language],
              }}
            />
          }
          label="Language"
          value={repository.language}
          color={languageColors[repository.language]}
        />
        <StatCard
          icon={<StarBorder sx={{ fontSize: 18 }} />}
          label="Stars"
          value={repository.stars.toString()}
          color="#FFC107"
        />
        <StatCard
          icon={<CallSplit sx={{ fontSize: 18 }} />}
          label="Forks"
          value={repository.forks.toString()}
          color="#64B5F6"
        />
        <StatCard
          icon={<BugReport sx={{ fontSize: 18 }} />}
          label="Open issues"
          value={repository.openIssues.toString()}
          color="#FF5252"
        />
        <StatCard
          icon={<MergeType sx={{ fontSize: 18 }} />}
          label="Open PRs"
          value={repository.openPrs.toString()}
          color="#B388FF"
        />
      </Box>

      {/* Two-column layout for info + activity */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
          alignItems: "flex-start",
        }}
      >
        {/* Left: Activity + Grants */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <Section title="Activity" count={events.length}>
            {events.length === 0 ? (
              <EmptyState
                icon={<MergeType sx={{ fontSize: 26, color: "text.secondary" }} />}
                title="No activity recorded"
                description="Commits, PRs and grant events linked to this repository will appear here."
              />
            ) : (
              <Stack spacing={1.5}>
                {events.slice(0, 12).map((event) => (
                  <ActivityEventRow key={event.id} event={event} />
                ))}
              </Stack>
            )}
          </Section>

          {grants.length > 0 && (
            <Section
              title="Related grants"
              count={grants.length}
              subtitle={`Grants under ${repository.organization}`}
            >
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
                }}
              >
                {grants.slice(0, 4).map((grant) => (
                  <GrantCard key={grant.id} grant={grant} />
                ))}
              </Box>
            </Section>
          )}
        </Box>

        {/* Right: About / On-chain */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <InfoPanel title="About">
            <InfoRow
              label="Organization"
              value={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: organization ? "pointer" : "default",
                  }}
                  onClick={() =>
                    organization && navigate(`/organizations/${organization.id}`)
                  }
                >
                  <Avatar
                    sx={{
                      bgcolor: repository.organizationColor,
                      color: "#141414",
                      fontWeight: 700,
                      width: 18,
                      height: 18,
                      fontSize: 10,
                    }}
                  >
                    {repository.organization.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      "&:hover": organization ? { color: "#FF4AA6" } : undefined,
                    }}
                  >
                    {repository.organization}
                  </Typography>
                </Box>
              }
            />
            <InfoRow label="Visibility" value={repository.visibility} />
            <InfoRow label="Language" value={repository.language} />
            <InfoRow label="Last updated" value={repository.updatedAt} />
          </InfoPanel>

          <InfoPanel
            title="On-chain"
            highlight={isChain}
            subtitle={
              isChain
                ? "Registered via DotForge contract"
                : "This repo is a mock sample — on-chain data is not available."
            }
          >
            <InfoRow
              label="Repo ID"
              value={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    #{repository.id}
                  </Typography>
                  <CopyButton
                    onCopy={() => copy(repository.id, "Repo ID")}
                  />
                </Box>
              }
            />
            <InfoRow
              label="Org ID"
              value={
                isChain ? (
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {onChainError
                      ? "error"
                      : onChainOrgId !== null
                        ? `#${onChainOrgId.toString()}`
                        : "…"}
                  </Typography>
                ) : organization ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {organization.id}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    —
                  </Typography>
                )
              }
            />
            {isChain && storedRepo?.txHash && (
              <InfoRow
                label="Tx hash"
                value={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace", fontWeight: 500 }}
                    >
                      {shortHash(storedRepo.txHash)}
                    </Typography>
                    <CopyButton
                      onCopy={() => copy(storedRepo.txHash, "Tx hash")}
                    />
                  </Box>
                }
              />
            )}
            {isChain && storedRepo?.createdAt && (
              <InfoRow
                label="Created"
                value={new Date(storedRepo.createdAt).toLocaleString()}
              />
            )}
          </InfoPanel>

          {isChain && (
            <InfoPanel
              title="Latest commit"
              subtitle={`Anchored on-chain via getBranch(repoId, "main")`}
            >
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#141414",
                  border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <History sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    fontFamily: "monospace",
                    color: latestCommitError ? "#FF5252" : "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {latestCommitLoading
                    ? "Loading…"
                    : latestCommitError
                      ? "Read failed"
                      : latestCommit === null || latestCommit === 0n
                        ? "No commits yet"
                        : `0x${latestCommit.toString(16).padStart(16, "0")}`}
                </Typography>
                {latestCommit !== null && latestCommit !== 0n && (
                  <Tooltip title="Copy commit hash">
                    <IconButton
                      size="small"
                      onClick={() =>
                        copy(
                          `0x${latestCommit.toString(16).padStart(16, "0")}`,
                          "Commit hash"
                        )
                      }
                      sx={{ color: "text.secondary" }}
                    >
                      <ContentCopy sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#141414",
                  border: `1px solid ${alpha("#58AD95", 0.25)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Terminal sx={{ fontSize: 16, color: "#58AD95" }} />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    fontFamily: "monospace",
                    color: "#F5F5F5",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {`dotforge pull ${repository.id} main`}
                </Typography>
                <Tooltip title="Copy command">
                  <IconButton
                    size="small"
                    onClick={() =>
                      copy(`dotforge pull ${repository.id} main`, "Command")
                    }
                    sx={{ color: "text.secondary" }}
                  >
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                Run the DotForge CLI to fetch the latest encrypted commit from IPFS.
              </Typography>
            </InfoPanel>
          )}

          <InfoPanel title="Clone">
            <Box
              sx={{
                p: 1,
                pl: 1.5,
                borderRadius: 2,
                backgroundColor: "#141414",
                border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  fontFamily: "monospace",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cloneUrl}
              </Typography>
              <Tooltip title="Copy clone URL">
                <IconButton
                  size="small"
                  onClick={() => copy(cloneUrl, "Clone URL")}
                  sx={{ color: "text.secondary" }}
                >
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 1, display: "block" }}
            >
              Use the DotForge CLI to clone and push commits on-chain.
            </Typography>
          </InfoPanel>

          {organization && (
            <Button
              variant="outlined"
              startIcon={<Launch sx={{ fontSize: 16 }} />}
              onClick={() => navigate(`/organizations/${organization.id}`)}
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
              Open organization
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1.25,
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
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Section({
  title,
  count,
  subtitle,
  children,
}: {
  title: string;
  count?: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
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
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06), mb: 2 }} />
      {children}
    </Box>
  );
}

function InfoPanel({
  title,
  subtitle,
  highlight = false,
  children,
}: {
  title: string;
  subtitle?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${
          highlight ? alpha("#58AD95", 0.35) : alpha("#FFFFFF", 0.06)
        }`,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.05) }} />
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        minHeight: 24,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
}

function CopyButton({ onCopy }: { onCopy: () => void }) {
  return (
    <Tooltip title="Copy">
      <IconButton
        size="small"
        onClick={onCopy}
        sx={{ color: "text.secondary", p: 0.25 }}
      >
        <ContentCopy sx={{ fontSize: 12 }} />
      </IconButton>
    </Tooltip>
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
          width: 44,
          height: 44,
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
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
        {description}
      </Typography>
    </Box>
  );
}
