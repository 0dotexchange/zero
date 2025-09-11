use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct VoteRecord {
    pub is_initialized: bool,
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub approved: bool,
    pub weight: u64,
    pub delegated_from: Option<Pubkey>,
    pub voted_at: i64,
    pub bump: u8,
}

impl VoteRecord {
    pub const SPACE: usize = 1   // is_initialized
        + 32   // proposal
        + 32   // voter
        + 1    // approved
        + 8    // weight
        + 33   // delegated_from (Option<Pubkey>)
        + 8    // voted_at
        + 1;   // bump

    pub fn is_delegated_vote(&self) -> bool {
        self.delegated_from.is_some()
    }

    pub fn effective_voter(&self) -> &Pubkey {
        match &self.delegated_from {
            Some(delegator) => delegator,
            None => &self.voter,
        }
    }
}
