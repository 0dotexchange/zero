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
                approval_threshold_bps,
                voting_period,
                min_proposal_tokens,
                min_vote_tokens,
            } => {
                msg!("Instruction: InitializeDao");
                Self::process_initialize_dao(
                    program_id,
                    accounts,
                    name,
                    quorum_bps,
                    approval_threshold_bps,
                    voting_period,
                    min_proposal_tokens,
                    min_vote_tokens,
                )
            }
            ZeroInstruction::CreateProposal {
                title,
                description,
                execution_payload,
            } => {
                msg!("Instruction: CreateProposal");
                Self::process_create_proposal(
                    program_id,
                    accounts,
                    title,
                    description,
                    execution_payload,
                )
            }
            ZeroInstruction::CastVote { approve, weight } => {
                msg!("Instruction: CastVote");
                Self::process_cast_vote(program_id, accounts, approve, weight)
            }
            ZeroInstruction::FinalizeProposal => {
                msg!("Instruction: FinalizeProposal");
                Self::process_finalize_proposal(program_id, accounts)
            }
            ZeroInstruction::ExecuteProposal => {
                msg!("Instruction: ExecuteProposal");
                Self::process_execute_proposal(program_id, accounts)
            }
            ZeroInstruction::RegisterAgent {
                agent_name,
                capabilities,
            } => {
                msg!("Instruction: RegisterAgent");
                Self::process_register_agent(program_id, accounts, agent_name, capabilities)
            }
            ZeroInstruction::UpdateAgentReputation { delta, reason } => {
                msg!("Instruction: UpdateAgentReputation");
                Self::process_update_agent_reputation(program_id, accounts, delta, reason)
            }
            ZeroInstruction::DepositTreasury { amount } => {
                msg!("Instruction: DepositTreasury");
                Self::process_deposit_treasury(program_id, accounts, amount)
            }
            ZeroInstruction::WithdrawTreasury { amount } => {
                msg!("Instruction: WithdrawTreasury");
                Self::process_withdraw_treasury(program_id, accounts, amount)
            }
            ZeroInstruction::DelegateVotingPower {
                delegate_to,
                weight,
            } => {
                msg!("Instruction: DelegateVotingPower");
                Self::process_delegate_voting_power(program_id, accounts, delegate_to, weight)
            }
        }
    }

    fn create_pda_account<'a>(
        payer: &AccountInfo<'a>,
        space: usize,
        owner: &Pubkey,
        system_program: &AccountInfo<'a>,
        new_account: &AccountInfo<'a>,
        seeds: &[&[u8]],
    ) -> ProgramResult {
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                payer.key,
                new_account.key,
                lamports,
                space as u64,
                owner,
            ),
            &[payer.clone(), new_account.clone(), system_program.clone()],
            &[seeds],
        )
    }

    fn process_initialize_dao(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        name: String,
        quorum_bps: u16,
        approval_threshold_bps: u16,
        voting_period: i64,
        min_proposal_tokens: u64,
        min_vote_tokens: u64,
    ) -> ProgramResult {
        let account_iter = &mut accounts.iter();
        let authority = next_account_info(account_iter)?;
        let dao_account = next_account_info(account_iter)?;
        let treasury_account = next_account_info(account_iter)?;
        let token_mint = next_account_info(account_iter)?;
        let system_program = next_account_info(account_iter)?;

        if !authority.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let (dao_pda, dao_bump) = find_dao_address(program_id, &name);
        if dao_pda != *dao_account.key {
            return Err(ZeroError::InvalidPDA.into());
        }

        let (treasury_pda, treasury_bump) = find_treasury_address(program_id, &dao_pda);
        if treasury_pda != *treasury_account.key {
            return Err(ZeroError::InvalidPDA.into());
        }

        let clock = Clock::get()?;

        let dao_seeds = &[DAO_SEED, name.as_bytes(), &[dao_bump]];
        Self::create_pda_account(
            authority,
            Dao::SPACE,
            program_id,
            system_program,
            dao_account,
            dao_seeds,
        )?;

        let dao = Dao {
            is_initialized: true,
            authority: *authority.key,
            name: name.clone(),
            token_mint: *token_mint.key,
            quorum_bps,
            approval_threshold_bps,
            voting_period,
            min_proposal_tokens,
            min_vote_tokens,
            proposal_count: 0,
            active_proposal_count: 0,
            agent_count: 0,
            total_delegated_weight: 0,
            created_at: clock.unix_timestamp,
            bump: dao_bump,
        };

        if !dao.validate_config() {
            return Err(ZeroError::InvalidInstruction.into());
        }

        borsh::to_writer(&mut dao_account.data.borrow_mut()[..], &dao)?;

        let treasury_seeds = &[TREASURY_SEED, dao_pda.as_ref(), &[treasury_bump]];
        Self::create_pda_account(
            authority,
            Treasury::SPACE,
            program_id,
            system_program,
            treasury_account,
            treasury_seeds,
        )?;

        let treasury = Treasury {
            is_initialized: true,
