import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import { vars } from "hardhat/config";

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        polkadotTestnet: {
            url: "https://services.polkadothub-rpc.com/testnet",
            chainId: 420420417,
            accounts: [vars.get("PRIVATE_KEY", "")].filter(Boolean),
        },
    },
};

export default config;