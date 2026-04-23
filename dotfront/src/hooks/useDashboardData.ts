import { useMemo } from "react";
import { useStoredDeposits, useStoredOrgs, useStoredRepos } from "./useStoredData";
import { formatRelativeTime } from "../utils/localStore";

export type StatTrend = "up" | "down" | "flat";

export type Stat = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: StatTrend;
};

export type Organization = {
  id: string;
  name: string;
  handle: string;
  members: number;
  repositories: number;
  activeGrants: number;
  avatarColor: string;
  source?: "mock" | "chain";
};

export type Repository = {
  id: string;
  name: string;
  organization: string;
  language: string;
  stars: number;
  openIssues: number;
  updatedAt: string;
  source?: "mock" | "chain";
};

export type GrantStatus = "Active" | "Review" | "Completed" | "Draft";

export type Grant = {
  id: string;
  title: string;
  organization: string;
  amount: string;
  currency: string;
  progress: number;
  status: GrantStatus;
  milestone: string;
};

export type ActivityKind =
  | "commit"
  | "grant"
  | "organization"
  | "repository"
  | "milestone";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
};

export type DashboardData = {
  stats: Stat[];
  organizations: Organization[];
  repositories: Repository[];
  grants: Grant[];
  activity: ActivityEvent[];
};

const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Parity Builders",
    handle: "@parity-builders",
    members: 24,
    repositories: 9,
    activeGrants: 3,
    avatarColor: "#E6007A",
    source: "mock",
  },
  {
    id: "org-2",
    name: "Substrate Labs",
    handle: "@substrate-labs",
    members: 18,
    repositories: 12,
    activeGrants: 2,
    avatarColor: "#58AD95",
    source: "mock",
  },
  {
    id: "org-3",
    name: "Kusama Collective",
    handle: "@kusama-collective",
    members: 31,
    repositories: 7,
    activeGrants: 4,
    avatarColor: "#FFC107",
    source: "mock",
  },
  {
    id: "org-4",
    name: "XCM Workshop",
    handle: "@xcm-workshop",
    members: 11,
    repositories: 5,
    activeGrants: 1,
    avatarColor: "#64B5F6",
    source: "mock",
  },
  {
    id: "org-5",
    name: "Moonbeam Network",
    handle: "@moonbeam",
    members: 42,
    repositories: 21,
    activeGrants: 5,
    avatarColor: "#53CBC9",
    source: "mock",
  },
  {
    id: "org-6",
    name: "Astar Collective",
    handle: "@astar-collective",
    members: 36,
    repositories: 18,
    activeGrants: 3,
    avatarColor: "#00B8D9",
    source: "mock",
  },
];

const mockRepositories: Repository[] = [
  {
    id: "repo-1",
    name: "pallet-forge",
    organization: "Parity Builders",
    language: "Rust",
    stars: 312,
    openIssues: 14,
    updatedAt: "2h ago",
    source: "mock",
  },
  {
    id: "repo-2",
    name: "ink-templates",
    organization: "Substrate Labs",
    language: "Rust",
    stars: 187,
    openIssues: 6,
    updatedAt: "5h ago",
    source: "mock",
  },
  {
    id: "repo-9",
    name: "moonbeam-precompiles",
    organization: "Moonbeam Network",
    language: "Solidity",
    stars: 421,
    openIssues: 19,
    updatedAt: "3h ago",
    source: "mock",
  },
  {
    id: "repo-10",
    name: "astar-wasm-runtime",
    organization: "Astar Collective",
    language: "Rust",
    stars: 276,
    openIssues: 11,
    updatedAt: "8h ago",
    source: "mock",
  },
  {
    id: "repo-3",
    name: "xcm-playground",
    organization: "XCM Workshop",
    language: "TypeScript",
    stars: 94,
    openIssues: 3,
    updatedAt: "1d ago",
    source: "mock",
  },
  {
    id: "repo-4",
    name: "kusama-bridge",
    organization: "Kusama Collective",
    language: "Rust",
    stars: 248,
    openIssues: 21,
    updatedAt: "2d ago",
    source: "mock",
  },
];

const mockGrants: Grant[] = [
  {
    id: "grant-1",
    title: "Cross-chain Identity Resolver",
    organization: "Parity Builders",
    amount: "12,500",
    currency: "DOT",
    progress: 65,
    status: "Active",
    milestone: "Milestone 2 of 3",
  },
  {
    id: "grant-2",
    title: "Ink! Developer Tooling",
    organization: "Substrate Labs",
    amount: "8,000",
    currency: "DOT",
    progress: 40,
    status: "Active",
    milestone: "Milestone 1 of 3",
  },
  {
    id: "grant-8",
    title: "Moonbeam Precompile Library",
    organization: "Moonbeam Network",
    amount: "15,000",
    currency: "DOT",
    progress: 50,
    status: "Active",
    milestone: "Milestone 1 of 3",
  },
  {
    id: "grant-3",
    title: "XCM Testing Framework",
    organization: "XCM Workshop",
    amount: "5,200",
    currency: "DOT",
    progress: 90,
    status: "Review",
    milestone: "Final review",
  },
  {
    id: "grant-10",
    title: "Hydration Omnipool Router",
    organization: "Hydration DAO",
    amount: "6,800",
    currency: "DOT",
    progress: 80,
    status: "Review",
    milestone: "Security review",
  },
];

