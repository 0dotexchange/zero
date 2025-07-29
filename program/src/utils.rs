use solana_program::pubkey::Pubkey;

pub const DAO_SEED: &[u8] = b"zero_dao";
pub const PROPOSAL_SEED: &[u8] = b"zero_proposal";
pub const AGENT_SEED: &[u8] = b"zero_agent";
pub const TREASURY_SEED: &[u8] = b"zero_treasury";
pub const VOTE_RECORD_SEED: &[u8] = b"zero_vote";

pub const GRACE_PERIOD: i64 = 3600;
pub const MAX_PROPOSAL_TITLE_LEN: usize = 128;
pub const MAX_PROPOSAL_DESC_LEN: usize = 512;
pub const MAX_AGENT_NAME_LEN: usize = 64;

pub fn find_dao_address(program_id: &Pubkey, name: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[DAO_SEED, name.as_bytes()], program_id)
