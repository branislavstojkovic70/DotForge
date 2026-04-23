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

async function callWrite<TArgs extends readonly unknown[], TResult>(
  functionName: string,
  args: TArgs
): Promise<TxResult<TResult>> {
  const publicClient = getPublicClient();
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No account connected");

  const { request, result } = await publicClient.simulateContract({
    address: DOTFORGE_ADDRESS,
    abi: dotforgeAbi,
    // viem expects specific function name literals; cast is safe since we control callers
    functionName: functionName as never,
    args: args as never,
    account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return { hash, receipt, result: result as TResult };
}

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

export async function storeCommit(
  repoId: bigint,
  branch: string,
  cid: string
): Promise<TxResult> {
  const branchHash = await hashToU64(branch);
  const cidHash = await hashToU64(cid);
  return callWrite<[bigint, bigint, bigint], void>("storeCommit", [
    repoId,
    branchHash,
    cidHash,
  ]);
}

export async function getBranch(repoId: bigint, branch: string): Promise<bigint> {
  const publicClient = getPublicClient();
  const branchHash = await hashToU64(branch);
  //@ts-ignore
  return (await publicClient.readContract({
    address: DOTFORGE_ADDRESS,
    abi: dotforgeAbi,
    functionName: "getBranch",
    args: [repoId, branchHash],
  })) as bigint;
}

export async function createGrant(
  orgId: bigint,
  amount: bigint
): Promise<TxResult<bigint>> {
  return callWrite<[bigint, bigint], bigint>("createGrant", [orgId, amount]);
}

export async function assignGrant(
  grantId: bigint,
  assignee: Address
): Promise<TxResult> {
  return callWrite<[bigint, Address], void>("assignGrant", [grantId, assignee]);
}

export async function submitGrant(grantId: bigint): Promise<TxResult> {
  return callWrite<[bigint], void>("submitGrant", [grantId]);
}

export async function submitVerdict(
  grantId: bigint,
  approved: boolean
): Promise<TxResult> {
  return callWrite<[bigint, boolean], void>("submitVerdict", [grantId, approved]);
}

export async function registerAuditor(auditor: Address): Promise<TxResult> {
  return callWrite<[Address], void>("registerAuditor", [auditor]);
}

export async function storeCommitCid(
  repoId: bigint,
  branch: string,
  cid: Hex
): Promise<TxResult> {
  const branchHash = await hashToU64(branch);
  return callWrite<[bigint, bigint, Hex], void>("storeCommitCid", [
    repoId,
    branchHash,
    cid,
  ]);
}

export async function getCommitCid(repoId: bigint, branch: string): Promise<Hex> {
  const publicClient = getPublicClient();
  const branchHash = await hashToU64(branch);
  return (await publicClient.readContract({
    address: DOTFORGE_ADDRESS,
    abi: dotforgeAbi,
    functionName: "getCommitCid",
    args: [repoId, branchHash],
  })) as Hex;
}

export async function storeRepoPubkey(repoId: bigint, pubkey: Hex): Promise<TxResult> {
  return callWrite<[bigint, Hex], void>("storeRepoPubkey", [repoId, pubkey]);
}

export async function getRepoPubkey(repoId: bigint): Promise<Hex> {
  const publicClient = getPublicClient();
  return (await publicClient.readContract({
    address: DOTFORGE_ADDRESS,
    abi: dotforgeAbi,
    functionName: "getRepoPubkey",
    args: [repoId],
  })) as Hex;
}

export async function storeRepoPrivkey(repoId: bigint, privkey: Hex): Promise<TxResult> {
  return callWrite<[bigint, Hex], void>("storeRepoPrivkey", [repoId, privkey]);
}

export async function getRepoPrivkey(repoId: bigint): Promise<Hex> {
  const publicClient = getPublicClient();
  return (await publicClient.readContract({
    address: DOTFORGE_ADDRESS,
    abi: dotforgeAbi,
    functionName: "getRepoPrivkey",
    args: [repoId],
  })) as Hex;
}

export const dotforgeService = {
  createOrg,
  addMember,
  deposit,
  createRepo,
  storeCommit,
  getBranch,
  createGrant,
  assignGrant,
  submitGrant,
  submitVerdict,
  registerAuditor,
  storeCommitCid,
  getCommitCid,
  storeRepoPubkey,
  getRepoPubkey,
  storeRepoPrivkey,
  getRepoPrivkey,
};

export type DotForgeService = typeof dotforgeService;
