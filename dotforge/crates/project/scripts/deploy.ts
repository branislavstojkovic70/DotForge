import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const polkadotHub = defineChain({
    id: 420420417,
    name: "Polkadot Hub Testnet",
    nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://services.polkadothub-rpc.com/testnet"],
        },
    },
});

const POLKAVM_ARTIFACT = path.resolve(
    __dirname,
    "../target/dotforge.debug.polkavm"
);

const DEPLOYMENTS_JSON = path.resolve(__dirname, "../../deployments.json");

async function main() {
    if (!fs.existsSync(POLKAVM_ARTIFACT)) {
        throw new Error(`${POLKAVM_ARTIFACT} not found.`);
    }

    const polkavmBytes = fs.readFileSync(POLKAVM_ARTIFACT);
    const bytecode = ("0x" + polkavmBytes.toString("hex")) as `0x${string}`;

    console.log(`Deploying DotForge (${polkavmBytes.length} bytes)...`);

    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) throw new Error("PRIVATE_KEY not set");

    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
        account,
        chain: polkadotHub,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain: polkadotHub,
        transport: http(),
    });

    const hash = await walletClient.deployContract({
        abi: [],
        bytecode,
        account,
    });

    console.log(`Deploy tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
    });

    if (!receipt.contractAddress) {
        throw new Error(`Deploy tx ${hash} did not create a contract`);
    }

    console.log(`DotForge deployed to: ${receipt.contractAddress}`);

    fs.writeFileSync(
        DEPLOYMENTS_JSON,
        JSON.stringify({ contractAddress: receipt.contractAddress }, null, 2) + "\n"
    );

    console.log("Updated deployments.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});