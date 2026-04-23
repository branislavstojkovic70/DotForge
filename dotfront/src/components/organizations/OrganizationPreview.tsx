import { Avatar, Box, Chip, Divider, Typography, alpha } from "@mui/material";
import type { OrganizationDraft } from "./OrganizationForm";

type Props = {
  draft: OrganizationDraft;
};

export default function OrganizationPreview({ draft }: Props) {
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
        <Avatar
          sx={{
            bgcolor: draft.avatarColor,
            color: "#141414",
            fontWeight: 700,
            width: 48,
            height: 48,
          }}
        >
          {(draft.name.charAt(0) || "?").toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
            {draft.name || "Organization name"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            @{draft.handle || "handle"}
          </Typography>
        </Box>
      </Box>

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
        {draft.description || "Your organization description will appear here."}
      </Typography>

      <Chip
        label={draft.category}
        size="small"
        sx={{
          alignSelf: "flex-start",
          backgroundColor: alpha("#FFFFFF", 0.06),
          color: "text.secondary",
          fontWeight: 500,
        }}
      />

      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />

      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        On creation, the contract assigns a numeric organization ID. You can
        invite members and create repositories after the transaction is
        confirmed.
      </Typography>
    </Box>
  );
}
