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
  OrgCategory,
  OrganizationSort,
  OrganizationsFilters as Filters,
} from "../../hooks/useOrganizations";

type Props = {
  filters: Filters;
  categories: (OrgCategory | "All")[];
  onChange: (next: Filters) => void;
};

const sortOptions: { value: OrganizationSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "members", label: "Most members" },
  { value: "grants", label: "Most grants" },
  { value: "funded", label: "Most funded" },
];

export default function OrganizationsFilters({ filters, categories, onChange }: Props) {
  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
        }}
      >
        <TextField
          placeholder="Search organizations..."
          size="small"
          fullWidth
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: { md: 420 } }}
        />

        <TextField
          select
          size="small"
          label="Sort by"
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as OrganizationSort })
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
        {categories.map((category) => {
          const active = filters.category === category;
          return (
            <Chip
              key={category}
              label={category}
              onClick={() => onChange({ ...filters, category })}
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
