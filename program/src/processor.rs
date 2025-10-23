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
            dao: dao_pda,
            token_mint: *token_mint.key,
            total_deposits: 0,
            total_withdrawals: 0,
            pending_allocations: 0,
            allocation_count: 0,
            recent_allocations: Vec::new(),
            last_deposit_at: 0,
            last_withdrawal_at: 0,
            bump: treasury_bump,
        };

        borsh::to_writer(&mut treasury_account.data.borrow_mut()[..], &treasury)?;

        msg!("DAO '{}' initialized successfully", name);
        Ok(())
    }

    fn process_create_proposal(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        title: String,
        description: String,
        execution_payload: Vec<u8>,
    ) -> ProgramResult {
        let account_iter = &mut accounts.iter();
        let proposer = next_account_info(account_iter)?;
        let dao_account = next_account_info(account_iter)?;
        let proposal_account = next_account_info(account_iter)?;
        let _proposer_token_account = next_account_info(account_iter)?;
        let system_program = next_account_info(account_iter)?;

        if !proposer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if !validate_string_length(&title, MAX_PROPOSAL_TITLE_LEN) {
            return Err(ZeroError::InvalidInstruction.into());
        }

        if !validate_string_length(&description, MAX_PROPOSAL_DESC_LEN) {
            return Err(ZeroError::InvalidInstruction.into());
        }

        let mut dao: Dao = Dao::try_from_slice(&dao_account.data.borrow())?;
        if !dao.is_initialized {
            return Err(ZeroError::UninitializedAccount.into());
        }

        if !dao.can_create_proposal() {
            return Err(ZeroError::MaxProposalsReached.into());
        }

        let proposal_id = dao.proposal_count;
        let (proposal_pda, proposal_bump) =
            find_proposal_address(program_id, dao_account.key, proposal_id);
        if proposal_pda != *proposal_account.key {
            return Err(ZeroError::InvalidPDA.into());
        }

        let clock = Clock::get()?;
        let voting_ends_at = clock
            .unix_timestamp
            .checked_add(dao.voting_period)
            .ok_or(ZeroError::Overflow)?;

        let proposal_seeds = &[
            PROPOSAL_SEED,
            dao_account.key.as_ref(),
            &proposal_id.to_le_bytes(),
            &[proposal_bump],
        ];
        Self::create_pda_account(
            proposer,
            Proposal::SPACE,
            program_id,
            system_program,
            proposal_account,
            proposal_seeds,
        )?;

        let proposal = Proposal {
            is_initialized: true,
            dao: *dao_account.key,
            proposer: *proposer.key,
            proposal_id,
            title,
            description,
            status: ProposalStatus::Active,
            votes_for: 0,
            votes_against: 0,
            voter_count: 0,
            execution_payload,
            created_at: clock.unix_timestamp,
            voting_ends_at,
            finalized_at: None,
            executed_at: None,
            bump: proposal_bump,
        };

        borsh::to_writer(&mut proposal_account.data.borrow_mut()[..], &proposal)?;

        dao.increment_proposal();
        borsh::to_writer(&mut dao_account.data.borrow_mut()[..], &dao)?;

        msg!("Proposal {} created", proposal_id);
        Ok(())
    }

    fn process_cast_vote(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        approve: bool,
        weight: u64,
    ) -> ProgramResult {
        let account_iter = &mut accounts.iter();
        let voter = next_account_info(account_iter)?;
        let _dao_account = next_account_info(account_iter)?;
        let proposal_account = next_account_info(account_iter)?;
        let vote_record_account = next_account_info(account_iter)?;
        let _voter_token_account = next_account_info(account_iter)?;
        let system_program = next_account_info(account_iter)?;

        if !voter.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if weight == 0 {
            return Err(ZeroError::InvalidVoteWeight.into());
        }

        let mut proposal: Proposal =
            Proposal::try_from_slice(&proposal_account.data.borrow())?;
        if !proposal.is_initialized {
            return Err(ZeroError::UninitializedAccount.into());
        }

        let clock = Clock::get()?;
        if !proposal.is_voting_open(clock.unix_timestamp) {
            return Err(ZeroError::VotingPeriodEnded.into());
        }

        let (vote_pda, vote_bump) =
            find_vote_record_address(program_id, proposal_account.key, voter.key);
        if vote_pda != *vote_record_account.key {
            return Err(ZeroError::InvalidPDA.into());
        }

        if vote_record_account.data_len() > 0 {
            let existing: VoteRecord =
                VoteRecord::try_from_slice(&vote_record_account.data.borrow())?;
            if existing.is_initialized {
                return Err(ZeroError::AlreadyVoted.into());
            }
        }

        let vote_seeds = &[
            VOTE_RECORD_SEED,
            proposal_account.key.as_ref(),
            voter.key.as_ref(),
            &[vote_bump],
        ];
        Self::create_pda_account(
            voter,
            VoteRecord::SPACE,
            program_id,
            system_program,
            vote_record_account,
            vote_seeds,
        )?;

        let vote_record = VoteRecord {
            is_initialized: true,
            proposal: *proposal_account.key,
            voter: *voter.key,
            approved: approve,
            weight,
            delegated_from: None,
            voted_at: clock.unix_timestamp,
            bump: vote_bump,
        };

        borsh::to_writer(&mut vote_record_account.data.borrow_mut()[..], &vote_record)?;

        if approve {
            proposal.votes_for = proposal.votes_for.saturating_add(weight);
        } else {
            proposal.votes_against = proposal.votes_against.saturating_add(weight);
        }
        proposal.voter_count = proposal.voter_count.saturating_add(1);

        borsh::to_writer(&mut proposal_account.data.borrow_mut()[..], &proposal)?;

        msg!(
            "Vote cast: {} with weight {}",
