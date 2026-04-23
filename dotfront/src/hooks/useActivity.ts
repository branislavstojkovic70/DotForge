import { useMemo, useState } from "react";
import { useStoredDeposits, useStoredOrgs, useStoredRepos } from "./useStoredData";
import { dayGroupFor, formatRelativeTime } from "../utils/localStore";

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
  createdAtMs: number;
  source?: "mock" | "chain";
};

const now = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function at(offsetMs: number): number {
  return now - offsetMs;
}

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
    createdAtMs: at(12 * MIN),
    source: "mock",
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
    createdAtMs: at(1 * HOUR),
    source: "mock",
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
    createdAtMs: at(2 * HOUR),
    source: "mock",
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
    createdAtMs: at(3 * HOUR),
    source: "mock",
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
    createdAtMs: at(6 * HOUR),
    source: "mock",
  },
  {
    id: "act-6",
    kind: "commit",
    title: "Pushed 5 commits to moonbeam-precompiles",
    description: "feat: stake, delegate and compound precompiles with tests",
    actor: "greta.dot",
    actorColor: "#53CBC9",
    organization: "Moonbeam Network",
    repository: "moonbeam-precompiles",
    timestamp: "8h ago",
    dayGroup: "Today",
    createdAtMs: at(8 * HOUR),
    source: "mock",
  },
  {
    id: "act-7",
    kind: "deposit",
    title: "Treasury deposit",
    description: "Moonbeam Network deposited 7,500 DOT to the org treasury.",
    actor: "Moonbeam Network",
    actorColor: "#53CBC9",
    organization: "Moonbeam Network",
    amount: "7,500 DOT",
    txHash: "0x9b22…4ee8",
    timestamp: "10h ago",
    dayGroup: "Today",
    createdAtMs: at(10 * HOUR),
    source: "mock",
  },
  {
    id: "act-8",
    kind: "pull_request",
    title: "Merged PR #57 on astar-wasm-runtime",
    description: "Cross-VM calls between ink! and Solidity with gas accounting fixes.",
    actor: "harley.dot",
    actorColor: "#00B8D9",
    organization: "Astar Collective",
    repository: "astar-wasm-runtime",
    timestamp: "14h ago",
    dayGroup: "Today",
    createdAtMs: at(14 * HOUR),
    source: "mock",
  },
  {
    id: "act-9",
    kind: "repo_created",
    title: "Repository created",
    description: "kusama-bridge was added under Kusama Collective.",
    actor: "dana.dot",
    actorColor: "#FF4AA6",
    organization: "Kusama Collective",
    repository: "kusama-bridge",
    timestamp: "1d ago",
    dayGroup: "Yesterday",
    createdAtMs: at(1 * DAY),
    source: "mock",
  },
  {
    id: "act-10",
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
    createdAtMs: at(1 * DAY + 2 * HOUR),
    source: "mock",
  },
  {
    id: "act-11",
    kind: "grant_submitted",
    title: "Grant submitted for review",
    description: "XCM Testing Framework submitted the final milestone for review.",
    actor: "XCM Workshop",
    actorColor: "#64B5F6",
    organization: "XCM Workshop",
    timestamp: "1d ago",
    dayGroup: "Yesterday",
    createdAtMs: at(1 * DAY + 6 * HOUR),
    source: "mock",
  },
  {
    id: "act-12",
    kind: "member_joined",
    title: "New member joined",
    description: "evelyn.dot joined Acala Finance as a contributor.",
    actor: "evelyn.dot",
    actorColor: "#58AD95",
    organization: "Acala Finance",
    timestamp: "2d ago",
    dayGroup: "This week",
    createdAtMs: at(2 * DAY),
    source: "mock",
  },
  {
    id: "act-13",
    kind: "commit",
    title: "Pushed 7 commits to acala-stable-swap",
    description: "fix: slippage calculation in LP withdrawal path",
    actor: "frank.dot",
    actorColor: "#FF4AA6",
    organization: "Acala Finance",
    repository: "acala-stable-swap",
    timestamp: "2d ago",
    dayGroup: "This week",
    createdAtMs: at(2 * DAY + 3 * HOUR),
    source: "mock",
  },
  {
    id: "act-14",
    kind: "grant_awarded",
    title: "Grant milestone paid out",
    description:
      "Hydration Omnipool Router received 1,700 DOT for milestone 3 completion.",
    actor: "DotForge Treasury",
    actorColor: "#FF7043",
    organization: "Hydration DAO",
    amount: "1,700 DOT",
    txHash: "0xc4f1…0918",
    timestamp: "3d ago",
    dayGroup: "This week",
    createdAtMs: at(3 * DAY),
    source: "mock",
  },
  {
    id: "act-15",
    kind: "pull_request",
    title: "Opened PR #204 on talisman-signet",
    description: "Add rule-based signing policies with DSL parser.",
    actor: "ivy.dot",
    actorColor: "#D84315",
    organization: "Talisman Studio",
    repository: "talisman-signet",
    timestamp: "3d ago",
    dayGroup: "This week",
    createdAtMs: at(3 * DAY + 4 * HOUR),
    source: "mock",
  },
  {
    id: "act-16",
    kind: "milestone_rejected",
    title: "Milestone sent back",
    description:
      "Parachain Governance Client — Milestone 2 returned with review comments.",
    actor: "Audit Board",
    actorColor: "#B388FF",
    organization: "Parity Builders",
    timestamp: "4d ago",
    dayGroup: "This week",
    createdAtMs: at(4 * DAY),
    source: "mock",
  },
  {
    id: "act-17",
    kind: "member_joined",
    title: "New member joined",
    description: "jules.dot joined OpenGov Lab as an analyst.",
    actor: "jules.dot",
    actorColor: "#FFB300",
    organization: "OpenGov Lab",
    timestamp: "4d ago",
    dayGroup: "This week",
    createdAtMs: at(4 * DAY + 6 * HOUR),
    source: "mock",
  },
  {
    id: "act-18",
    kind: "deposit",
    title: "Treasury deposit",
    description: "Acala Finance deposited 15,000 DOT to the org treasury.",
    actor: "Acala Finance",
    actorColor: "#FF4AA6",
    organization: "Acala Finance",
    amount: "15,000 DOT",
    txHash: "0x83be…71a4",
    timestamp: "5d ago",
    dayGroup: "This week",
    createdAtMs: at(5 * DAY),
    source: "mock",
  },
  {
    id: "act-19",
    kind: "commit",
    title: "Pushed 4 commits to xcm-relay-sim",
    description: "perf: batch channel assertions and deterministic seeding",
    actor: "kate.dot",
    actorColor: "#64B5F6",
    organization: "XCM Workshop",
    repository: "xcm-relay-sim",
    timestamp: "5d ago",
    dayGroup: "This week",
    createdAtMs: at(5 * DAY + 2 * HOUR),
    source: "mock",
  },
  {
    id: "act-20",
    kind: "pull_request",
    title: "Merged PR #98 on xcm-playground",
    description: "Add HRMP channel simulator and docs.",
    actor: "charlie.dot",
    actorColor: "#FFC107",
    organization: "XCM Workshop",
    repository: "xcm-playground",
    timestamp: "1w ago",
    dayGroup: "Earlier",
    createdAtMs: at(7 * DAY),
    source: "mock",
  },
  {
    id: "act-21",
    kind: "grant_submitted",
    title: "Grant submitted for review",
    description:
      "Moonbeam Precompile Library submitted milestone 2 deliverables for audit.",
    actor: "Moonbeam Network",
    actorColor: "#53CBC9",
    organization: "Moonbeam Network",
    timestamp: "1w ago",
    dayGroup: "Earlier",
    createdAtMs: at(7 * DAY + 4 * HOUR),
    source: "mock",
  },
  {
    id: "act-22",
    kind: "org_created",
    title: "New organization created",
    description: "OpenGov Lab joined DotForge as a Governance collective.",
    actor: "liam.dot",
    actorColor: "#FFB300",
    organization: "OpenGov Lab",
    timestamp: "2w ago",
    dayGroup: "Earlier",
    createdAtMs: at(14 * DAY),
    source: "mock",
  },
  {
    id: "act-23",
    kind: "repo_created",
    title: "Repository created",
    description: "opengov-analytics was added under OpenGov Lab.",
    actor: "liam.dot",
    actorColor: "#FFB300",
    organization: "OpenGov Lab",
    repository: "opengov-analytics",
    timestamp: "2w ago",
    dayGroup: "Earlier",
    createdAtMs: at(14 * DAY + 3 * HOUR),
    source: "mock",
  },
  {
    id: "act-24",
    kind: "milestone_approved",
    title: "Milestone approved",
    description: "Light Client Research — final milestone signed off.",
    actor: "Audit Board",
    actorColor: "#7E57C2",
    organization: "Polkadot Research",
    timestamp: "3w ago",
    dayGroup: "Earlier",
    createdAtMs: at(21 * DAY),
    source: "mock",
  },
  {
    id: "act-25",
    kind: "commit",
    title: "Pushed 12 commits to polkadot-light-client",
    description: "Initial browser prover implementation",
    actor: "mia.dot",
    actorColor: "#7E57C2",
    organization: "Polkadot Research",
    repository: "polkadot-light-client",
    timestamp: "3w ago",
    dayGroup: "Earlier",
    createdAtMs: at(21 * DAY + 2 * HOUR),
    source: "mock",
  },
];

