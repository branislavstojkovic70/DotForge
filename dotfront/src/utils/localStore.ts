import type { OrgCategory } from "../hooks/useOrganizations";

const ORG_PREFIX = "dotforge:org:";
const REPO_PREFIX = "dotforge:repo:";
const DEPOSIT_PREFIX = "dotforge:deposit:";

export type StoredOrg = {
  orgId: string;
  name: string;
  handle: string;
  description: string;
  category: OrgCategory;
  avatarColor: string;
  txHash: string;
  createdAt: string;
};

export type StoredRepo = {
  repoId: string;
  orgId: string;
  name: string;
  description: string;
  language: string;
  visibility: "Public" | "Private";
  topics: string[];
  txHash: string;
  createdAt: string;
};

export type StoredDeposit = {
  depositId: string;
  orgId: string;
  amount: string;
  from: string;
  txHash: string;
  createdAt: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAllByPrefix<T>(prefix: string): T[] {
  if (typeof window === "undefined") return [];
  const results: T[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const value = readJson<T>(key);
    if (value) results.push(value);
  }
  return results;
}

const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((cb) => cb());
}

export function subscribeStore(cb: () => void): () => void {
  subscribers.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", cb);
  }
  return () => {
    subscribers.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", cb);
    }
  };
}

export function saveOrg(org: StoredOrg): void {
  localStorage.setItem(`${ORG_PREFIX}${org.orgId}`, JSON.stringify(org));
  notify();
}

export function getStoredOrgs(): StoredOrg[] {
  return readAllByPrefix<StoredOrg>(ORG_PREFIX).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getStoredOrg(orgId: string): StoredOrg | null {
  return readJson<StoredOrg>(`${ORG_PREFIX}${orgId}`);
}

export function saveRepo(repo: StoredRepo): void {
  localStorage.setItem(`${REPO_PREFIX}${repo.repoId}`, JSON.stringify(repo));
  notify();
}

export function getStoredRepos(): StoredRepo[] {
  return readAllByPrefix<StoredRepo>(REPO_PREFIX).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getStoredReposByOrg(orgId: string): StoredRepo[] {
  return getStoredRepos().filter((r) => r.orgId === orgId);
}

export function saveDeposit(deposit: StoredDeposit): void {
  localStorage.setItem(
    `${DEPOSIT_PREFIX}${deposit.depositId}`,
    JSON.stringify(deposit)
  );
  notify();
}

export function getStoredDeposits(): StoredDeposit[] {
  return readAllByPrefix<StoredDeposit>(DEPOSIT_PREFIX).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getStoredDepositsByOrg(orgId: string): StoredDeposit[] {
  return getStoredDeposits().filter((d) => d.orgId === orgId);
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function dayGroupFor(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const hours = diff / 3_600_000;
  if (hours < 24) return "Today";
  if (hours < 48) return "Yesterday";
  const days = hours / 24;
  if (days < 7) return "This week";
  return "Earlier";
}
