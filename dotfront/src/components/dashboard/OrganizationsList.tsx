import { Avatar, Box, Chip, Stack, Typography, alpha } from "@mui/material";
import type { Organization } from "../../hooks/useDashboardData";

type Props = {
  organizations: Organization[];
};

export default function OrganizationsList({ organizations }: Props) {
  return (
    <Stack spacing={1.5}>
      {organizations.map((org) => (
        <Box
          key={org.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha("#FFFFFF", 0.04)}`,
            transition: "background-color 150ms ease, border-color 150ms ease",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: alpha("#FFFFFF", 0.03),
              borderColor: alpha("#E6007A", 0.3),
            },
          }}
        >
          <Avatar
            sx={{
              bgcolor: org.avatarColor,
              color: "#141414",
              fontWeight: 700,
              width: 40,
              height: 40,
            }}
          >
            {org.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {org.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {org.handle} · {org.members} members · {org.repositories} repos
            </Typography>
          </Box>
          <Chip
            label={`${org.activeGrants} grants`}
            size="small"
            sx={{
              backgroundColor: alpha("#E6007A", 0.15),
              color: "#FF4AA6",
              fontWeight: 500,
              flexShrink: 0,
            }}
          />
        </Box>
      ))}
    </Stack>
  );
}
