import { useMemo, useState } from "react";
import { useStoredDeposits, useStoredOrgs, useStoredRepos } from "./useStoredData";
import { formatRelativeTime } from "../utils/localStore";

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
  source?: "mock" | "chain";
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
  },
  {
    id: "org-4",
    name: "XCM Workshop",
    handle: "@xcm-workshop",
    description:
      "Research group focused on cross-consensus messaging, HRMP channels and testing tooling.",
    avatarColor: "#64B5F6",
    category: "Research",
    verified: false,
    role: "Owner",
    members: 11,
    repositories: 5,
    activeGrants: 1,
    totalFunded: "8.5K DOT",
    joinedAt: "Jun 2024",
    source: "mock",
  },
  {
    id: "org-5",
    name: "Acala Finance",
    handle: "@acala-finance",
    description:
      "DeFi primitives for Polkadot: stablecoins, liquid staking and EVM+ compatibility.",
    avatarColor: "#FF4AA6",
    category: "DeFi",
    verified: true,
    role: "Member",
    members: 27,
    repositories: 14,
    activeGrants: 2,
    totalFunded: "71.3K DOT",
    joinedAt: "Feb 2024",
    source: "mock",
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
    source: "mock",
  },
  {
    id: "org-7",
    name: "Moonbeam Network",
    handle: "@moonbeam",
    description:
      "EVM-compatible smart contract platform on Polkadot, bringing Ethereum tooling into the ecosystem.",
    avatarColor: "#53CBC9",
    category: "Infrastructure",
    verified: true,
    role: "Member",
    members: 42,
    repositories: 21,
    activeGrants: 5,
    totalFunded: "96.4K DOT",
    joinedAt: "Oct 2023",
    source: "mock",
  },
  {
    id: "org-8",
    name: "Astar Collective",
    handle: "@astar-collective",
    description:
      "Multichain hub specialising in Wasm and EVM dApps with native cross-VM messaging patterns.",
    avatarColor: "#00B8D9",
    category: "Infrastructure",
    verified: true,
    role: "Contributor",
    members: 36,
    repositories: 18,
    activeGrants: 3,
    totalFunded: "62.9K DOT",
    joinedAt: "Sep 2023",
    source: "mock",
  },
  {
    id: "org-9",
    name: "Hydration DAO",
    handle: "@hydration-dao",
    description:
      "Omnipool-based DeFi DAO focused on liquidity routing, LRTs and governance-driven incentives.",
    avatarColor: "#FF7043",
    category: "DeFi",
    verified: true,
    role: "Member",
    members: 19,
    repositories: 11,
    activeGrants: 2,
    totalFunded: "48.7K DOT",
    joinedAt: "May 2024",
    source: "mock",
  },
  {
    id: "org-10",
    name: "Talisman Studio",
    handle: "@talisman-studio",
    description:
      "Wallet and identity tooling team building Talisman, Signet and multi-chain UX primitives.",
    avatarColor: "#D84315",
    category: "Tooling",
    verified: true,
    role: "Member",
    members: 15,
    repositories: 9,
    activeGrants: 1,
    totalFunded: "22.4K DOT",
    joinedAt: "Apr 2024",
    source: "mock",
  },
  {
    id: "org-11",
    name: "Polkadot Research",
    handle: "@dot-research",
    description:
      "Technical research arm exploring consensus, cryptography and sharded rollup architectures.",
    avatarColor: "#7E57C2",
    category: "Research",
    verified: true,
    role: "Contributor",
    members: 22,
    repositories: 6,
    activeGrants: 3,
    totalFunded: "54.0K DOT",
    joinedAt: "Jul 2023",
    source: "mock",
  },
  {
    id: "org-12",
    name: "OpenGov Lab",
    handle: "@opengov-lab",
    description:
      "Governance analytics, delegation dashboards and voting UX research for OpenGov on Polkadot.",
    avatarColor: "#FFB300",
    category: "Governance",
    verified: false,
    role: "Member",
    members: 9,
    repositories: 4,
    activeGrants: 2,
    totalFunded: "11.8K DOT",
    joinedAt: "Jan 2025",
    source: "mock",
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

function formatFunded(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k.toFixed(k >= 10 || amount % 1000 === 0 ? 0 : 1)}K DOT`;
  }
  return `${amount} DOT`;
}

export function useOrganizations() {
  const [filters, setFilters] = useState<OrganizationsFilters>(defaultFilters);
  const storedOrgs = useStoredOrgs();
  const storedRepos = useStoredRepos();
  const storedDeposits = useStoredDeposits();

  const organizations = useMemo<OrganizationDetail[]>(() => {
    const mapped: OrganizationDetail[] = storedOrgs.map((org) => {
      const repoCount = storedRepos.filter((r) => r.orgId === org.orgId).length;
      const funded = storedDeposits
        .filter((d) => d.orgId === org.orgId)
        .reduce((sum, d) => {
          try {
            return sum + Number(BigInt(d.amount));
          } catch {
            return sum;
          }
        }, 0);
      return {
        id: org.orgId,
        name: org.name,
        handle: org.handle.startsWith("@") ? org.handle : `@${org.handle}`,
        description: org.description || "On-chain organization registered via DotForge.",
        avatarColor: org.avatarColor || "#E6007A",
        category: org.category,
        verified: false,
        role: "Owner",
        members: 1,
        repositories: repoCount,
        activeGrants: 0,
        totalFunded: formatFunded(funded),
        joinedAt: formatRelativeTime(org.createdAt),
        source: "chain",
      } satisfies OrganizationDetail;
    });
    return [...mapped, ...mockOrganizations];
  }, [storedOrgs, storedRepos, storedDeposits]);

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
          if (a.source === "chain" && b.source !== "chain") return -1;
          if (b.source === "chain" && a.source !== "chain") return 1;
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
