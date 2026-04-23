import { useMemo } from "react";

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
};

export type Repository = {
  id: string;
  name: string;
  organization: string;
  language: string;
  stars: number;
  openIssues: number;
  updatedAt: string;
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

const mockData: DashboardData = {
  stats: [
    { id: "orgs", label: "Organizations", value: "12", delta: "+2 this month", trend: "up" },
    { id: "repos", label: "Active Repositories", value: "48", delta: "+7 this week", trend: "up" },
    { id: "grants", label: "Open Grants", value: "9", delta: "3 pending review", trend: "flat" },
    { id: "funded", label: "Total Funded", value: "142.5K DOT", delta: "+8.2% vs last month", trend: "up" },
  ],
  organizations: [
    {
      id: "org-1",
      name: "Parity Builders",
      handle: "@parity-builders",
      members: 24,
      repositories: 9,
      activeGrants: 3,
      avatarColor: "#E6007A",
    },
    {
      id: "org-2",
      name: "Substrate Labs",
      handle: "@substrate-labs",
      members: 18,
      repositories: 12,
      activeGrants: 2,
      avatarColor: "#58AD95",
    },
    {
      id: "org-3",
      name: "Kusama Collective",
      handle: "@kusama-collective",
      members: 31,
      repositories: 7,
      activeGrants: 4,
      avatarColor: "#FFC107",
    },
    {
      id: "org-4",
      name: "XCM Workshop",
      handle: "@xcm-workshop",
      members: 11,
      repositories: 5,
      activeGrants: 1,
      avatarColor: "#64B5F6",
    },
  ],
  repositories: [
    {
      id: "repo-1",
      name: "pallet-forge",
      organization: "Parity Builders",
      language: "Rust",
      stars: 312,
      openIssues: 14,
      updatedAt: "2h ago",
    },
    {
      id: "repo-2",
      name: "ink-templates",
      organization: "Substrate Labs",
      language: "Rust",
      stars: 187,
      openIssues: 6,
      updatedAt: "5h ago",
    },
    {
      id: "repo-3",
      name: "xcm-playground",
      organization: "XCM Workshop",
      language: "TypeScript",
      stars: 94,
      openIssues: 3,
      updatedAt: "1d ago",
    },
    {
      id: "repo-4",
      name: "kusama-bridge",
      organization: "Kusama Collective",
      language: "Rust",
      stars: 248,
      openIssues: 21,
      updatedAt: "2d ago",
    },
  ],
  grants: [
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
      id: "grant-3",
      title: "XCM Testing Framework",
      organization: "XCM Workshop",
      amount: "5,200",
      currency: "DOT",
      progress: 90,
      status: "Review",
      milestone: "Final review",
    },
  ],
  activity: [
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
      id: "act-5",
      kind: "repository",
      title: "Repository created",
      description: "kusama-bridge was created under Kusama Collective",
      actor: "bob.dot",
      timestamp: "1d ago",
    },
  ],
};

export function useDashboardData(): DashboardData {
  return useMemo(() => mockData, []);
}