const mockActivity: ActivityEvent[] = [
  {
    id: "act-1",
    kind: "grant",
    title: "Grant awarded",
    description: "Cross-chain Identity Resolver received Milestone 2 payout",
    actor: "Parity Builders",
    timestamp: "12m ago",
  },
  {
    id: "act-2",
    kind: "commit",
    title: "New commit on pallet-forge",
    description: "feat: add runtime upgrade hooks for forge pallet",
    actor: "alice.dot",
    timestamp: "1h ago",
  },
  {
    id: "act-3",
    kind: "organization",
    title: "New organization",
    description: "XCM Workshop joined DotForge",
    actor: "@xcm-workshop",
    timestamp: "3h ago",
  },
  {
    id: "act-4",
    kind: "milestone",
    title: "Milestone submitted",
    description: "Ink! Developer Tooling submitted Milestone 1 for review",
    actor: "Substrate Labs",
    timestamp: "6h ago",
  },
  {
    id: "act-6",
    kind: "commit",
    title: "New commits on moonbeam-precompiles",
    description: "feat: stake and delegate precompiles with tests",
    actor: "greta.dot",
    timestamp: "8h ago",
  },
  {
    id: "act-5",
    kind: "repository",
    title: "Repository created",
    description: "kusama-bridge was created under Kusama Collective",
    actor: "bob.dot",
    timestamp: "1d ago",
  },
];

function formatDot(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K DOT`;
  }
  return `${amount} DOT`;
}

export function useDashboardData(): DashboardData {
  const storedOrgs = useStoredOrgs();
  const storedRepos = useStoredRepos();
  const storedDeposits = useStoredDeposits();

  return useMemo<DashboardData>(() => {
    const chainOrgs: Organization[] = storedOrgs.map((org) => {
      const repoCount = storedRepos.filter((r) => r.orgId === org.orgId).length;
      return {
        id: org.orgId,
        name: org.name,
        handle: org.handle.startsWith("@") ? org.handle : `@${org.handle}`,
        members: 1,
        repositories: repoCount,
        activeGrants: 0,
        avatarColor: org.avatarColor || "#E6007A",
        source: "chain",
      };
    });

    const orgLookup = new Map(storedOrgs.map((o) => [o.orgId, o]));
    const chainRepos: Repository[] = storedRepos.map((repo) => ({
      id: repo.repoId,
      name: repo.name,
      organization: orgLookup.get(repo.orgId)?.name ?? `Org #${repo.orgId}`,
      language: repo.language,
      stars: 0,
      openIssues: 0,
      updatedAt: formatRelativeTime(repo.createdAt),
      source: "chain",
    }));

    const organizations = [...chainOrgs, ...mockOrganizations];
    const repositories = [...chainRepos, ...mockRepositories];

    const extraDepositDot = storedDeposits.reduce((sum, d) => {
      try {
        return sum + Number(BigInt(d.amount));
      } catch {
        return sum;
      }
    }, 0);

    const baseFunded = 142_500;
    const totalFunded = baseFunded + extraDepositDot;

    const stats: Stat[] = [
      {
        id: "orgs",
        label: "Organizations",
        value: organizations.length.toString(),
        delta:
          chainOrgs.length > 0
            ? `+${chainOrgs.length} on-chain`
            : "+2 this month",
        trend: "up",
      },
      {
        id: "repos",
        label: "Active Repositories",
        value: repositories.length.toString(),
        delta:
          chainRepos.length > 0
            ? `+${chainRepos.length} on-chain`
            : "+7 this week",
        trend: "up",
      },
      {
        id: "grants",
        label: "Open Grants",
        value: "14",
        delta: "5 pending review",
        trend: "flat",
      },
      {
        id: "funded",
        label: "Total Funded",
        value: formatDot(totalFunded),
        delta:
          storedDeposits.length > 0
            ? `+${storedDeposits.length} deposit${storedDeposits.length > 1 ? "s" : ""}`
            : "+8.2% vs last month",
        trend: "up",
      },
    ];

    return {
      stats,
      organizations,
      repositories,
      grants: mockGrants,
      activity: mockActivity,
    };
  }, [storedOrgs, storedRepos, storedDeposits]);
}
