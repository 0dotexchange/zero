use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum AgentStatus {
    Active,
    Suspended,
    Deregistered,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct AgentCapability {
    pub name: String,
    pub version: u16,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Agent {
    pub is_initialized: bool,
    pub dao: Pubkey,
    pub owner: Pubkey,
    pub agent_name: String,
    pub status: AgentStatus,
    pub reputation: i64,
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub proposals_created: u32,
    pub votes_cast: u32,
    pub capabilities: Vec<AgentCapability>,
    pub delegated_to: Option<Pubkey>,
    pub delegated_weight: u64,
    pub registered_at: i64,
    pub last_active_at: i64,
    pub bump: u8,
}

impl Agent {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_CAPABILITIES: usize = 8;
    pub const MAX_CAPABILITY_NAME_LEN: usize = 32;
    pub const MIN_REPUTATION_THRESHOLD: i64 = -100;
    pub const SPACE: usize = 1    // is_initialized
        + 32   // dao
        + 32   // owner
        + 4 + Self::MAX_NAME_LEN   // agent_name
        + 1    // status enum
        + 8    // reputation
        + 8    // tasks_completed
        + 8    // tasks_failed
        + 4    // proposals_created
        + 4    // votes_cast
        + 4 + Self::MAX_CAPABILITIES * (4 + Self::MAX_CAPABILITY_NAME_LEN + 2) // capabilities vec
        + 33   // delegated_to (Option<Pubkey>)
        + 8    // delegated_weight
        + 8    // registered_at
        + 8    // last_active_at
        + 1;   // bump

    pub fn is_active(&self) -> bool {
        self.status == AgentStatus::Active
    }

    pub fn has_min_reputation(&self) -> bool {
        self.reputation >= Self::MIN_REPUTATION_THRESHOLD
    }
