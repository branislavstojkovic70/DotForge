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
import type {
  CategoryFilter,
  GrantFilters as Filters,
  GrantSort,
  StatusFilter,
} from "../../hooks/useGrants";

type Props = {
  filters: Filters;
  categories: CategoryFilter[];
  statuses: StatusFilter[];
  onChange: (next: Filters) => void;
};

const sortOptions: { value: GrantSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "amount", label: "Highest amount" },
  { value: "progress", label: "Most progress" },
  { value: "deadline", label: "Nearest deadline" },
];

export default function GrantsFilters({ filters, categories, statuses, onChange }: Props) {
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
          placeholder="Search grants..."
          size="small"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
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
          label="Category"
          value={filters.category}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value as CategoryFilter })
          }
          sx={{ minWidth: 160 }}
        >
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Sort by"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as GrantSort })}
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
        {statuses.map((status) => {
          const active = filters.status === status;
          return (
            <Chip
              key={status}
              label={status}
              onClick={() => onChange({ ...filters, status })}
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
