import { useMemo, useState } from "react";

export type RepoVisibility = "Public" | "Private";
export type RepoLanguage = "Rust" | "TypeScript" | "JavaScript" | "Python" | "Solidity" | "Go";

export type RepositoryDetail = {
  id: string;
  name: string;
  organization: string;
  organizationColor: string;
  description: string;
  language: RepoLanguage;
  visibility: RepoVisibility;
  stars: number;
  forks: number;
  openIssues: number;
  openPrs: number;
  hasGrant: boolean;
  topics: string[];
  updatedAt: string;
  updatedAtSort: number;
};

export const languageColors: Record<RepoLanguage, string> = {
  Rust: "#DEA584",
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
  Solidity: "#AA6746",
  Go: "#00ADD8",
};

const mockRepositories: RepositoryDetail[] = [
  {
    id: "repo-1",
    name: "pallet-forge",
    organization: "Parity Builders",
    organizationColor: "#E6007A",
    description:
      "Runtime pallet for on-chain organization registry, repository tracking and grant accounting.",
    language: "Rust",
    visibility: "Public",
    stars: 312,
    forks: 41,
    openIssues: 14,
    openPrs: 6,
    hasGrant: true,
    topics: ["substrate", "pallet", "governance"],
    updatedAt: "2h ago",
    updatedAtSort: 2,
  },
  {
    id: "repo-2",
    name: "ink-templates",
    organization: "Substrate Labs",
    organizationColor: "#58AD95",
    description: "Opinionated ink! smart contract templates with tests, deploy scripts and docs.",
    language: "Rust",
    visibility: "Public",
    stars: 187,
    forks: 28,
    openIssues: 6,
    openPrs: 2,
    hasGrant: true,
    topics: ["ink", "smart-contracts", "templates"],
    updatedAt: "5h ago",
    updatedAtSort: 5,
  },
  {
    id: "repo-3",
    name: "xcm-playground",
    organization: "XCM Workshop",
    organizationColor: "#64B5F6",
    description: "Interactive playground for crafting and simulating XCM messages across parachains.",
    language: "TypeScript",
    visibility: "Public",
    stars: 94,
    forks: 12,
    openIssues: 3,
    openPrs: 1,
    hasGrant: false,
    topics: ["xcm", "tooling", "playground"],
    updatedAt: "1d ago",
    updatedAtSort: 24,
  },
  {
    id: "repo-4",
    name: "kusama-bridge",
    organization: "Kusama Collective",
    organizationColor: "#FFC107",
    description: "Trust-minimized bridge contracts between Kusama parachains and external networks.",
    language: "Rust",
    visibility: "Public",
    stars: 248,
    forks: 35,
    openIssues: 21,
    openPrs: 9,
    hasGrant: true,
    topics: ["bridge", "kusama", "interop"],
    updatedAt: "2d ago",
    updatedAtSort: 48,
  },
  {
    id: "repo-5",
    name: "acala-stable-swap",
    organization: "Acala Finance",
    organizationColor: "#FF4AA6",
    description: "Low-slippage stablecoin AMM optimized for acUSD and cross-chain assets.",
    language: "Solidity",
    visibility: "Public",
    stars: 163,
    forks: 22,
    openIssues: 8,
    openPrs: 3,
    hasGrant: true,
    topics: ["defi", "amm", "stablecoin"],
    updatedAt: "3d ago",
    updatedAtSort: 72,
  },
  {
    id: "repo-6",
    name: "dotschool-curriculum",
    organization: "DotSchool",
    organizationColor: "#B388FF",
    description: "Open-source curriculum, labs and quizzes for Polkadot developer bootcamps.",
    language: "TypeScript",
    visibility: "Public",
    stars: 58,
    forks: 14,
    openIssues: 4,
    openPrs: 0,
    hasGrant: false,
    topics: ["education", "curriculum"],
    updatedAt: "4d ago",
    updatedAtSort: 96,
  },
  {
    id: "repo-7",
    name: "xcm-monitor",
    organization: "XCM Workshop",
    organizationColor: "#64B5F6",
    description: "Private dashboard service tracking XCM channel health, throughput and failures.",
    language: "Go",
    visibility: "Private",
    stars: 0,
    forks: 0,
    openIssues: 2,
    openPrs: 1,
    hasGrant: false,
    topics: ["monitoring", "xcm"],
    updatedAt: "6d ago",
    updatedAtSort: 144,
  },
  {
    id: "repo-8",
    name: "grant-scoring",
    organization: "Parity Builders",
    organizationColor: "#E6007A",
    description: "Heuristics and ML models for scoring grant applications based on historical data.",
    language: "Python",
    visibility: "Public",
    stars: 72,
    forks: 11,
    openIssues: 5,
    openPrs: 2,
    hasGrant: false,
    topics: ["ml", "grants", "analytics"],
    updatedAt: "1w ago",
    updatedAtSort: 168,
  },
];

export type RepositorySort = "recent" | "stars" | "issues" | "name";
export type VisibilityFilter = RepoVisibility | "All";
export type LanguageFilter = RepoLanguage | "All";

export type RepositoryFilters = {
  query: string;
  language: LanguageFilter;
  visibility: VisibilityFilter;
  sort: RepositorySort;
};

const defaultFilters: RepositoryFilters = {
  query: "",
  language: "All",
  visibility: "All",
  sort: "recent",
};

export function useRepositories() {
  const [filters, setFilters] = useState<RepositoryFilters>(defaultFilters);

  const repositories = useMemo(() => mockRepositories, []);

  const languages = useMemo<LanguageFilter[]>(() => {
    const set = new Set<RepoLanguage>();
    repositories.forEach((r) => set.add(r.language));
    return ["All", ...Array.from(set)];
  }, [repositories]);

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const byFilters = repositories.filter((repo) => {
      if (filters.language !== "All" && repo.language !== filters.language) return false;
      if (filters.visibility !== "All" && repo.visibility !== filters.visibility) return false;
      if (!query) return true;
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.organization.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query) ||
        repo.topics.some((t) => t.toLowerCase().includes(query))
      );
    });

    const sorted = [...byFilters].sort((a, b) => {
      switch (filters.sort) {
        case "stars":
          return b.stars - a.stars;
        case "issues":
          return b.openIssues - a.openIssues;
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
        default:
          return a.updatedAtSort - b.updatedAtSort;
      }
    });

    return sorted;
  }, [repositories, filters]);

  const totals = useMemo(
    () => ({
      total: repositories.length,
      publicCount: repositories.filter((r) => r.visibility === "Public").length,
      withGrants: repositories.filter((r) => r.hasGrant).length,
      openIssues: repositories.reduce((sum, r) => sum + r.openIssues, 0),
    }),
    [repositories]
  );

  return {
    repositories: filtered,
    allRepositories: repositories,
    languages,
    filters,
    setFilters,
    totals,
  };
}
