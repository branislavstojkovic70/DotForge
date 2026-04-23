import { useMemo, useState } from "react";

export type GrantStatus = "Active" | "Under Review" | "Completed" | "Draft" | "Rejected";

export type GrantCategory =
  | "Infrastructure"
  | "DeFi"
  | "Tooling"
  | "Research"
  | "Governance"
  | "Education";

export type GrantMilestone = {
  id: string;
  title: string;
  amount: number;
  completed: boolean;
};

export type GrantDetail = {
  id: string;
  title: string;
  description: string;
  organization: string;
  organizationColor: string;
  category: GrantCategory;
  status: GrantStatus;
  amountRequested: number;
  amountPaid: number;
  currency: string;
  progress: number;
  milestones: GrantMilestone[];
  teamSize: number;
  appliedAt: string;
  deadline: string;
};

const mockGrants: GrantDetail[] = [
  {
    id: "grant-1",
    title: "Cross-chain Identity Resolver",
    description:
      "Universal identity resolution across Polkadot, Kusama and rollups using verifiable credentials.",
    organization: "Parity Builders",
    organizationColor: "#E6007A",
    category: "Infrastructure",
    status: "Active",
    amountRequested: 12500,
    amountPaid: 8125,
    currency: "DOT",
    progress: 65,
    milestones: [
      { id: "m1", title: "Spec & architecture", amount: 2500, completed: true },
      { id: "m2", title: "Resolver pallet & tests", amount: 5625, completed: true },
      { id: "m3", title: "Client SDK & docs", amount: 4375, completed: false },
    ],
    teamSize: 4,
    appliedAt: "Feb 2026",
    deadline: "Jul 2026",
  },
  {
    id: "grant-2",
    title: "Ink! Developer Tooling",
    description:
      "CLI, VSCode extension and scaffolding templates to speed up smart-contract development on ink!.",
    organization: "Substrate Labs",
    organizationColor: "#58AD95",
    category: "Tooling",
    status: "Active",
    amountRequested: 8000,
    amountPaid: 3200,
    currency: "DOT",
    progress: 40,
    milestones: [
      { id: "m1", title: "Project scaffolder", amount: 3200, completed: true },
      { id: "m2", title: "VSCode extension MVP", amount: 2800, completed: false },
      { id: "m3", title: "Docs site & examples", amount: 2000, completed: false },
    ],
    teamSize: 3,
    appliedAt: "Jan 2026",
    deadline: "Jun 2026",
  },
  {
    id: "grant-3",
    title: "XCM Testing Framework",
    description:
      "End-to-end testing harness that simulates XCM channels across relay, parachains and bridge hubs.",
    organization: "XCM Workshop",
    organizationColor: "#64B5F6",
    category: "Tooling",
    status: "Under Review",
    amountRequested: 5200,
    amountPaid: 4680,
    currency: "DOT",
    progress: 90,
    milestones: [
      { id: "m1", title: "Local simnet", amount: 1500, completed: true },
      { id: "m2", title: "Channel assertions", amount: 1800, completed: true },
      { id: "m3", title: "CI integration", amount: 1380, completed: true },
      { id: "m4", title: "Final review", amount: 520, completed: false },
    ],
    teamSize: 2,
    appliedAt: "Dec 2025",
    deadline: "May 2026",
  },
  {
    id: "grant-4",
    title: "Stablecoin Risk Dashboard",
    description:
      "Public analytics dashboard tracking collateral, peg deviation and liquidation pressure for acUSD.",
    organization: "Acala Finance",
    organizationColor: "#FF4AA6",
    category: "DeFi",
    status: "Completed",
    amountRequested: 6500,
    amountPaid: 6500,
    currency: "DOT",
    progress: 100,
    milestones: [
      { id: "m1", title: "Data pipeline", amount: 2000, completed: true },
      { id: "m2", title: "UI & charts", amount: 2500, completed: true },
      { id: "m3", title: "Alerts & docs", amount: 2000, completed: true },
    ],
    teamSize: 5,
    appliedAt: "Aug 2025",
    deadline: "Feb 2026",
  },
  {
    id: "grant-5",
    title: "Governance Voting Research",
    description:
      "Empirical study of OpenGov participation, quadratic voting and conviction weighting on Kusama.",
    organization: "Kusama Collective",
    organizationColor: "#FFC107",
    category: "Research",
    status: "Active",
    amountRequested: 9800,
    amountPaid: 3920,
    currency: "DOT",
    progress: 40,
    milestones: [
      { id: "m1", title: "Dataset collection", amount: 3920, completed: true },
      { id: "m2", title: "Analysis & modeling", amount: 3500, completed: false },
      { id: "m3", title: "Paper & presentation", amount: 2380, completed: false },
    ],
    teamSize: 3,
    appliedAt: "Mar 2026",
    deadline: "Oct 2026",
  },
  {
    id: "grant-6",
    title: "Polkadot Bootcamp 2026",
    description:
      "Eight-week developer bootcamp covering Substrate, ink! and XCM with mentored capstone projects.",
    organization: "DotSchool",
    organizationColor: "#B388FF",
    category: "Education",
    status: "Draft",
    amountRequested: 4200,
    amountPaid: 0,
    currency: "DOT",
    progress: 0,
    milestones: [
      { id: "m1", title: "Curriculum & recruiting", amount: 1000, completed: false },
      { id: "m2", title: "Weeks 1–4 delivery", amount: 1600, completed: false },
      { id: "m3", title: "Weeks 5–8 & capstones", amount: 1600, completed: false },
    ],
    teamSize: 2,
    appliedAt: "Apr 2026",
    deadline: "Dec 2026",
  },
  {
    id: "grant-7",
    title: "Parachain Governance Client",
    description:
      "Lightweight client library for indexing and interacting with parachain governance runtime modules.",
    organization: "Parity Builders",
    organizationColor: "#E6007A",
    category: "Governance",
    status: "Rejected",
    amountRequested: 7500,
    amountPaid: 0,
    currency: "DOT",
    progress: 0,
    milestones: [
      { id: "m1", title: "Client core", amount: 3000, completed: false },
      { id: "m2", title: "Indexer & cache", amount: 2500, completed: false },
      { id: "m3", title: "Docs & examples", amount: 2000, completed: false },
    ],
    teamSize: 3,
    appliedAt: "Nov 2025",
    deadline: "—",
  },
];

