import { useMemo, useState } from "react";
import { useStoredOrgs, useStoredRepos } from "./useStoredData";
import { formatRelativeTime } from "../utils/localStore";

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
  source?: "mock" | "chain";
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
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
    source: "mock",
  },
  {
    id: "repo-9",
    name: "moonbeam-precompiles",
    organization: "Moonbeam Network",
    organizationColor: "#53CBC9",
    description:
      "Gas-optimised EVM precompiles bridging Substrate pallets to Solidity contracts on Moonbeam.",
    language: "Solidity",
    visibility: "Public",
    stars: 421,
    forks: 67,
    openIssues: 19,
    openPrs: 8,
    hasGrant: true,
    topics: ["evm", "precompile", "moonbeam"],
    updatedAt: "3h ago",
    updatedAtSort: 3,
    source: "mock",
  },
  {
    id: "repo-10",
    name: "astar-wasm-runtime",
    organization: "Astar Collective",
    organizationColor: "#00B8D9",
    description:
      "Wasm runtime for Astar with native cross-VM calls between ink! and Solidity contracts.",
    language: "Rust",
    visibility: "Public",
    stars: 276,
    forks: 33,
    openIssues: 11,
    openPrs: 4,
    hasGrant: true,
    topics: ["wasm", "astar", "cross-vm"],
    updatedAt: "8h ago",
    updatedAtSort: 8,
    source: "mock",
  },
  {
    id: "repo-11",
    name: "hydration-router",
    organization: "Hydration DAO",
    organizationColor: "#FF7043",
    description: "Smart router for the Hydration Omnipool with backtesting and simulation utilities.",
    language: "TypeScript",
    visibility: "Public",
    stars: 132,
    forks: 19,
    openIssues: 7,
    openPrs: 3,
    hasGrant: true,
    topics: ["defi", "router", "omnipool"],
    updatedAt: "2d ago",
    updatedAtSort: 48,
    source: "mock",
  },
  {
    id: "repo-12",
    name: "talisman-signet",
    organization: "Talisman Studio",
    organizationColor: "#D84315",
    description:
      "Enterprise-grade multisig interface with policy controls and transaction simulation.",
    language: "TypeScript",
    visibility: "Public",
    stars: 204,
    forks: 24,
    openIssues: 9,
    openPrs: 5,
    hasGrant: false,
    topics: ["multisig", "wallet", "security"],
    updatedAt: "12h ago",
    updatedAtSort: 12,
    source: "mock",
  },
  {
    id: "repo-13",
    name: "opengov-analytics",
    organization: "OpenGov Lab",
    organizationColor: "#FFB300",
    description:
      "Data pipeline and dashboards for OpenGov referenda, delegation graphs and conviction voting.",
    language: "Python",
    visibility: "Public",
    stars: 88,
    forks: 17,
    openIssues: 6,
    openPrs: 2,
    hasGrant: true,
    topics: ["governance", "analytics", "dashboards"],
    updatedAt: "1d ago",
    updatedAtSort: 24,
    source: "mock",
  },
  {
    id: "repo-14",
    name: "polkadot-light-client",
    organization: "Polkadot Research",
    organizationColor: "#7E57C2",
    description: "Experimental light client with Wasm-based verification for browser and mobile.",
    language: "Rust",
    visibility: "Public",
    stars: 198,
    forks: 26,
    openIssues: 12,
    openPrs: 4,
    hasGrant: true,
    topics: ["light-client", "wasm", "research"],
    updatedAt: "5d ago",
    updatedAtSort: 120,
    source: "mock",
  },
  {
    id: "repo-15",
    name: "runtime-metrics",
    organization: "Parity Builders",
    organizationColor: "#E6007A",
    description: "Prometheus exporters and Grafana dashboards for parachain runtime observability.",
    language: "Go",
    visibility: "Public",
    stars: 67,
    forks: 9,
    openIssues: 3,
    openPrs: 1,
    hasGrant: false,
    topics: ["observability", "runtime", "metrics"],
    updatedAt: "2w ago",
    updatedAtSort: 336,
    source: "mock",
  },
  {
    id: "repo-16",
    name: "ink-auditor",
    organization: "Substrate Labs",
    organizationColor: "#58AD95",
    description:
      "Static analysis tool for ink! contracts highlighting common vulnerabilities and gas pitfalls.",
    language: "Rust",
    visibility: "Public",
    stars: 109,
    forks: 14,
    openIssues: 5,
    openPrs: 2,
    hasGrant: true,
    topics: ["ink", "security", "audit"],
    updatedAt: "10h ago",
    updatedAtSort: 10,
    source: "mock",
  },
  {
    id: "repo-17",
    name: "xcm-relay-sim",
    organization: "XCM Workshop",
    organizationColor: "#64B5F6",
    description:
      "Reproducible simulator for XCM messaging across relay chains, bridge hubs and parachains.",
    language: "TypeScript",
    visibility: "Public",
    stars: 54,
    forks: 7,
    openIssues: 4,
    openPrs: 2,
    hasGrant: true,
    topics: ["xcm", "simulation", "testing"],
    updatedAt: "6h ago",
    updatedAtSort: 6,
    source: "mock",
  },
  {
    id: "repo-18",
    name: "dotschool-playground",
    organization: "DotSchool",
    organizationColor: "#B388FF",
    description:
      "Browser-based playground with interactive lessons running against a local dev node.",
    language: "JavaScript",
    visibility: "Public",
    stars: 31,
    forks: 6,
    openIssues: 2,
    openPrs: 1,
    hasGrant: false,
    topics: ["education", "playground"],
    updatedAt: "9d ago",
    updatedAtSort: 216,
    source: "mock",
  },
  {
    id: "repo-19",
    name: "kusama-treasury-bot",
    organization: "Kusama Collective",
    organizationColor: "#FFC107",
    description:
      "Notification bot streaming Kusama treasury proposals, bounties and tips to Matrix and Discord.",
    language: "TypeScript",
    visibility: "Public",
    stars: 42,
    forks: 8,
    openIssues: 3,
    openPrs: 0,
    hasGrant: false,
    topics: ["treasury", "bot", "kusama"],
    updatedAt: "4d ago",
    updatedAtSort: 96,
    source: "mock",
  },
  {
    id: "repo-20",
    name: "acala-liquid-staking",
    organization: "Acala Finance",
    organizationColor: "#FF4AA6",
    description: "Liquid staking derivative tokens with delegation strategies across validators.",
    language: "Solidity",
    visibility: "Public",
    stars: 145,
    forks: 20,
    openIssues: 6,
    openPrs: 3,
    hasGrant: true,
    topics: ["defi", "liquid-staking"],
    updatedAt: "1d ago",
    updatedAtSort: 24,
    source: "mock",
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

const validLanguages: RepoLanguage[] = [
  "Rust",
  "TypeScript",
  "JavaScript",
  "Python",
  "Solidity",
  "Go",
];

function normaliseLanguage(value: string): RepoLanguage {
  return (validLanguages as string[]).includes(value)
    ? (value as RepoLanguage)
    : "TypeScript";
}

export function useRepositories() {
  const [filters, setFilters] = useState<RepositoryFilters>(defaultFilters);
  const storedRepos = useStoredRepos();
  const storedOrgs = useStoredOrgs();

  const repositories = useMemo<RepositoryDetail[]>(() => {
    const orgLookup = new Map(storedOrgs.map((o) => [o.orgId, o]));
    const mockOrgLookup = new Map<string, string>();
    mockRepositories.forEach((r) => mockOrgLookup.set(r.organization, r.organizationColor));

    const mapped: RepositoryDetail[] = storedRepos.map((repo) => {
      const parent = orgLookup.get(repo.orgId);
      const organization = parent?.name ?? `Org #${repo.orgId}`;
      const organizationColor =
        parent?.avatarColor ?? mockOrgLookup.get(organization) ?? "#E6007A";
      const ageMs = Date.now() - new Date(repo.createdAt).getTime();
      return {
        id: repo.repoId,
        name: repo.name,
        organization,
        organizationColor,
        description:
          repo.description || "Repository registered on-chain via DotForge.",
        language: normaliseLanguage(repo.language),
        visibility: repo.visibility,
        stars: 0,
        forks: 0,
        openIssues: 0,
        openPrs: 0,
        hasGrant: false,
        topics: repo.topics.length > 0 ? repo.topics : ["on-chain"],
        updatedAt: formatRelativeTime(repo.createdAt),
        updatedAtSort: Math.max(0, ageMs / 3_600_000),
        source: "chain",
      } satisfies RepositoryDetail;
    });

    return [...mapped, ...mockRepositories];
  }, [storedRepos, storedOrgs]);

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
