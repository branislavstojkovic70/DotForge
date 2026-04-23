import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  Add,
  Apartment,
  Delete,
  FlagOutlined,
  Paid,
} from "@mui/icons-material";
import type { StoredGrantCategory } from "../../utils/localStore";
import type { StoredOrg } from "../../utils/localStore";

export type GrantMilestoneDraft = {
  id: string;
  title: string;
  amount: string;
};

export type GrantDraft = {
  orgId: string;
  title: string;
  description: string;
  category: StoredGrantCategory;
  amount: string;
  currency: string;
  deadline: string;
  teamSize: number;
  milestones: GrantMilestoneDraft[];
};

type Props = {
  draft: GrantDraft;
  orgs: StoredOrg[];
  onChange: (draft: GrantDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  disabled?: boolean;
};

const CATEGORIES: StoredGrantCategory[] = [
  "Infrastructure",
  "DeFi",
  "Tooling",
  "Research",
  "Governance",
  "Education",
];

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function GrantForm({
  draft,
  orgs,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  disabled,
}: Props) {
  const update = <K extends keyof GrantDraft>(key: K, value: GrantDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const totalMilestones = draft.milestones.reduce((sum, m) => {
    const n = Number(m.amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const requestedNum = Number(draft.amount) || 0;
  const milestoneMismatch =
    draft.milestones.length > 0 &&
    requestedNum > 0 &&
    Math.abs(totalMilestones - requestedNum) > 0.001;

  const updateMilestone = (
    id: string,
    patch: Partial<GrantMilestoneDraft>
  ) => {
    const next = draft.milestones.map((m) =>
      m.id === id ? { ...m, ...patch } : m
    );
    update("milestones", next);
  };

  const addMilestone = () => {
    update("milestones", [
      ...draft.milestones,
      { id: randomId(), title: "", amount: "" },
    ]);
  };

  const removeMilestone = (id: string) => {
    update(
      "milestones",
      draft.milestones.filter((m) => m.id !== id)
    );
  };

  const validationIssues: string[] = [];
  if (!draft.orgId) validationIssues.push("Select an organization");
  if (draft.title.trim().length < 3)
    validationIssues.push("Title needs at least 3 characters");
  if (draft.description.trim().length < 10)
    validationIssues.push("Description needs at least 10 characters");
  if (requestedNum <= 0)
    validationIssues.push("Amount must be greater than zero");
  if (disabled)
    validationIssues.push(
      "Connect your wallet and make sure you have an on-chain organization"
    );

  const canSubmit = validationIssues.length === 0 && !submitting;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
        >
          Organization
        </Typography>
        <TextField
          select
          value={draft.orgId}
          onChange={(e) => update("orgId", e.target.value)}
          size="small"
          fullWidth
          disabled={disabled || orgs.length === 0}
          slotProps={{
            select: {
              displayEmpty: true,
              renderValue: (selected) => {
                if (!selected) {
                  return (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Select an organization…
                    </Typography>
                  );
                }
                const org = orgs.find((o) => o.orgId === selected);
                return org ? `${org.name} · #${org.orgId}` : String(selected);
              },
            },
          }}
        >
          {orgs.map((org) => (
            <MenuItem key={org.orgId} value={org.orgId}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    backgroundColor: alpha(org.avatarColor, 0.2),
                    color: org.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  <Apartment sx={{ fontSize: 14 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {org.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    #{org.orgId} · {org.handle}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
        >
          Grant title
        </Typography>
        <TextField
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Cross-chain Identity Resolver"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
        >
          Description
        </Typography>
        <TextField
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What will be built and why it matters."
          size="small"
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          helperText={`${draft.description.length}/500`}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Category
          </Typography>
          <TextField
            select
            value={draft.category}
            onChange={(e) =>
              update("category", e.target.value as StoredGrantCategory)
            }
            size="small"
            fullWidth
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Team size
          </Typography>
          <TextField
            type="number"
            value={draft.teamSize}
            onChange={(e) =>
              update("teamSize", Math.max(1, Number(e.target.value) || 1))
            }
            size="small"
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 50 } }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Amount requested
          </Typography>
          <TextField
            value={draft.amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                update("amount", val);
              }
            }}
            placeholder="0"
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Paid sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 600 }}
                    >
                      {draft.currency}
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
            helperText="Stored on chain as a bigint (whole units)."
          />
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 0.75, ml: 0.5 }}
          >
            Deadline
          </Typography>
          <TextField
            value={draft.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            placeholder="e.g. Sep 2026"
            size="small"
            fullWidth
            helperText="Free-form target completion date."
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha("#FFFFFF", 0.06) }} />

      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FlagOutlined sx={{ fontSize: 18, color: "#B388FF" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Milestones
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ({draft.milestones.length})
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={addMilestone}
            sx={{
              textTransform: "none",
              color: "#B388FF",
              "&:hover": { backgroundColor: alpha("#B388FF", 0.08) },
            }}
          >
            Add milestone
          </Button>
        </Box>

        {draft.milestones.length === 0 ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px dashed ${alpha("#FFFFFF", 0.1)}`,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              No milestones yet. Break the grant into checkpoints so auditors
              can release funds incrementally.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {draft.milestones.map((m, idx) => (
              <Box
                key={m.id}
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: "auto 1fr 140px auto",
                  alignItems: "center",
                  p: 1.25,
                  borderRadius: 2,
                  backgroundColor: alpha("#FFFFFF", 0.03),
                  border: `1px solid ${alpha("#FFFFFF", 0.05)}`,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: alpha("#B388FF", 0.15),
                    color: "#B388FF",
                    fontWeight: 700,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </Box>
                <TextField
                  value={m.title}
                  onChange={(e) =>
                    updateMilestone(m.id, { title: e.target.value })
                  }
                  placeholder="Milestone title"
                  size="small"
                  fullWidth
                />
                <TextField
                  value={m.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      updateMilestone(m.id, { amount: val });
                    }
                  }}
                  placeholder="0"
                  size="small"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", fontWeight: 600 }}
                          >
                            {draft.currency}
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeMilestone(m.id)}
                  sx={{ color: "text.secondary" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 0.5,
                px: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Milestones total
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: milestoneMismatch ? "#FFC107" : "#58AD95",
                }}
              >
                {totalMilestones.toLocaleString()} / {requestedNum.toLocaleString()}{" "}
                {draft.currency}
                {milestoneMismatch ? " (mismatch)" : ""}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {validationIssues.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha("#FFC107", 0.08),
            border: `1px solid ${alpha("#FFC107", 0.25)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#FFC107",
              fontWeight: 700,
              display: "block",
              mb: 0.5,
              letterSpacing: 0.4,
            }}
          >
            BEFORE YOU CAN SUBMIT
          </Typography>
          <Stack spacing={0.25}>
            {validationIssues.map((issue) => (
              <Typography
                key={issue}
                variant="caption"
                sx={{ color: "text.secondary", display: "flex", gap: 0.75 }}
              >
                <Box component="span" sx={{ color: "#FFC107" }}>
                  •
                </Box>
                {issue}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 1 }}>
        <Button
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
          startIcon={
            submitting ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : undefined
          }
          sx={{ textTransform: "none", px: 3 }}
        >
          {submitting ? "Submitting…" : "Create grant"}
        </Button>
      </Box>
    </Stack>
  );
}
