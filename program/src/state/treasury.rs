use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct AllocationRecord {
    pub proposal_id: u64,
    pub amount: u64,
    pub recipient: Pubkey,
    pub allocated_at: i64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Treasury {
    pub is_initialized: bool,
    pub dao: Pubkey,
    pub token_mint: Pubkey,
    pub total_deposits: u64,
    pub total_withdrawals: u64,
    pub pending_allocations: u64,
    pub allocation_count: u32,
    pub recent_allocations: Vec<AllocationRecord>,
    pub last_deposit_at: i64,
    pub last_withdrawal_at: i64,
    pub bump: u8,
}

impl Treasury {
    pub const MAX_RECENT_ALLOCATIONS: usize = 5;
    pub const SPACE: usize = 1   // is_initialized
        + 32   // dao
        + 32   // token_mint
        + 8    // total_deposits
        + 8    // total_withdrawals
        + 8    // pending_allocations
        + 4    // allocation_count
        + 4 + Self::MAX_RECENT_ALLOCATIONS * (8 + 8 + 32 + 8)  // recent_allocations
        + 8    // last_deposit_at
        + 8    // last_withdrawal_at
        + 1;   // bump

    pub fn available_balance(&self) -> u64 {
        self.total_deposits
            .saturating_sub(self.total_withdrawals)
            .saturating_sub(self.pending_allocations)
    }

    pub fn record_deposit(&mut self, amount: u64, timestamp: i64) {
        self.total_deposits = self.total_deposits.saturating_add(amount);
        self.last_deposit_at = timestamp;
    }

    pub fn record_withdrawal(&mut self, amount: u64, timestamp: i64) {
        self.total_withdrawals = self.total_withdrawals.saturating_add(amount);
        self.last_withdrawal_at = timestamp;
    }

    pub fn allocate(&mut self, proposal_id: u64, amount: u64, recipient: Pubkey, timestamp: i64) {
        self.pending_allocations = self.pending_allocations.saturating_add(amount);
        self.allocation_count = self.allocation_count.saturating_add(1);

        let record = AllocationRecord {
            proposal_id,
            amount,
            recipient,
            allocated_at: timestamp,
        };

        if self.recent_allocations.len() >= Self::MAX_RECENT_ALLOCATIONS {
            self.recent_allocations.remove(0);
        }
