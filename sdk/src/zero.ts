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

