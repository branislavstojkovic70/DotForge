// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface DotForge {
    function createOrg() external returns (uint64);
    function addMember(uint64 orgId, address member, uint8 role) external;
    function deposit(uint64 orgId, uint64 amount) external;
    function createRepo(uint64 orgId) external returns (uint64);
    function storeCommit(uint64 repoId, uint64 branchHash, uint64 cidHash) external;
    function getBranch(uint64 repoId, uint64 branchHash) external view returns (uint64);
    function createGrant(uint64 orgId, uint64 amount) external returns (uint64);
    function assignGrant(uint64 grantId, address assignee) external;
    function submitGrant(uint64 grantId) external;
    function submitVerdict(uint64 grantId, bool approved) external;
    function registerAuditor(address auditor) external;
    function storeCommitCid(uint64 repoId, uint64 branchHash, uint64 c0, uint64 c1, uint64 c2, uint64 c3, uint64 c4, uint64 c5) external;
    function getCommitCid(uint64 repoId, uint64 branchHash) external view returns (uint64, uint64, uint64, uint64, uint64, uint64);
    function storeRepoPubkey(uint64 repoId, uint64 k0, uint64 k1, uint64 k2, uint64 k3) external;
    function getRepoPubkey(uint64 repoId) external view returns (uint64, uint64, uint64, uint64);
    function storeRepoPrivkey(uint64 repoId, uint64 k0, uint64 k1, uint64 k2, uint64 k3) external;
    function getRepoPrivkey(uint64 repoId) external view returns (uint64, uint64, uint64, uint64);
    function getOrgBalance(uint64 orgId) external view returns (uint64);
    function getMemberRole(uint64 orgId, address member) external view returns (uint8);
    function getOrgCount() external view returns (uint64);
    function getRepoCount() external view returns (uint64);
    function getRepoOrg(uint64 repoId) external view returns (uint64);
    function getGrantStatus(uint64 grantId) external view returns (uint8);
    function getGrantAmount(uint64 grantId) external view returns (uint64);
    function getGrantOrg(uint64 grantId) external view returns (uint64);
    function getGrantCount() external view returns (uint64);
}