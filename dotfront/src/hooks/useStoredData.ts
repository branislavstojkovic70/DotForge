import { useSyncExternalStore } from "react";
import {
  getStoredDeposits,
  getStoredGrants,
  getStoredMembers,
  getStoredOrgs,
  getStoredRepos,
  subscribeStore,
  type StoredDeposit,
  type StoredGrant,
  type StoredMember,
  type StoredOrg,
  type StoredRepo,
} from "../utils/localStore";

let orgCache: StoredOrg[] = [];
let repoCache: StoredRepo[] = [];
let depositCache: StoredDeposit[] = [];
let memberCache: StoredMember[] = [];
let grantCache: StoredGrant[] = [];

function refreshAll(): void {
  orgCache = getStoredOrgs();
  repoCache = getStoredRepos();
  depositCache = getStoredDeposits();
  memberCache = getStoredMembers();
  grantCache = getStoredGrants();
}

refreshAll();

const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  subscribeStore(() => {
    refreshAll();
    listeners.forEach((l) => l());
  });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useStoredOrgs(): StoredOrg[] {
  return useSyncExternalStore(
    subscribe,
    () => orgCache,
    () => orgCache
  );
}

export function useStoredRepos(): StoredRepo[] {
  return useSyncExternalStore(
    subscribe,
    () => repoCache,
    () => repoCache
  );
}

export function useStoredDeposits(): StoredDeposit[] {
  return useSyncExternalStore(
    subscribe,
    () => depositCache,
    () => depositCache
  );
}

export function useStoredMembers(): StoredMember[] {
  return useSyncExternalStore(
    subscribe,
    () => memberCache,
    () => memberCache
  );
}

export function useStoredGrants(): StoredGrant[] {
  return useSyncExternalStore(
    subscribe,
    () => grantCache,
    () => grantCache
  );
}
