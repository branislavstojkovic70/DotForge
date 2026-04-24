import { Avatar, Box, Chip, IconButton, Stack, Tooltip, Typography, alpha } from "@mui/material";
import {
  BugReport,
  CallSplit,
  ContentCopy,
  History,
  Lock,
  MergeType,
  Paid,
  StarBorder,
  Terminal,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { languageColors, type RepositoryDetail } from "../../hooks/useRepositories";
import { useDotForge } from "../../hooks/useDotForge";

type Props = {
  repository: RepositoryDetail;
};

export default function RepositoryRow({ repository }: Props) {
  const navigate = useNavigate();

  return (
    <Box
      onClick={() => navigate(`/repositories/${repository.id}`)}
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "center" },
        gap: 2,
        cursor: "pointer",
        transition: "border-color 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: alpha("#E6007A", 0.4),
          transform: "translateY(-1px)",
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: repository.organizationColor,
          color: "#141414",
          fontWeight: 700,
          width: 44,
          height: 44,
          flexShrink: 0,
        }}
      >
        {repository.organization.charAt(0)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {repository.organization} / {repository.name}
          </Typography>
          {repository.visibility === "Private" && (
            <Chip
              size="small"
              icon={<Lock sx={{ fontSize: 14 }} />}
              label="Private"
              sx={{
                backgroundColor: alpha("#BCBDBE", 0.12),
                color: "text.secondary",
                fontWeight: 500,
                height: 22,
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
                fontWeight: 500,
                height: 22,
                ".MuiChip-icon": { ml: 0.75, color: "#58AD95" },
              }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 0.5,
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {repository.description}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {repository.topics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                backgroundColor: alpha("#FFFFFF", 0.05),
                color: "text.secondary",
                border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
              }}
            />
          ))}
        </Box>

        {repository.source === "chain" && (
          <LatestCommitHint repoId={repository.id} />
        )}
      </Box>

      <Stack
        direction={{ xs: "row", md: "row" }}
        spacing={2.5}
        sx={{
          alignItems: "center",
          flexShrink: 0,
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <MetaItem
          icon={
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: languageColors[repository.language],
              }}
            />
          }
          label={repository.language}
        />
        <Tooltip title="Stars">
          <Box>
            <MetaItem icon={<StarBorder sx={{ fontSize: 16 }} />} label={repository.stars.toString()} />
          </Box>
        </Tooltip>
        <Tooltip title="Forks">
          <Box>
            <MetaItem icon={<CallSplit sx={{ fontSize: 16 }} />} label={repository.forks.toString()} />
          </Box>
        </Tooltip>
        <Tooltip title="Open issues">
          <Box>
            <MetaItem icon={<BugReport sx={{ fontSize: 16 }} />} label={repository.openIssues.toString()} />
          </Box>
        </Tooltip>
        <Tooltip title="Open PRs">
          <Box>
            <MetaItem icon={<MergeType sx={{ fontSize: 16 }} />} label={repository.openPrs.toString()} />
          </Box>
        </Tooltip>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {repository.updatedAt}
        </Typography>
      </Stack>
    </Box>
  );
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
      {icon}
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

function LatestCommitHint({ repoId }: { repoId: string }) {
  const { service } = useDotForge();
  const [commit, setCommit] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    service
      .getBranch(BigInt(repoId), "main")
      .then((cid) => {
        if (!cancelled) setCommit(cid);
      })
      .catch(() => {
        if (!cancelled) setCommit(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, service]);

  const command = `dotforge pull ${repoId} main`;
  const commitText = loading
    ? "Loading…"
    : commit === null || commit === 0n
      ? "No commits yet"
      : `0x${commit.toString(16).padStart(16, "0")}`;

  const copy = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Copy failed"));
  };

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        mt: 1.25,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          backgroundColor: alpha("#FFFFFF", 0.04),
          border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        }}
      >
        <History sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography
          variant="caption"
          sx={{ fontFamily: "monospace", color: "text.secondary" }}
        >
          {commitText}
        </Typography>
        {commit !== null && commit !== 0n && (
          <Tooltip title="Copy commit hash">
            <IconButton
              size="small"
              onClick={() =>
                copy(`0x${commit.toString(16).padStart(16, "0")}`, "Commit hash")
              }
              sx={{ color: "text.secondary", p: 0.25 }}
            >
              <ContentCopy sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          backgroundColor: alpha("#58AD95", 0.08),
          border: `1px solid ${alpha("#58AD95", 0.2)}`,
        }}
      >
        <Terminal sx={{ fontSize: 14, color: "#58AD95" }} />
        <Typography
          variant="caption"
          sx={{ fontFamily: "monospace", color: "#F5F5F5" }}
        >
          {command}
        </Typography>
        <Tooltip title="Copy command">
          <IconButton
            size="small"
            onClick={() => copy(command, "Command")}
            sx={{ color: "text.secondary", p: 0.25 }}
          >
            <ContentCopy sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
