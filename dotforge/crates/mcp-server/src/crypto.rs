use anyhow::Result;
use x25519_dalek::{EphemeralSecret, PublicKey, StaticSecret};
use aes_gcm::{Aes256Gcm, Nonce, aead::{Aead, KeyInit}};
use rand::rngs::OsRng;

pub struct Keypair {
    pub public: Vec<u8>,
    pub private: Vec<u8>,
}

pub fn generate_keypair() -> Keypair {
    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);
    Keypair {
        public: public.as_bytes().to_vec(),
        private: secret.to_bytes().to_vec(),
    }
}

pub fn encrypt(data: &[u8], pubkey_bytes: &[u8]) -> Result<Vec<u8>> {
    if pubkey_bytes.len() < 32 {
        return Err(anyhow::anyhow!("invalid pubkey length"));
    }
    let mut pk_arr = [0u8; 32];
    pk_arr.copy_from_slice(&pubkey_bytes[..32]);
    let recipient_public = PublicKey::from(pk_arr);

    let ephemeral_secret = EphemeralSecret::random_from_rng(OsRng);
    let ephemeral_public = PublicKey::from(&ephemeral_secret);
    let shared = ephemeral_secret.diffie_hellman(&recipient_public);

    let cipher = Aes256Gcm::new_from_slice(shared.as_bytes())
        .map_err(|e| anyhow::anyhow!("cipher: {}", e))?;

    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, data)
        .map_err(|e| anyhow::anyhow!("encrypt: {}", e))?;

    // [32 ephemeral pubkey][12 nonce][ciphertext]
    let mut result = Vec::new();
    result.extend_from_slice(ephemeral_public.as_bytes());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);
    Ok(result)
}

pub fn decrypt(data: &[u8], privkey_bytes: &[u8]) -> Result<Vec<u8>> {
    if data.len() < 44 {
        return Err(anyhow::anyhow!("data too short"));
    }
    if privkey_bytes.len() < 32 {
        return Err(anyhow::anyhow!("invalid privkey length"));
    }

    let mut eph_pk = [0u8; 32];
    eph_pk.copy_from_slice(&data[..32]);
    let ephemeral_public = PublicKey::from(eph_pk);

    let nonce = Nonce::from_slice(&data[32..44]);
    let ciphertext = &data[44..];

    let mut sk_arr = [0u8; 32];
    sk_arr.copy_from_slice(&privkey_bytes[..32]);
    let secret = StaticSecret::from(sk_arr);
    let shared = secret.diffie_hellman(&ephemeral_public);

    let cipher = Aes256Gcm::new_from_slice(shared.as_bytes())
        .map_err(|e| anyhow::anyhow!("cipher: {}", e))?;

    cipher.decrypt(nonce, ciphertext)
        .map_err(|e| anyhow::anyhow!("decrypt: {}", e))
}