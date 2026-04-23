import type { OrgCategory } from "../hooks/useOrganizations";

const ORG_PREFIX = "dotforge:org:";
const REPO_PREFIX = "dotforge:repo:";

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

export function saveOrg(org: StoredOrg): void {
  localStorage.setItem(`${ORG_PREFIX}${org.orgId}`, JSON.stringify(org));
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
}

export function getStoredRepos(): StoredRepo[] {
  return readAllByPrefix<StoredRepo>(REPO_PREFIX).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getStoredReposByOrg(orgId: string): StoredRepo[] {
  return getStoredRepos().filter((r) => r.orgId === orgId);
}
