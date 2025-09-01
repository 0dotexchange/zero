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
