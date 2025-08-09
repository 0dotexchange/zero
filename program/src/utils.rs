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
}

pub fn find_proposal_address(
    program_id: &Pubkey,
    dao: &Pubkey,
    proposal_id: u64,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[PROPOSAL_SEED, dao.as_ref(), &proposal_id.to_le_bytes()],
        program_id,
    )
}

pub fn find_agent_address(program_id: &Pubkey, dao: &Pubkey, owner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[AGENT_SEED, dao.as_ref(), owner.as_ref()], program_id)
}

pub fn find_treasury_address(program_id: &Pubkey, dao: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[TREASURY_SEED, dao.as_ref()], program_id)
}

pub fn find_vote_record_address(
    program_id: &Pubkey,
    proposal: &Pubkey,
    voter: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[VOTE_RECORD_SEED, proposal.as_ref(), voter.as_ref()],
        program_id,
    )
}

pub fn checked_add(a: u64, b: u64) -> Option<u64> {
    a.checked_add(b)
}

pub fn checked_sub(a: u64, b: u64) -> Option<u64> {
    a.checked_sub(b)
}

pub fn basis_points_to_fraction(bps: u16, value: u64) -> u64 {
    ((value as u128 * bps as u128) / 10_000u128) as u64
}

pub fn calculate_quorum_threshold(total_supply: u64, quorum_bps: u16) -> u64 {
    basis_points_to_fraction(quorum_bps, total_supply)
}

pub fn validate_string_length(s: &str, max_len: usize) -> bool {
    !s.is_empty() && s.len() <= max_len
}
