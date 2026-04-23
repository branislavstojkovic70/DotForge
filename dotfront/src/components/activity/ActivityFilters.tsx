import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  alpha,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import {
  kindLabels,
  type ActivityFilterKind,
  type ActivityFilters as Filters,
  type ActivitySort,
} from "../../hooks/useActivity";

type Props = {
  filters: Filters;
  kinds: ActivityFilterKind[];
  onChange: (next: Filters) => void;
};

const sortOptions: { value: ActivitySort; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

function kindLabel(kind: ActivityFilterKind): string {
  if (kind === "All") return "All";
  return kindLabels[kind];
}

export default function ActivityFilters({ filters, kinds, onChange }: Props) {
  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Search activity..."
          size="small"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          //@ts-ignore
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: { md: 1 }, maxWidth: { md: 480 } }}
        />

        <TextField
          select
          size="small"
          label="Sort by"
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as ActivitySort })
          }
          sx={{ minWidth: 180 }}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {kinds.map((kind) => {
          const active = filters.kind === kind;
          return (
            <Chip
              key={kind}
              label={kindLabel(kind)}
              onClick={() => onChange({ ...filters, kind })}
              sx={{
                cursor: "pointer",
                fontWeight: 500,
                backgroundColor: active ? alpha("#E6007A", 0.2) : alpha("#FFFFFF", 0.05),
                color: active ? "#FF4AA6" : "text.secondary",
                border: `1px solid ${active ? alpha("#E6007A", 0.5) : "transparent"}`,
                "&:hover": {
                  backgroundColor: active
                    ? alpha("#E6007A", 0.25)
                    : alpha("#FFFFFF", 0.08),
                },
              }}
            />
          );
        })}
      </Box>
    </Stack>
  );
}
