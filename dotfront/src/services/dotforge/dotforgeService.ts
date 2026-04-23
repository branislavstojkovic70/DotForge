import type { Address, Hex, TransactionReceipt } from "viem";
import { dotforgeAbi } from "./abi";
import { DOTFORGE_ADDRESS } from "./chain";
import { getPublicClient, getWalletClient } from "./client";
import { hashToU64 } from "./hash";

export type TxResult<T = void> = {
  hash: Hex;
  receipt: TransactionReceipt;
  result: T;
};

function serializeArgs(args: readonly unknown[]): unknown[] {
  return args.map((arg) => (typeof arg === "bigint" ? arg.toString() : arg));
}

async function callWrite<TArgs extends readonly unknown[], TResult>(
  functionName: string,
  args: TArgs
): Promise<TxResult<TResult>> {
  const publicClient = getPublicClient();
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No account connected");

  console.groupCollapsed(
    `[dotforge] write → ${functionName}(${serializeArgs(args).join(", ")})`
  );
  console.log("address:", DOTFORGE_ADDRESS);
  console.log("account:", account);
  console.log("args:", serializeArgs(args));

  try {
    const { request, result } = await publicClient.simulateContract({
      address: DOTFORGE_ADDRESS,
      abi: dotforgeAbi,
      functionName: functionName as never,
      args: args as never,
      account,
    });
    console.log("simulate ok, result:", result);

    const hash = await walletClient.writeContract(request);
    console.log("tx sent:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("tx receipt:", {
      status: receipt.status,
      blockNumber: receipt.blockNumber?.toString(),
      gasUsed: receipt.gasUsed?.toString(),
    });
    console.groupEnd();

    return { hash, receipt, result: result as TResult };
  } catch (err) {
    console.error(`[dotforge] write failed: ${functionName}`, err);
    console.groupEnd();
    throw err;
  }
}

