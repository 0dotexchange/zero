use borsh::BorshDeserialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::error::ZeroError;
use crate::instruction::ZeroInstruction;
use crate::state::{
    agent::{Agent, AgentCapability, AgentStatus},
    dao::Dao,
    proposal::{Proposal, ProposalStatus},
    treasury::Treasury,
    vote::VoteRecord,
};
use crate::utils::{
    find_agent_address, find_dao_address, find_proposal_address, find_treasury_address,
    find_vote_record_address, validate_string_length, AGENT_SEED, DAO_SEED, GRACE_PERIOD,
    MAX_AGENT_NAME_LEN, MAX_PROPOSAL_DESC_LEN, MAX_PROPOSAL_TITLE_LEN, PROPOSAL_SEED,
    TREASURY_SEED, VOTE_RECORD_SEED,
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = ZeroInstruction::try_from_slice(instruction_data)
            .map_err(|_| ZeroError::InvalidInstruction)?;

        match instruction {
            ZeroInstruction::InitializeDao {
                name,
                quorum_bps,
