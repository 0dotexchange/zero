use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program, sysvar,
};

use crate::utils::{
    AGENT_SEED, DAO_SEED, PROPOSAL_SEED, TREASURY_SEED, VOTE_RECORD_SEED,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum ZeroInstruction {
    /// Initialize a new DAO
    /// Accounts:
    ///   0. `[writable, signer]` Authority (payer)
    ///   1. `[writable]` DAO account (PDA)
    ///   2. `[writable]` Treasury account (PDA)
    ///   3. `[]` Token mint
    ///   4. `[]` System program
    ///   5. `[]` Rent sysvar
    InitializeDao {
        name: String,
        quorum_bps: u16,
        approval_threshold_bps: u16,
        voting_period: i64,
        min_proposal_tokens: u64,
        min_vote_tokens: u64,
    },

    /// Create a new governance proposal
    /// Accounts:
    ///   0. `[writable, signer]` Proposer
    ///   1. `[writable]` DAO account (PDA)
    ///   2. `[writable]` Proposal account (PDA)
    ///   3. `[]` Proposer token account
    ///   4. `[]` System program
    ///   5. `[]` Clock sysvar
    CreateProposal {
        title: String,
        description: String,
        execution_payload: Vec<u8>,
    },

    /// Cast a vote on an active proposal
    /// Accounts:
    ///   0. `[writable, signer]` Voter
    ///   1. `[]` DAO account
    ///   2. `[writable]` Proposal account (PDA)
    ///   3. `[writable]` Vote record account (PDA)
    ///   4. `[]` Voter token account
    ///   5. `[]` System program
    ///   6. `[]` Clock sysvar
    CastVote {
        approve: bool,
        weight: u64,
    },

    /// Finalize a proposal after the voting period ends
    /// Accounts:
    ///   0. `[signer]` Caller
    ///   1. `[writable]` DAO account
    ///   2. `[writable]` Proposal account (PDA)
    ///   3. `[]` Clock sysvar
    FinalizeProposal,

    /// Execute an approved proposal
    /// Accounts:
    ///   0. `[signer]` Authority or executor
    ///   1. `[writable]` DAO account
    ///   2. `[writable]` Proposal account (PDA)
    ///   3. `[writable]` Treasury account (PDA)
    ExecuteProposal,

    /// Register an AGI agent with the DAO
    /// Accounts:
    ///   0. `[writable, signer]` Agent owner
    ///   1. `[]` DAO account
    ///   2. `[writable]` Agent account (PDA)
    ///   3. `[]` System program
    RegisterAgent {
        agent_name: String,
        capabilities: Vec<String>,
    },

    /// Update an agent's reputation score
    /// Accounts:
    ///   0. `[signer]` DAO authority
    ///   1. `[]` DAO account
    ///   2. `[writable]` Agent account (PDA)
    UpdateAgentReputation {
        delta: i32,
        reason: String,
    },

    /// Deposit tokens into the DAO treasury
    /// Accounts:
    ///   0. `[writable, signer]` Depositor
    ///   1. `[]` DAO account
    ///   2. `[writable]` Treasury account (PDA)
    ///   3. `[writable]` Depositor token account
    ///   4. `[writable]` Treasury token account
    ///   5. `[]` Token program
    DepositTreasury {
        amount: u64,
    },

    /// Withdraw tokens from the DAO treasury
    /// Accounts:
    ///   0. `[signer]` DAO authority
    ///   1. `[]` DAO account
    ///   2. `[writable]` Treasury account (PDA)
    ///   3. `[writable]` Destination token account
    ///   4. `[writable]` Treasury token account
    ///   5. `[]` Token program
    WithdrawTreasury {
        amount: u64,
    },

    /// Delegate voting power to another address
    /// Accounts:
    ///   0. `[writable, signer]` Delegator
    ///   1. `[]` DAO account
    ///   2. `[writable]` Delegator agent account (PDA)
    DelegateVotingPower {
        delegate_to: Pubkey,
        weight: u64,
    },
}

impl ZeroInstruction {
    pub fn initialize_dao(
        program_id: &Pubkey,
        authority: &Pubkey,
        dao_pda: &Pubkey,
        treasury_pda: &Pubkey,
        token_mint: &Pubkey,
        name: String,
        quorum_bps: u16,
        approval_threshold_bps: u16,
        voting_period: i64,
        min_proposal_tokens: u64,
        min_vote_tokens: u64,
    ) -> Instruction {
        let data = ZeroInstruction::InitializeDao {
