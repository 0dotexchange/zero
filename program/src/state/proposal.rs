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
        + 4 + Self::MAX_TITLE_LEN       // title
        + 4 + Self::MAX_DESCRIPTION_LEN // description
        + 1    // status enum
        + 8    // votes_for
        + 8    // votes_against
        + 4    // voter_count
        + 4 + Self::MAX_PAYLOAD_LEN     // execution_payload
        + 8    // created_at
        + 8    // voting_ends_at
        + 9    // finalized_at (Option<i64>)
        + 9    // executed_at (Option<i64>)
        + 1;   // bump

    pub fn is_active(&self) -> bool {
        self.status == ProposalStatus::Active
    }

    pub fn is_voting_open(&self, current_time: i64) -> bool {
        self.is_active() && current_time < self.voting_ends_at
    }

    pub fn is_voting_ended(&self, current_time: i64) -> bool {
        current_time >= self.voting_ends_at
    }

    pub fn total_votes(&self) -> u64 {
        self.votes_for.saturating_add(self.votes_against)
    }

    pub fn approval_rate_bps(&self) -> u16 {
        let total = self.total_votes();
        if total == 0 {
            return 0;
        }
        ((self.votes_for as u128 * 10_000) / total as u128) as u16
    }

    pub fn meets_quorum(&self, total_supply: u64, quorum_bps: u16) -> bool {
        let required = (total_supply as u128 * quorum_bps as u128) / 10_000;
        self.total_votes() as u128 >= required
    }

    pub fn meets_approval_threshold(&self, threshold_bps: u16) -> bool {
        self.approval_rate_bps() >= threshold_bps
    }

    pub fn finalize(&mut self, current_time: i64, approved: bool) {
        self.status = if approved {
            ProposalStatus::Approved
        } else {
            ProposalStatus::Rejected
        };
        self.finalized_at = Some(current_time);
    }

    pub fn mark_executed(&mut self, current_time: i64) {
        self.status = ProposalStatus::Executed;
        self.executed_at = Some(current_time);
    }
}
