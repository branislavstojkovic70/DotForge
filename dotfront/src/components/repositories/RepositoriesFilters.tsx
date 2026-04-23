import {
  Box,
  InputAdornment,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import type {
  LanguageFilter,
  RepositoryFilters as Filters,
  RepositorySort,
  VisibilityFilter,
} from "../../hooks/useRepositories";

type Props = {
  filters: Filters;
  languages: LanguageFilter[];
  onChange: (next: Filters) => void;
};

const sortOptions: { value: RepositorySort; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "stars", label: "Most stars" },
  { value: "issues", label: "Most issues" },
  { value: "name", label: "Name (A–Z)" },
];

const visibilityOptions: VisibilityFilter[] = ["All", "Public", "Private"];

export default function RepositoriesFilters({ filters, languages, onChange }: Props) {
  return (
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
        placeholder="Search repositories..."
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
        label="Language"
        value={filters.language}
        onChange={(e) =>
          onChange({ ...filters, language: e.target.value as LanguageFilter })
        }
        sx={{ minWidth: 160 }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang} value={lang}>
            {lang}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Sort by"
        value={filters.sort}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value as RepositorySort })
        }
        sx={{ minWidth: 180 }}
      >
        {sortOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={filters.visibility}
        onChange={(_, value) => {
          if (value) onChange({ ...filters, visibility: value as VisibilityFilter });
        }}
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            color: "text.secondary",
            borderColor: alpha("#FFFFFF", 0.12),
            "&.Mui-selected": {
              backgroundColor: alpha("#E6007A", 0.18),
              color: "#FF4AA6",
              borderColor: alpha("#E6007A", 0.5),
              "&:hover": { backgroundColor: alpha("#E6007A", 0.22) },
            },
          },
        }}
      >
        {visibilityOptions.map((opt) => (
          <ToggleButton key={opt} value={opt}>
            {opt}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
