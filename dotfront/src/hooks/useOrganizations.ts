import { useMemo, useState } from "react";

export type OrgRole = "Owner" | "Admin" | "Member" | "Contributor";
export type OrgCategory =
  | "Infrastructure"
  | "DeFi"
  | "Tooling"
  | "Research"
  | "Governance"
  | "Education";

export type OrganizationDetail = {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatarColor: string;
  category: OrgCategory;
  verified: boolean;
  role: OrgRole;
  members: number;
  repositories: number;
  activeGrants: number;
  totalFunded: string;
  joinedAt: string;
};

const mockOrganizations: OrganizationDetail[] = [
  {
    id: "org-1",
    name: "Parity Builders",
    handle: "@parity-builders",
    description:
      "Core contributors to the Polkadot SDK building runtime modules, tooling and reference pallets.",
    avatarColor: "#E6007A",
    category: "Infrastructure",
    verified: true,
    role: "Admin",
    members: 24,
    repositories: 9,
    activeGrants: 3,
    totalFunded: "58.2K DOT",
    joinedAt: "Jan 2024",
  },
  {
    id: "org-2",
    name: "Substrate Labs",
    handle: "@substrate-labs",
    description:
      "Independent lab delivering ink! templates, developer guides and smart contract infrastructure.",
    avatarColor: "#58AD95",
    category: "Tooling",
    verified: true,
    role: "Member",
    members: 18,
    repositories: 12,
    activeGrants: 2,
    totalFunded: "31.0K DOT",
    joinedAt: "Mar 2024",
  },
  {
    id: "org-3",
    name: "Kusama Collective",
    handle: "@kusama-collective",
    description:
      "Community-driven collective experimenting with governance, bridges and canary-net deployments.",
    avatarColor: "#FFC107",
    category: "Governance",
    verified: true,
    role: "Contributor",
    members: 31,
    repositories: 7,
    activeGrants: 4,
    totalFunded: "42.8K DOT",
    joinedAt: "Nov 2023",
  },
  {
    id: "org-4",
    name: "XCM Workshop",
    handle: "@xcm-workshop",
    description: "Research group focused on cross-consensus messaging, HRMP channels and testing tooling.",
    avatarColor: "#64B5F6",
    category: "Research",
    verified: false,
    role: "Owner",
    members: 11,
    repositories: 5,
    activeGrants: 1,
    totalFunded: "8.5K DOT",
    joinedAt: "Jun 2024",
  },
  {
    id: "org-5",
    name: "Acala Finance",
    handle: "@acala-finance",
    description: "DeFi primitives for Polkadot: stablecoins, liquid staking and EVM+ compatibility.",
    avatarColor: "#FF4AA6",
    category: "DeFi",
    verified: true,
    role: "Member",
    members: 27,
    repositories: 14,
    activeGrants: 2,
    totalFunded: "71.3K DOT",
    joinedAt: "Feb 2024",
  },
  {
    id: "org-6",
    name: "DotSchool",
    handle: "@dotschool",
    description:
      "Educational initiative running developer bootcamps, workshops and curated learning paths.",
    avatarColor: "#B388FF",
    category: "Education",
    verified: false,
    role: "Contributor",
    members: 8,
    repositories: 3,
    activeGrants: 1,
    totalFunded: "4.2K DOT",
    joinedAt: "Aug 2024",
  },
];

export type OrganizationSort = "recent" | "members" | "grants" | "funded";

export type OrganizationsFilters = {
  query: string;
  category: OrgCategory | "All";
  sort: OrganizationSort;
};

const defaultFilters: OrganizationsFilters = {
  query: "",
  category: "All",
  sort: "recent",
};

function parseFundedToNumber(value: string): number {
  const match = value.match(/([\d.]+)\s*K?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return value.toUpperCase().includes("K") ? num * 1000 : num;
}

export function useOrganizations() {
  const [filters, setFilters] = useState<OrganizationsFilters>(defaultFilters);

  const organizations = useMemo(() => mockOrganizations, []);

  const categories = useMemo<(OrgCategory | "All")[]>(
    () => [
      "All",
      "Infrastructure",
      "DeFi",
      "Tooling",
      "Research",
      "Governance",
      "Education",
    ],
    []
  );

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const byQuery = organizations.filter((org) => {
      if (filters.category !== "All" && org.category !== filters.category) return false;
      if (!query) return true;
      return (
        org.name.toLowerCase().includes(query) ||
        org.handle.toLowerCase().includes(query) ||
        org.description.toLowerCase().includes(query)
      );
    });

    const sorted = [...byQuery].sort((a, b) => {
      switch (filters.sort) {
        case "members":
          return b.members - a.members;
        case "grants":
          return b.activeGrants - a.activeGrants;
        case "funded":
          return parseFundedToNumber(b.totalFunded) - parseFundedToNumber(a.totalFunded);
        case "recent":
        default:
          return 0;
      }
    });

    return sorted;
  }, [organizations, filters]);

  const totals = useMemo(
    () => ({
      total: organizations.length,
      verified: organizations.filter((o) => o.verified).length,
      members: organizations.reduce((sum, o) => sum + o.members, 0),
      activeGrants: organizations.reduce((sum, o) => sum + o.activeGrants, 0),
    }),
    [organizations]
  );

  return {
    organizations: filtered,
    allOrganizations: organizations,
    categories,
    filters,
    setFilters,
    totals,
  };
}
