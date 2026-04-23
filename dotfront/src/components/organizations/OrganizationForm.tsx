import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import type { OrgCategory } from "../../hooks/useOrganizations";

export type OrganizationDraft = {
  name: string;
  handle: string;
  description: string;
  category: OrgCategory;
  avatarColor: string;
};

type Props = {
  draft: OrganizationDraft;
  onChange: (next: OrganizationDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  disabled?: boolean;
};

const categories: OrgCategory[] = [
  "Infrastructure",
  "DeFi",
  "Tooling",
  "Research",
  "Governance",
  "Education",
];

const colorPalette = [
  "#E6007A",
  "#FF4AA6",
  "#58AD95",
  "#64B5F6",
  "#FFC107",
  "#B388FF",
  "#FF7043",
  "#4DB6AC",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 32);
}

export default function OrganizationForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  disabled = false,
}: Props) {
  const handleNameChange = (value: string) => {
    const nextHandle =
      draft.handle === "" || draft.handle === slugify(draft.name)
        ? slugify(value)
        : draft.handle;
    onChange({ ...draft, name: value, handle: nextHandle });
  };

  const canSubmit =
    draft.name.trim().length > 0 &&
    draft.handle.trim().length > 0 &&
    !submitting &&
    !disabled;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Organization details
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Profile information stored off-chain. The on-chain registry only
          assigns an organization ID.
        </Typography>
      </Box>

      <TextField
        label="Name"
        placeholder="e.g. Parity Builders"
        value={draft.name}
        onChange={(e) => handleNameChange(e.target.value)}
        size="small"
        fullWidth
        slotProps={{ htmlInput: { maxLength: 48 } }}
        helperText={`${draft.name.length}/48`}
      />

      <TextField
        label="Handle"
        placeholder="parity-builders"
        value={draft.handle}
        onChange={(e) =>
          onChange({ ...draft, handle: slugify(e.target.value) })
        }
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: <Box sx={{ mr: 0.5, color: "text.secondary" }}>@</Box>,
          },
          htmlInput: { maxLength: 32 },
        }}
        helperText="Lowercase letters, numbers and dashes only."
      />

      <TextField
        label="Description"
        placeholder="What is this organization building?"
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

      <TextField
        select
        label="Category"
        value={draft.category}
        onChange={(e) =>
          onChange({ ...draft, category: e.target.value as OrgCategory })
        }
        size="small"
        fullWidth
      >
        {categories.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Accent color
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {colorPalette.map((color) => {
            const selected = draft.avatarColor === color;
            return (
              <Box
                key={color}
                onClick={() => onChange({ ...draft, avatarColor: color })}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: color,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${
                    selected ? "#FFFFFF" : alpha("#FFFFFF", 0.1)
                  }`,
                  boxShadow: selected
                    ? `0 0 0 2px ${alpha(color, 0.6)}`
                    : "none",
                  transition: "transform 120ms ease",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                {selected && (
                  <Check sx={{ fontSize: 16, color: "#141414" }} />
                )}
              </Box>
            );
          })}
        </Box>
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
          {submitting ? "Creating…" : "Create organization"}
        </Button>
      </Box>
    </Stack>
  );
}
