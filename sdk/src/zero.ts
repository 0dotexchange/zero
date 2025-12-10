import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  GetProgramAccountsFilter,
} from '@solana/web3.js';
import {
  ZeroConfig,
  DEFAULT_CONFIG,
  DaoAccount,
  ProposalAccount,
  AgentAccount,
  TreasuryAccount,
  InitializeDaoParams,
  CreateProposalParams,
  CastVoteParams,
  RegisterAgentParams,
  UpdateReputationParams,
  DepositTreasuryParams,
  WithdrawTreasuryParams,
  DelegateVotingParams,
  PROGRAM_ID,
} from './types';
import {
  findDaoAddress,
  findProposalAddress,
  findAgentAddress,
  findTreasuryAddress,
  findVoteRecordAddress,
} from './utils';
import { deserializeDao } from './accounts/dao';
import { deserializeProposal } from './accounts/proposal';
import { deserializeAgent } from './accounts/agent';
import { deserializeTreasury } from './accounts/treasury';
import { createInitializeDaoInstruction } from './instructions/dao';
import {
  createCreateProposalInstruction,
  createFinalizeProposalInstruction,
  createExecuteProposalInstruction,
} from './instructions/proposal';
import { createCastVoteInstruction, createDelegateVotingPowerInstruction } from './instructions/vote';
import { createRegisterAgentInstruction, createUpdateAgentReputationInstruction } from './instructions/agent';
import { createDepositTreasuryInstruction, createWithdrawTreasuryInstruction } from './instructions/treasury';

export class ZeroClient {
  private connection: Connection;
  private config: ZeroConfig;

  constructor(endpoint: string, config: Partial<ZeroConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connection = new Connection(endpoint, this.config.commitment);
  }

  get programId(): PublicKey {
    return this.config.programId;
  }

  async initializeDao(
    payer: Keypair,
    params: InitializeDaoParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.name, this.programId);
    const [treasuryPda] = findTreasuryAddress(daoPda, this.programId);

    const instruction = createInitializeDaoInstruction(
      payer.publicKey,
      daoPda,
      treasuryPda,
      params.tokenMint,
      params.name,
      params.quorumBps,
      params.approvalThresholdBps,
      params.votingPeriod,
      params.minProposalTokens,
      params.minVoteTokens,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [payer]);
  }

  async createProposal(
    proposer: Keypair,
    params: CreateProposalParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const dao = await this.getDao(params.daoName);

    const proposalId = Number(dao.proposalCount);
    const [proposalPda] = findProposalAddress(daoPda, proposalId, this.programId);

    const proposerTokenAccount = await this.findAssociatedTokenAccount(
      proposer.publicKey,
      dao.tokenMint
    );

    const instruction = createCreateProposalInstruction(
      proposer.publicKey,
      daoPda,
      proposalPda,
      proposerTokenAccount,
      params.title,
      params.description,
      params.executionPayload || Buffer.alloc(0),
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [proposer]);
  }

  async castVote(
    voter: Keypair,
    params: CastVoteParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [proposalPda] = findProposalAddress(daoPda, params.proposalId, this.programId);
    const [voteRecordPda] = findVoteRecordAddress(proposalPda, voter.publicKey, this.programId);

    const dao = await this.getDao(params.daoName);
    const voterTokenAccount = await this.findAssociatedTokenAccount(
      voter.publicKey,
      dao.tokenMint
    );

    const instruction = createCastVoteInstruction(
      voter.publicKey,
      daoPda,
      proposalPda,
      voteRecordPda,
      voterTokenAccount,
      params.approve,
      params.weight,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [voter]);
  }

  async finalizeProposal(
    caller: Keypair,
    daoName: string,
    proposalId: number
  ): Promise<string> {
    const [daoPda] = findDaoAddress(daoName, this.programId);
    const [proposalPda] = findProposalAddress(daoPda, proposalId, this.programId);

    const instruction = createFinalizeProposalInstruction(
      caller.publicKey,
      daoPda,
      proposalPda,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [caller]);
  }

  async executeProposal(
    authority: Keypair,
    daoName: string,
    proposalId: number
  ): Promise<string> {
    const [daoPda] = findDaoAddress(daoName, this.programId);
    const [proposalPda] = findProposalAddress(daoPda, proposalId, this.programId);
    const [treasuryPda] = findTreasuryAddress(daoPda, this.programId);

    const instruction = createExecuteProposalInstruction(
      authority.publicKey,
      daoPda,
      proposalPda,
      treasuryPda,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [authority]);
  }

  async registerAgent(
    owner: Keypair,
    params: RegisterAgentParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [agentPda] = findAgentAddress(daoPda, owner.publicKey, this.programId);

    const instruction = createRegisterAgentInstruction(
      owner.publicKey,
      daoPda,
      agentPda,
      params.agentName,
      params.capabilities,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [owner]);
  }

  async updateAgentReputation(
    authority: Keypair,
    params: UpdateReputationParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [agentPda] = findAgentAddress(daoPda, params.agentOwner, this.programId);

    const instruction = createUpdateAgentReputationInstruction(
      authority.publicKey,
      daoPda,
      agentPda,
      params.delta,
      params.reason,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [authority]);
  }

  async depositTreasury(
    depositor: Keypair,
    params: DepositTreasuryParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [treasuryPda] = findTreasuryAddress(daoPda, this.programId);

    const instruction = createDepositTreasuryInstruction(
      depositor.publicKey,
      daoPda,
      treasuryPda,
      params.depositorTokenAccount,
      params.treasuryTokenAccount,
      params.tokenProgram,
      params.amount,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [depositor]);
  }

  async withdrawTreasury(
    authority: Keypair,
    params: WithdrawTreasuryParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [treasuryPda] = findTreasuryAddress(daoPda, this.programId);

    const instruction = createWithdrawTreasuryInstruction(
      authority.publicKey,
      daoPda,
      treasuryPda,
      params.destinationTokenAccount,
      params.treasuryTokenAccount,
      params.tokenProgram,
      params.amount,
      this.programId
    );

    const tx = new Transaction().add(instruction);
    return sendAndConfirmTransaction(this.connection, tx, [authority]);
  }

  async delegateVotingPower(
    delegator: Keypair,
    params: DelegateVotingParams
  ): Promise<string> {
    const [daoPda] = findDaoAddress(params.daoName, this.programId);
    const [agentPda] = findAgentAddress(daoPda, delegator.publicKey, this.programId);

    const instruction = createDelegateVotingPowerInstruction(
