import { Avatar, Box, Chip, Typography, alpha } from "@mui/material";
import { FolderOutlined, Lock, Public } from "@mui/icons-material";
import { languageColors } from "../../hooks/useRepositories";
import type { RepositoryDraft } from "./RepositoryForm";
import type { StoredOrg } from "../../utils/localStore";

type Props = {
  draft: RepositoryDraft;
  org: StoredOrg | null;
};

export default function RepositoryPreview({ draft, org }: Props) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "#1E1E1E",
        border: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "sticky",
        top: 16,
      }}
    >
      <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.2 }}>
        Preview
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            backgroundColor: alpha("#E6007A", 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FolderOutlined sx={{ color: "#FF4AA6" }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, wordBreak: "break-all" }}
            >
              {org ? `${org.name}/` : "org/"}
              <Box component="span" sx={{ color: "#FF4AA6" }}>
                {draft.name || "repository"}
              </Box>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
            {draft.visibility === "Private" ? (
              <Lock sx={{ fontSize: 14, color: "text.secondary" }} />
            ) : (
              <Public sx={{ fontSize: 14, color: "text.secondary" }} />
            )}
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {draft.visibility}
            </Typography>
          </Box>
        </Box>
      </Box>

      {org && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: alpha("#FFFFFF", 0.03),
          }}
        >
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: org.avatarColor,
              color: "#141414",
            }}
          >
            {org.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Organization
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {org.name} · #{org.orgId}
            </Typography>
          </Box>
        </Box>
      )}

      <Typography
        variant="body2"
        sx={{
          color: draft.description ? "text.secondary" : alpha("#FFFFFF", 0.3),
          fontStyle: draft.description ? "normal" : "italic",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {draft.description || "Your repository description will appear here."}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: languageColors[draft.language],
          }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {draft.language}
        </Typography>
      </Box>

      {draft.topics.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {draft.topics.map((topic) => (
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
      )}
    </Box>
  );
}