export type GrantSort = "recent" | "amount" | "progress" | "deadline";
export type StatusFilter = GrantStatus | "All";
export type CategoryFilter = GrantCategory | "All";

export type GrantFilters = {
  query: string;
  status: StatusFilter;
  category: CategoryFilter;
  sort: GrantSort;
};

const defaultFilters: GrantFilters = {
  query: "",
  status: "All",
  category: "All",
  sort: "recent",
};

export const statusOrder: GrantStatus[] = [
  "Active",
  "Under Review",
  "Completed",
  "Draft",
  "Rejected",
];

export function useGrants() {
  const [filters, setFilters] = useState<GrantFilters>(defaultFilters);

  const grants = useMemo(() => mockGrants, []);

  const categories = useMemo<CategoryFilter[]>(
    () => ["All", "Infrastructure", "DeFi", "Tooling", "Research", "Governance", "Education"],
    []
  );

  const statuses = useMemo<StatusFilter[]>(
    () => ["All", ...statusOrder],
    []
  );

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const byFilters = grants.filter((grant) => {
      if (filters.status !== "All" && grant.status !== filters.status) return false;
      if (filters.category !== "All" && grant.category !== filters.category) return false;
      if (!query) return true;
      return (
        grant.title.toLowerCase().includes(query) ||
        grant.organization.toLowerCase().includes(query) ||
        grant.description.toLowerCase().includes(query) ||
        grant.category.toLowerCase().includes(query)
      );
    });

    const sorted = [...byFilters].sort((a, b) => {
      switch (filters.sort) {
        case "amount":
          return b.amountRequested - a.amountRequested;
        case "progress":
          return b.progress - a.progress;
        case "deadline":
          return a.deadline.localeCompare(b.deadline);
        case "recent":
        default:
          return 0;
      }
    });

    return sorted;
  }, [grants, filters]);

  const totals = useMemo(() => {
    const totalRequested = grants.reduce((sum, g) => sum + g.amountRequested, 0);
    const totalPaid = grants.reduce((sum, g) => sum + g.amountPaid, 0);
    const active = grants.filter((g) => g.status === "Active").length;
    const underReview = grants.filter((g) => g.status === "Under Review").length;
    return {
      total: grants.length,
      active,
      underReview,
      totalRequested,
      totalPaid,
    };
  }, [grants]);

  return {
    grants: filtered,
    allGrants: grants,
    categories,
    statuses,
    filters,
    setFilters,
    totals,
  };
}

export function formatDot(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return amount.toString();
}
