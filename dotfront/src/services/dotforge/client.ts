import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { chainIdHex, polkadotHubTestnet } from "./chain";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getInjectedProvider(): EthereumProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "No injected wallet found. Install MetaMask, Talisman or another EVM wallet."
    );
  }
  return window.ethereum;
}

let publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: polkadotHubTestnet,
      transport: http(),
    });
  }
  return publicClient;
}

async function ensureCorrectChain(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: polkadotHubTestnet.name,
            nativeCurrency: polkadotHubTestnet.nativeCurrency,
            rpcUrls: polkadotHubTestnet.rpcUrls.default.http,
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function getWalletClient(): Promise<WalletClient> {
  const provider = getInjectedProvider();
  await provider.request({ method: "eth_requestAccounts" });
  await ensureCorrectChain(provider);

  return createWalletClient({
    chain: polkadotHubTestnet,
    transport: custom(provider),
  });
}

export async function getConnectedAccount(): Promise<`0x${string}` | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
  return (accounts[0] as `0x${string}`) ?? null;
}
