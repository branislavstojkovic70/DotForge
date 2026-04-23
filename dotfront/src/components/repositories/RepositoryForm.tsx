import {
  Avatar,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import { Close, Lock, Public } from "@mui/icons-material";
import { useState } from "react";
import type { StoredOrg } from "../../utils/localStore";
import type { RepoLanguage, RepoVisibility } from "../../hooks/useRepositories";

export type RepositoryDraft = {
  orgId: string;
  name: string;
  description: string;
  language: RepoLanguage;
  visibility: RepoVisibility;
  topics: string[];
};

type Props = {
  draft: RepositoryDraft;
  orgs: StoredOrg[];
  onChange: (next: RepositoryDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  disabled?: boolean;
};

const languages: RepoLanguage[] = [
  "Rust",
  "TypeScript",
  "JavaScript",
  "Python",
  "Solidity",
  "Go",
];

function slugifyRepo(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s._-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export default function RepositoryForm({
  draft,
  orgs,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  disabled = false,
}: Props) {
  const [topicInput, setTopicInput] = useState("");

  const addTopic = () => {
    const value = topicInput.trim().toLowerCase();
    if (!value) return;
    if (draft.topics.includes(value)) {
      setTopicInput("");
      return;
    }
    if (draft.topics.length >= 6) return;
    onChange({ ...draft, topics: [...draft.topics, value] });
    setTopicInput("");
  };

  const removeTopic = (topic: string) => {
    onChange({ ...draft, topics: draft.topics.filter((t) => t !== topic) });
  };

  const canSubmit =
    draft.orgId.length > 0 &&
    draft.name.trim().length > 0 &&
    !submitting &&
    !disabled;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Repository details
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          The contract stores the repository under the selected organization.
          Metadata is saved locally for now.
        </Typography>
      </Box>

      <TextField
        select
        label="Organization"
        value={draft.orgId}
        onChange={(e) => onChange({ ...draft, orgId: e.target.value })}
        size="small"
        fullWidth
        disabled={orgs.length === 0}
        helperText={
          orgs.length === 0
            ? "No organizations found. Create one first."
            : "The new repository will belong to this organization."
        }
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

      <TextField
        label="Name"
        placeholder="e.g. pallet-forge"
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: slugifyRepo(e.target.value) })}
        size="small"
        fullWidth
        slotProps={{ htmlInput: { maxLength: 64 } }}
        helperText="Lowercase, dashes, dots and underscores."
      />

      <TextField
        label="Description"
        placeholder="What does this repository contain?"
        value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
        size="small"
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        slotProps={{ htmlInput: { maxLength: 280 } }}
        helperText={`${draft.description.length}/280`}
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "stretch",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Primary language
          </Typography>
          <TextField
            select
            value={draft.language}
            onChange={(e) =>
              onChange({ ...draft, language: e.target.value as RepoLanguage })
            }
            size="small"
            fullWidth
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Visibility
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={draft.visibility}
            onChange={(_, value) => {
              if (value) onChange({ ...draft, visibility: value as RepoVisibility });
            }}
            fullWidth
            sx={{
              height: 40,
              "& .MuiToggleButton-root": {
                textTransform: "none",
                gap: 0.75,
                color: "text.secondary",
                borderColor: alpha("#FFFFFF", 0.23),
                "&.Mui-selected": {
                  backgroundColor: alpha("#E6007A", 0.18),
                  color: "#FF4AA6",
                  borderColor: alpha("#E6007A", 0.5),
                  "&:hover": { backgroundColor: alpha("#E6007A", 0.22) },
                },
              },
            }}
          >
            <ToggleButton value="Public">
              <Public sx={{ fontSize: 16 }} /> Public
            </ToggleButton>
            <ToggleButton value="Private">
              <Lock sx={{ fontSize: 16 }} /> Private
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Topics
        </Typography>
        <Stack spacing={1}>
          <TextField
            placeholder="Type a topic and press Enter"
            size="small"
            fullWidth
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTopic();
              }
            }}
            disabled={draft.topics.length >= 6}
            helperText={
              draft.topics.length >= 6
                ? "Max 6 topics"
                : `${draft.topics.length}/6 topics`
            }
          />
          {draft.topics.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {draft.topics.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  size="small"
                  onDelete={() => removeTopic(topic)}
                  deleteIcon={<Close sx={{ fontSize: 14 }} />}
                  sx={{
                    backgroundColor: alpha("#FFFFFF", 0.05),
                    color: "text.primary",
                    border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", pt: 1 }}>
        <Button
          variant="text"
          onClick={onCancel}
          disabled={submitting}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={!canSubmit}
          sx={{ textTransform: "none", px: 3 }}
        >
          {submitting ? "Creating…" : "Create repository"}
        </Button>
      </Box>
    </Stack>
  );
}
