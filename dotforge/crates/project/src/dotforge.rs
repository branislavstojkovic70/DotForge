#![cfg_attr(not(feature = "abi-gen"), no_main, no_std)]

use pallet_revive_uapi::{HostFnImpl as api, HostFn, StorageFlags};

#[pvm_contract_macros::contract("DotForge.sol", allocator = "pico")]
mod dotforge {
    use super::*;
    use pvm_contract_types::{Address, Bytes};

    const PUSH_FEE: u64 = 10_000_000;
    const GRANT_FEE: u64 = 100_000_000;

    // ── Storage key helpers ───────────────────────────────────────────────

    fn key1(ns: &[u8], k: u64) -> [u8; 32] {
        let mut data = [0u8; 40];
        data[..8].copy_from_slice(ns.get(..8).unwrap_or(ns));
        data[8..16].copy_from_slice(&k.to_le_bytes());
        let mut out = [0u8; 32];
        api::hash_keccak_256(&data[..16], &mut out);
        out
    }

    fn key2(ns: &[u8], k1: u64, k2: &[u8; 20]) -> [u8; 32] {
        let mut data = [0u8; 36];
        data[..8].copy_from_slice(ns.get(..8).unwrap_or(ns));
        data[8..16].copy_from_slice(&k1.to_le_bytes());
        data[16..36].copy_from_slice(k2);
        let mut out = [0u8; 32];
        api::hash_keccak_256(&data[..36], &mut out);
        out
    }

    fn key2u(ns: &[u8], k1: u64, k2: u64) -> [u8; 32] {
        let mut data = [0u8; 24];
        data[..8].copy_from_slice(ns.get(..8).unwrap_or(ns));
        data[8..16].copy_from_slice(&k1.to_le_bytes());
        data[16..24].copy_from_slice(&k2.to_le_bytes());
        let mut out = [0u8; 32];
        api::hash_keccak_256(&data[..24], &mut out);
        out
    }

    fn key_addr(ns: &[u8], k: &[u8; 20]) -> [u8; 32] {
        let mut data = [0u8; 28];
        data[..8].copy_from_slice(ns.get(..8).unwrap_or(ns));
        data[8..28].copy_from_slice(k);
        let mut out = [0u8; 32];
        api::hash_keccak_256(&data[..28], &mut out);
        out
    }

    fn key_static(ns: &[u8]) -> [u8; 32] {
        let mut out = [0u8; 32];
        api::hash_keccak_256(ns, &mut out);
        out
    }

    // ── Scalar storage ────────────────────────────────────────────────────

    fn set_u64(key: &[u8; 32], val: u64) {
        api::set_storage(StorageFlags::empty(), key, &val.to_le_bytes());
    }

    fn get_u64(key: &[u8; 32]) -> u64 {
        let mut buf = [0u8; 8];
        let mut out: &mut [u8] = &mut buf;
        if api::get_storage(StorageFlags::empty(), key, &mut out).is_ok() {
            u64::from_le_bytes(buf)
        } else {
            0
        }
    }

    fn set_u8(key: &[u8; 32], val: u8) {
        api::set_storage(StorageFlags::empty(), key, &[val]);
    }

    fn get_u8(key: &[u8; 32]) -> u8 {
        let mut buf = [0u8; 1];
        let mut out: &mut [u8] = &mut buf;
        if api::get_storage(StorageFlags::empty(), key, &mut out).is_ok() {
            buf[0]
        } else {
            0
        }
    }

    fn set_bool(key: &[u8; 32], val: bool) {
        api::set_storage(StorageFlags::empty(), key, &[if val { 1 } else { 0 }]);
    }

    fn get_bool(key: &[u8; 32]) -> bool {
        let mut buf = [0u8; 1];
        let mut out: &mut [u8] = &mut buf;
        api::get_storage(StorageFlags::empty(), key, &mut out).is_ok() && buf[0] == 1
    }

    fn set_addr(key: &[u8; 32], val: &[u8; 20]) {
        api::set_storage(StorageFlags::empty(), key, val);
    }

    fn get_addr(key: &[u8; 32]) -> Option<[u8; 20]> {
        let mut buf = [0u8; 20];
        let mut out: &mut [u8] = &mut buf;
        if api::get_storage(StorageFlags::empty(), key, &mut out).is_ok() {
            Some(buf)
        } else {
            None
        }
    }

