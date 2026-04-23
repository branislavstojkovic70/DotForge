import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import {
  dotforgeService,
  getConnectedAccount,
  getWalletClient,
} from "../services/dotforge";

type Status = "idle" | "connecting" | "connected" | "error";

export function useDotForge() {
  const [account, setAccount] = useState<Address | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getConnectedAccount()
      .then((addr) => {
        if (cancelled) return;
        if (addr) {
          setAccount(addr);
          setStatus("connected");
        }
      })
      .catch(() => {
        /* ignore — user simply isn't connected yet */
      });

    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum?.on) return () => {
      cancelled = true;
    };

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const next = (accounts?.[0] as Address | undefined) ?? null;
      setAccount(next);
      setStatus(next ? "connected" : "idle");
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      cancelled = true;
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const walletClient = await getWalletClient();
      const [addr] = await walletClient.getAddresses();
      setAccount(addr);
      setStatus("connected");
      return addr;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    account,
    isConnected: status === "connected" && !!account,
    isConnecting: status === "connecting",
    status,
    error,
    connect,
    disconnect,
    service: dotforgeService,
  };
}
