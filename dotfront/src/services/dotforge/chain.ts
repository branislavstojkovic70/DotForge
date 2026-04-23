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
  "0x9468ed655c0da9898ed0885cd4557f7906bc3a30";

export const chainIdHex = `0x${POLKADOT_HUB_TESTNET_ID.toString(16)}`;