    // ── Bytes storage (za CID i keypair) ──────────────────────────────────
    // Čuvamo: [len: 4 bajta LE][data: len bajta]
    // Max 1024 bajta

    fn set_bytes(key: &[u8; 32], val: &[u8]) {
        let mut buf = [0u8; 1028];
        let len = val.len().min(1024);
        buf[..4].copy_from_slice(&(len as u32).to_le_bytes());
        buf[4..4 + len].copy_from_slice(&val[..len]);
        api::set_storage(StorageFlags::empty(), key, &buf[..4 + len]);
    }

    fn get_bytes(key: &[u8; 32]) -> Bytes {
        let mut buf = [0u8; 1028];
        let mut out: &mut [u8] = &mut buf;
        if api::get_storage(StorageFlags::empty(), key, &mut out).is_err() {
            return Bytes(alloc::vec![]);
        }
        let len = u32::from_le_bytes(buf[..4].try_into().unwrap_or([0u8; 4])) as usize;
        let len = len.min(1024);
        Bytes(buf[4..4 + len].to_vec())
    }

    fn caller() -> Address {
        let mut raw = [0u8; 20];
        api::caller(&mut raw);
        Address(raw)
    }

    // ── Constructor ───────────────────────────────────────────────────────

    #[pvm_contract_macros::constructor]
    pub fn new() -> Result<(), pvm_contract_types::EmptyError> {
        set_addr(&key_static(b"auditor_admin"), &caller().0);
        Ok(())
    }

    // ── Org ───────────────────────────────────────────────────────────────

    #[pvm_contract_macros::method]
    pub fn create_org() -> u64 {
        let c = caller();
        let id = get_u64(&key_static(b"org_count")) + 1;
        set_u64(&key_static(b"org_count"), id);
        set_addr(&key1(b"org_owner", id), &c.0);
        set_u64(&key1(b"org_balance", id), 0);
        set_u8(&key2(b"mbr_role", id, &c.0), 1);
        id
    }

    #[pvm_contract_macros::method]
    pub fn add_member(org_id: u64, member: Address, role: u8) {
        let c = caller();
        assert!(get_u8(&key2(b"mbr_role", org_id, &c.0)) == 1);
        assert!(role != 4);
        set_u8(&key2(b"mbr_role", org_id, &member.0), role);
    }

    #[pvm_contract_macros::method]
    pub fn deposit(org_id: u64, amount: u64) {
        let c = caller();
        assert!(get_u8(&key2(b"mbr_role", org_id, &c.0)) == 1);
        let bal = get_u64(&key1(b"org_balance", org_id));
        set_u64(&key1(b"org_balance", org_id), bal + amount);
    }

    // ── Repo ──────────────────────────────────────────────────────────────

    #[pvm_contract_macros::method]
    pub fn create_repo(org_id: u64) -> u64 {
        check_write(org_id, caller());
        check_balance(org_id, PUSH_FEE);
        let id = get_u64(&key_static(b"repo_count")) + 1;
        set_u64(&key_static(b"repo_count"), id);
        set_u64(&key1(b"repo_org", id), org_id);
        deduct(org_id, PUSH_FEE);
        id
    }

    // ── Legacy u64 commit (backward compat) ───────────────────────────────

    #[pvm_contract_macros::method]
    pub fn store_commit(repo_id: u64, branch_hash: u64, cid_hash: u64) {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        check_write(org_id, caller());
        check_balance(org_id, PUSH_FEE);
        set_u64(&key2u(b"branches", repo_id, branch_hash), cid_hash);
        deduct(org_id, PUSH_FEE);
    }

    #[pvm_contract_macros::method]
    pub fn get_branch(repo_id: u64, branch_hash: u64) -> u64 {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        assert!(get_u8(&key2(b"mbr_role", org_id, &caller().0)) > 0);
        get_u64(&key2u(b"branches", repo_id, branch_hash))
    }

    // ── Bytes commit (novi flow sa pravim fajlovima) ──────────────────────

    #[pvm_contract_macros::method]
    pub fn store_commit_cid(repo_id: u64, branch_hash: u64, cid: Bytes) {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        check_write(org_id, caller());
        check_balance(org_id, PUSH_FEE);
        set_bytes(&key2u(b"cid_bytes", repo_id, branch_hash), &cid.0);
        deduct(org_id, PUSH_FEE);
    }