function shortHash(hash: string): string {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function formatUnits(amount: string): string {
  try {
    const value = Number(BigInt(amount));
    if (Number.isNaN(value)) return `${amount} units`;
    return `${value.toLocaleString()} units`;
  } catch {
    return `${amount} units`;
  }
}

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
  const storedOrgs = useStoredOrgs();
  const storedRepos = useStoredRepos();
  const storedDeposits = useStoredDeposits();

  const events = useMemo<ActivityEventDetail[]>(() => {
    const orgLookup = new Map(storedOrgs.map((o) => [o.orgId, o]));

    const fromOrgs: ActivityEventDetail[] = storedOrgs.map((org) => ({
      id: `chain-org-${org.orgId}`,
      kind: "org_created",
      title: "Organization created on-chain",
      description: `${org.name} was registered on Polkadot Hub Testnet as a ${org.category} organization.`,
      actor: org.name,
      actorColor: org.avatarColor || "#E6007A",
      organization: org.name,
      txHash: shortHash(org.txHash),
      timestamp: formatRelativeTime(org.createdAt),
      dayGroup: dayGroupFor(org.createdAt),
      createdAtMs: new Date(org.createdAt).getTime(),
      source: "chain",
    }));

    const fromRepos: ActivityEventDetail[] = storedRepos.map((repo) => {
      const parent = orgLookup.get(repo.orgId);
      const organization = parent?.name ?? `Org #${repo.orgId}`;
      return {
        id: `chain-repo-${repo.repoId}`,
        kind: "repo_created",
        title: "Repository created on-chain",
        description: `${repo.name} was added under ${organization} (${repo.language}, ${repo.visibility}).`,
        actor: organization,
        actorColor: parent?.avatarColor ?? "#E6007A",
        organization,
        repository: repo.name,
        txHash: shortHash(repo.txHash),
        timestamp: formatRelativeTime(repo.createdAt),
        dayGroup: dayGroupFor(repo.createdAt),
        createdAtMs: new Date(repo.createdAt).getTime(),
        source: "chain",
      };
    });

    const fromDeposits: ActivityEventDetail[] = storedDeposits.map((deposit) => {
      const parent = orgLookup.get(deposit.orgId);
      const organization = parent?.name ?? `Org #${deposit.orgId}`;
      return {
        id: `chain-dep-${deposit.depositId}`,
        kind: "deposit",
        title: "Treasury deposit",
        description: `${organization} received ${formatUnits(deposit.amount)} from ${shortHash(deposit.from)}.`,
        actor: organization,
        actorColor: parent?.avatarColor ?? "#58AD95",
        organization,
        amount: formatUnits(deposit.amount),
        txHash: shortHash(deposit.txHash),
        timestamp: formatRelativeTime(deposit.createdAt),
        dayGroup: dayGroupFor(deposit.createdAt),
        createdAtMs: new Date(deposit.createdAt).getTime(),
        source: "chain",
      };
    });

    return [...fromDeposits, ...fromRepos, ...fromOrgs, ...mockEvents].sort(
      (a, b) => b.createdAtMs - a.createdAtMs
    );
  }, [storedOrgs, storedRepos, storedDeposits]);

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
      return [...byFilters].sort((a, b) => a.createdAtMs - b.createdAtMs);
    }
    return byFilters;
  }, [events, filters]);

  const grouped = useMemo(() => {
    const order = ["Today", "Yesterday", "This week", "Earlier"];
    const groups = new Map<string, ActivityEventDetail[]>();
    filtered.forEach((event) => {
      const list = groups.get(event.dayGroup) ?? [];
      list.push(event);
      groups.set(event.dayGroup, list);
    });
    return Array.from(groups.entries())
      .map(([label, items]) => ({ label, items }))
      .sort((a, b) => {
        const ai = order.indexOf(a.label);
        const bi = order.indexOf(b.label);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
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
