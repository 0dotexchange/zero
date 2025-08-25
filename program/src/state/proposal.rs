use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Executed,
    Cancelled,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Proposal {
    pub is_initialized: bool,
    pub dao: Pubkey,
    pub proposer: Pubkey,
    pub proposal_id: u64,
    pub title: String,
    pub description: String,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub voter_count: u32,
    pub execution_payload: Vec<u8>,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub finalized_at: Option<i64>,
    pub executed_at: Option<i64>,
    pub bump: u8,
}

impl Proposal {
    pub const MAX_TITLE_LEN: usize = 128;
    pub const MAX_DESCRIPTION_LEN: usize = 512;
    pub const MAX_PAYLOAD_LEN: usize = 256;
    pub const SPACE: usize = 1   // is_initialized
        + 32   // dao
        + 32   // proposer
        + 8    // proposal_id
