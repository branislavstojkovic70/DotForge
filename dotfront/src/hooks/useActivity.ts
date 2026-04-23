import { useMemo, useState } from "react";

export type ActivityKind =
  | "commit"
  | "grant_awarded"
  | "grant_submitted"
  | "milestone_approved"
  | "milestone_rejected"
  | "repo_created"
  | "org_created"
  | "member_joined"
  | "deposit"
  | "pull_request";

export type ActivityEventDetail = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actor: string;
  actorColor: string;
  organization: string;
  repository?: string;
  amount?: string;
  txHash?: string;
  timestamp: string;
  dayGroup: string;
};

const mockEvents: ActivityEventDetail[] = [
  {
    id: "act-1",
    kind: "grant_awarded",
    title: "Grant milestone paid out",
    description:
      "Cross-chain Identity Resolver received 5,625 DOT for completing Milestone 2.",
    actor: "DotForge Treasury",
    actorColor: "#E6007A",
    organization: "Parity Builders",
    amount: "5,625 DOT",
    txHash: "0x7a3f…b2c1",
    timestamp: "12m ago",
    dayGroup: "Today",
  },
  {
    id: "act-2",
    kind: "commit",
    title: "Pushed 3 commits to pallet-forge",
    description: "feat: add runtime upgrade hooks for forge pallet",
    actor: "alice.dot",
    actorColor: "#58AD95",
    organization: "Parity Builders",
    repository: "pallet-forge",
    timestamp: "1h ago",
    dayGroup: "Today",
  },
  {
    id: "act-3",
    kind: "pull_request",
    title: "Opened PR #142 on ink-templates",
    description: "Refactor storage scaffolder and add integration tests.",
    actor: "bob.dot",
    actorColor: "#64B5F6",
    organization: "Substrate Labs",
    repository: "ink-templates",
    timestamp: "2h ago",
    dayGroup: "Today",
  },
  {
    id: "act-4",
    kind: "org_created",
    title: "New organization created",
    description: "XCM Workshop joined DotForge as a Research collective.",
    actor: "charlie.dot",
    actorColor: "#FFC107",
    organization: "XCM Workshop",
    timestamp: "3h ago",
    dayGroup: "Today",
  },
  {
    id: "act-5",
    kind: "milestone_approved",
    title: "Milestone approved",
    description: "Ink! Developer Tooling — Milestone 1 approved by the audit board.",
    actor: "Audit Board",
    actorColor: "#B388FF",
    organization: "Substrate Labs",
    timestamp: "6h ago",
    dayGroup: "Today",
  },
  {
    id: "act-6",
    kind: "repo_created",
    title: "Repository created",
    description: "kusama-bridge was added under Kusama Collective.",
    actor: "dana.dot",
    actorColor: "#FF4AA6",
    organization: "Kusama Collective",
    repository: "kusama-bridge",
    timestamp: "1d ago",
    dayGroup: "Yesterday",
  },
  {
    id: "act-7",
    kind: "deposit",
    title: "Treasury deposit",
    description: "Parity Builders deposited 10,000 DOT to the org treasury.",
    actor: "Parity Builders",
    actorColor: "#E6007A",
    organization: "Parity Builders",
    amount: "10,000 DOT",
    txHash: "0x21af…9d42",
    timestamp: "1d ago",
    dayGroup: "Yesterday",
  },
  {
    id: "act-8",
    kind: "grant_submitted",
    title: "Grant submitted for review",
    description: "XCM Testing Framework submitted the final milestone for review.",
    actor: "XCM Workshop",
    actorColor: "#64B5F6",
    organization: "XCM Workshop",
    timestamp: "2d ago",
    dayGroup: "This week",
  },
  {
    id: "act-9",
    kind: "member_joined",
    title: "New member joined",
    description: "evelyn.dot joined Acala Finance as a contributor.",
    actor: "evelyn.dot",
    actorColor: "#58AD95",
    organization: "Acala Finance",
    timestamp: "3d ago",
    dayGroup: "This week",
  },
  {
    id: "act-10",
    kind: "commit",
    title: "Pushed 7 commits to acala-stable-swap",
    description: "fix: slippage calculation in LP withdrawal path",
    actor: "frank.dot",
    actorColor: "#FF4AA6",
    organization: "Acala Finance",
    repository: "acala-stable-swap",
    timestamp: "4d ago",
    dayGroup: "This week",
  },
  {
    id: "act-11",
    kind: "milestone_rejected",
    title: "Milestone sent back",
    description:
      "Parachain Governance Client — Milestone 2 returned with review comments.",
    actor: "Audit Board",
    actorColor: "#B388FF",
    organization: "Parity Builders",
    timestamp: "5d ago",
    dayGroup: "This week",
  },
  {
    id: "act-12",
    kind: "pull_request",
    title: "Merged PR #98 on xcm-playground",
    description: "Add HRMP channel simulator and docs.",
    actor: "charlie.dot",
    actorColor: "#FFC107",
    organization: "XCM Workshop",
    repository: "xcm-playground",
    timestamp: "1w ago",
    dayGroup: "Earlier",
  },
];

export type ActivityFilterKind = ActivityKind | "All";
export type ActivitySort = "recent" | "oldest";

export type ActivityFilters = {
  query: string;
  kind: ActivityFilterKind;
  sort: ActivitySort;
};

const defaultFilters: ActivityFilters = {
  query: "",
  kind: "All",
  sort: "recent",
};

export const kindLabels: Record<ActivityKind, string> = {
  commit: "Commits",
  grant_awarded: "Grants awarded",
  grant_submitted: "Grant submissions",
  milestone_approved: "Milestones approved",
  milestone_rejected: "Milestones rejected",
  repo_created: "Repositories",
  org_created: "Organizations",
  member_joined: "Members",
  deposit: "Deposits",
  pull_request: "Pull requests",
};

export function useActivity() {
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);

  const events = useMemo(() => mockEvents, []);

  const kinds = useMemo<ActivityFilterKind[]>(
    () => ["All", ...(Object.keys(kindLabels) as ActivityKind[])],
    []
  );

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const byFilters = events.filter((event) => {
      if (filters.kind !== "All" && event.kind !== filters.kind) return false;
      if (!query) return true;
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.actor.toLowerCase().includes(query) ||
        event.organization.toLowerCase().includes(query) ||
        (event.repository?.toLowerCase().includes(query) ?? false)
      );
    });

    if (filters.sort === "oldest") {
      return [...byFilters].reverse();
    }
    return byFilters;
  }, [events, filters]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityEventDetail[]>();
    filtered.forEach((event) => {
      const list = groups.get(event.dayGroup) ?? [];
      list.push(event);
      groups.set(event.dayGroup, list);
    });
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [filtered]);

  const totals = useMemo(() => {
    const total = events.length;
    const commits = events.filter((e) => e.kind === "commit").length;
    const grantsAwarded = events.filter((e) => e.kind === "grant_awarded").length;
    const organizations = new Set(events.map((e) => e.organization)).size;
    return { total, commits, grantsAwarded, organizations };
  }, [events]);

  return {
    grouped,
    events: filtered,
    allEvents: events,
    kinds,
    filters,
    setFilters,
    totals,
  };
}
