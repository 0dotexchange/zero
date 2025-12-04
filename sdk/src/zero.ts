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
