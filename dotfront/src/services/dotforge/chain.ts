import { defineChain, type Address } from "viem";

export const POLKADOT_HUB_TESTNET_ID = 420420417;

export const polkadotHubTestnet = defineChain({
  id: POLKADOT_HUB_TESTNET_ID,
  name: "Polkadot Hub Testnet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://services.polkadothub-rpc.com/testnet"],
    },
  },
  testnet: true,
});

export const DOTFORGE_ADDRESS: Address =
  "0x64ca2870ded6bc21e9d6ffb5e753cc0e5cd9aa5e";

export const chainIdHex = `0x${POLKADOT_HUB_TESTNET_ID.toString(16)}`;