async function callRead<TArgs extends readonly unknown[], TResult>(
  functionName: string,
  args: TArgs
): Promise<TResult> {
  const publicClient = getPublicClient();
  try {
    //@ts-ignore
    const result = (await publicClient.readContract({
      address: DOTFORGE_ADDRESS,
      abi: dotforgeAbi,
      functionName: functionName as never,
      args: args as never,
    })) as TResult;
    console.debug(
      `[dotforge] read ← ${functionName}(${serializeArgs(args).join(", ")}) =`,
      typeof result === "bigint" ? result.toString() : result
    );
    return result;
  } catch (err) {
    console.error(
      `[dotforge] read failed: ${functionName}(${serializeArgs(args).join(", ")})`,
      err
    );
    throw err;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────

export async function createOrg(): Promise<TxResult<bigint>> {
  return callWrite<[], bigint>("createOrg", []);
}

export async function addMember(
  orgId: bigint,
  member: Address,
  role: number
): Promise<TxResult> {
  return callWrite<[bigint, Address, number], void>("addMember", [orgId, member, role]);
}

export async function deposit(orgId: bigint, amount: bigint): Promise<TxResult> {
  return callWrite<[bigint, bigint], void>("deposit", [orgId, amount]);
}

export async function createRepo(orgId: bigint): Promise<TxResult<bigint>> {
  return callWrite<[bigint], bigint>("createRepo", [orgId]);
}

export async function createGrant(orgId: bigint, amount: bigint): Promise<TxResult<bigint>> {
  return callWrite<[bigint, bigint], bigint>("createGrant", [orgId, amount]);
}

export async function assignGrant(grantId: bigint, assignee: Address): Promise<TxResult> {
  return callWrite<[bigint, Address], void>("assignGrant", [grantId, assignee]);
}

export async function submitGrant(grantId: bigint): Promise<TxResult> {
  return callWrite<[bigint], void>("submitGrant", [grantId]);
}

export async function submitVerdict(grantId: bigint, approved: boolean): Promise<TxResult> {
  return callWrite<[bigint, boolean], void>("submitVerdict", [grantId, approved]);
}

export async function registerAuditor(auditor: Address): Promise<TxResult> {
  return callWrite<[Address], void>("registerAuditor", [auditor]);
}

export async function storeCommit(
  repoId: bigint,
  branch: string,
  cid: string
): Promise<TxResult> {
  const branchHash = await hashToU64(branch);
  const cidHash = await hashToU64(cid);
  return callWrite<[bigint, bigint, bigint], void>("storeCommit", [repoId, branchHash, cidHash]);
}

export async function storeCommitCid(
  repoId: bigint,
  branch: string,
  cid: Hex
): Promise<TxResult> {
  const branchHash = await hashToU64(branch);
  return callWrite<[bigint, bigint, Hex], void>("storeCommitCid", [repoId, branchHash, cid]);
}

export async function storeRepoPubkey(repoId: bigint, pubkey: Hex): Promise<TxResult> {
  return callWrite<[bigint, Hex], void>("storeRepoPubkey", [repoId, pubkey]);
}

export async function storeRepoPrivkey(repoId: bigint, privkey: Hex): Promise<TxResult> {
  return callWrite<[bigint, Hex], void>("storeRepoPrivkey", [repoId, privkey]);
}

// ── Read ──────────────────────────────────────────────────────────────────

export async function getOrgCount(): Promise<bigint> {
  return callRead<[], bigint>("getOrgCount", []);
}

export async function getRepoCount(): Promise<bigint> {
  return callRead<[], bigint>("getRepoCount", []);
}

export async function getGrantCount(): Promise<bigint> {
  return callRead<[], bigint>("getGrantCount", []);
}

export async function getOrgBalance(orgId: bigint): Promise<bigint> {
  return callRead<[bigint], bigint>("getOrgBalance", [orgId]);
}

export async function getMemberRole(orgId: bigint, member: Address): Promise<number> {
  return callRead<[bigint, Address], number>("getMemberRole", [orgId, member]);
}

export async function getRepoOrg(repoId: bigint): Promise<bigint> {
  return callRead<[bigint], bigint>("getRepoOrg", [repoId]);
}

export async function getGrantStatus(grantId: bigint): Promise<number> {
  return callRead<[bigint], number>("getGrantStatus", [grantId]);
}

export async function getGrantAmount(grantId: bigint): Promise<bigint> {
  return callRead<[bigint], bigint>("getGrantAmount", [grantId]);
}

export async function getGrantOrg(grantId: bigint): Promise<bigint> {
  return callRead<[bigint], bigint>("getGrantOrg", [grantId]);
}

export async function getBranch(repoId: bigint, branch: string): Promise<bigint> {
  const branchHash = await hashToU64(branch);
  return callRead<[bigint, bigint], bigint>("getBranch", [repoId, branchHash]);
}

export async function getCommitCid(repoId: bigint, branch: string): Promise<Hex> {
  const branchHash = await hashToU64(branch);
  return callRead<[bigint, bigint], Hex>("getCommitCid", [repoId, branchHash]);
}

export async function getRepoPubkey(repoId: bigint): Promise<Hex> {
  return callRead<[bigint], Hex>("getRepoPubkey", [repoId]);
}

export async function getRepoPrivkey(repoId: bigint): Promise<Hex> {
  return callRead<[bigint], Hex>("getRepoPrivkey", [repoId]);
}

// ── Helpers ───────────────────────────────────────────────────────────────

export const GRANT_STATUS = {
  0: "Open",
  1: "InProgress",
  2: "PendingAudit",
  3: "Approved",
  4: "Rejected",
  5: "Paid",
} as const;

export const MEMBER_ROLE = {
  0: "None",
  1: "Owner",
  2: "Editor",
  3: "Reader",
  4: "Auditor",
} as const;

export const dotforgeService = {
  createOrg,
  addMember,
  deposit,
  createRepo,
  storeCommit,
  storeCommitCid,
  storeRepoPubkey,
  storeRepoPrivkey,
  createGrant,
  assignGrant,
  submitGrant,
  submitVerdict,
  registerAuditor,
  getOrgCount,
  getRepoCount,
  getGrantCount,
  getOrgBalance,
  getMemberRole,
  getRepoOrg,
  getGrantStatus,
  getGrantAmount,
  getGrantOrg,
  getBranch,
  getCommitCid,
  getRepoPubkey,
  getRepoPrivkey,
};

export type DotForgeService = typeof dotforgeService;