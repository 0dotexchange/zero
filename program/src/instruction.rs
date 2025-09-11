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
