use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Dao {
    pub is_initialized: bool,
    pub authority: Pubkey,
    pub name: String,
    pub token_mint: Pubkey,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub voting_period: i64,
    pub min_proposal_tokens: u64,
    pub min_vote_tokens: u64,
    pub proposal_count: u64,
    pub active_proposal_count: u8,
    pub agent_count: u64,
    pub total_delegated_weight: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl Dao {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_ACTIVE_PROPOSALS: u8 = 10;
    pub const SPACE: usize = 1   // is_initialized
        + 32   // authority
        + 4 + Self::MAX_NAME_LEN  // name (borsh string: 4-byte len + data)
        + 32   // token_mint
        + 2    // quorum_bps
        + 2    // approval_threshold_bps
        + 8    // voting_period
        + 8    // min_proposal_tokens
        + 8    // min_vote_tokens
        + 8    // proposal_count
        + 1    // active_proposal_count
        + 8    // agent_count
        + 8    // total_delegated_weight
        + 8    // created_at
        + 1;   // bump

    pub fn validate_config(&self) -> bool {
        self.quorum_bps <= 10_000
            && self.approval_threshold_bps <= 10_000
            && self.approval_threshold_bps > 0
            && self.voting_period > 0
            && self.min_proposal_tokens > 0
    }

    pub fn can_create_proposal(&self) -> bool {
        self.active_proposal_count < Self::MAX_ACTIVE_PROPOSALS
    }

    pub fn increment_proposal(&mut self) {
        self.proposal_count = self.proposal_count.saturating_add(1);