    #[pvm_contract_macros::method]
    pub fn get_commit_cid(repo_id: u64, branch_hash: u64) -> Bytes {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        assert!(get_u8(&key2(b"mbr_role", org_id, &caller().0)) > 0);
        get_bytes(&key2u(b"cid_bytes", repo_id, branch_hash))
    }

    // ── Repo keypair ──────────────────────────────────────────────────────

    #[pvm_contract_macros::method]
    pub fn store_repo_pubkey(repo_id: u64, pubkey: Bytes) {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        check_write(org_id, caller());
        set_bytes(&key1(b"repo_pubkey", repo_id), &pubkey.0);
    }

    #[pvm_contract_macros::method]
    pub fn get_repo_pubkey(repo_id: u64) -> Bytes {
        get_bytes(&key1(b"repo_pubkey", repo_id))
    }

    // ── Grants ────────────────────────────────────────────────────────────

    #[pvm_contract_macros::method]
    pub fn create_grant(org_id: u64, amount: u64) -> u64 {
        assert!(get_u8(&key2(b"mbr_role", org_id, &caller().0)) == 1);
        check_balance(org_id, amount + GRANT_FEE);
        let id = get_u64(&key_static(b"grant_count")) + 1;
        set_u64(&key_static(b"grant_count"), id);
        set_u64(&key1(b"grant_amt", id), amount);
        set_u8(&key1(b"grant_st", id), 0);
        set_u64(&key1(b"grant_org", id), org_id);
        deduct(org_id, GRANT_FEE);
        id
    }

    #[pvm_contract_macros::method]
    pub fn assign_grant(grant_id: u64, assignee: Address) {
        let org_id = get_u64(&key1(b"grant_org", grant_id));
        assert!(org_id > 0);
        assert!(get_u8(&key2(b"mbr_role", org_id, &caller().0)) == 1);
        assert!(get_u8(&key1(b"grant_st", grant_id)) == 0);
        set_addr(&key1(b"grant_asgn", grant_id), &assignee.0);
        set_u8(&key1(b"grant_st", grant_id), 1);
    }

    #[pvm_contract_macros::method]
    pub fn submit_grant(grant_id: u64) {
        let assignee = get_addr(&key1(b"grant_asgn", grant_id)).expect("no assignee");
        assert!(caller().0 == assignee);
        assert!(get_u8(&key1(b"grant_st", grant_id)) == 1);
        set_u8(&key1(b"grant_st", grant_id), 2);
    }

    #[pvm_contract_macros::method]
    pub fn submit_verdict(grant_id: u64, approved: bool) {
        assert!(get_bool(&key_addr(b"is_audit", &caller().0)));
        assert!(get_u8(&key1(b"grant_st", grant_id)) == 2);
        set_u8(&key1(b"grant_st", grant_id), if approved { 3 } else { 4 });
    }

    #[pvm_contract_macros::method]
    pub fn register_auditor(auditor: Address) {
        let admin = get_addr(&key_static(b"auditor_admin")).expect("no admin");
        assert!(caller().0 == admin);
        set_bool(&key_addr(b"is_audit", &auditor.0), true);
    }

    #[pvm_contract_macros::method]
    pub fn store_repo_privkey(repo_id: u64, privkey: Bytes) {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        check_write(org_id, caller());
        set_bytes(&key1(b"repo_privkey", repo_id), &privkey.0);
    }

    #[pvm_contract_macros::method]
    pub fn get_repo_privkey(repo_id: u64) -> Bytes {
        let org_id = get_u64(&key1(b"repo_org", repo_id));
        assert!(org_id > 0);
        assert!(get_u8(&key2(b"mbr_role", org_id, &caller().0)) > 0);
        get_bytes(&key1(b"repo_privkey", repo_id))
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    fn check_write(org_id: u64, c: Address) {
        let r = get_u8(&key2(b"mbr_role", org_id, &c.0));
        assert!(r == 1 || r == 2);
    }

    fn check_balance(org_id: u64, needed: u64) {
        assert!(get_u64(&key1(b"org_balance", org_id)) >= needed);
    }

    fn deduct(org_id: u64, amount: u64) {
        let b = get_u64(&key1(b"org_balance", org_id));
        set_u64(&key1(b"org_balance", org_id), b - amount);
    }
}