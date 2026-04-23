import { useSyncExternalStore } from "react";
import {
  getStoredDeposits,
  getStoredOrgs,
  getStoredRepos,
  subscribeStore,
  type StoredDeposit,
  type StoredOrg,
  type StoredRepo,
} from "../utils/localStore";

let orgCache: StoredOrg[] = [];
let repoCache: StoredRepo[] = [];
let depositCache: StoredDeposit[] = [];

function refreshAll(): void {
  orgCache = getStoredOrgs();
  repoCache = getStoredRepos();
  depositCache = getStoredDeposits();
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
