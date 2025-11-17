import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('ZER0DAO1111111111111111111111111111111111111');

export const DAO_SEED = Buffer.from('zero_dao');
export const PROPOSAL_SEED = Buffer.from('zero_proposal');
export const AGENT_SEED = Buffer.from('zero_agent');
export const TREASURY_SEED = Buffer.from('zero_treasury');
export const VOTE_RECORD_SEED = Buffer.from('zero_vote');

export interface ZeroConfig {
  programId: PublicKey;
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  commitment: 'processed' | 'confirmed' | 'finalized';
}

export const DEFAULT_CONFIG: ZeroConfig = {
  programId: PROGRAM_ID,
  cluster: 'devnet',
  commitment: 'confirmed',
};

export enum ProposalStatus {
  Active = 0,
  Approved = 1,
  Rejected = 2,
  Executed = 3,
  Cancelled = 4,
}

export enum AgentStatus {
  Active = 0,
  Suspended = 1,
  Deregistered = 2,
}

export interface DaoAccount {
  isInitialized: boolean;
  authority: PublicKey;
  name: string;
  tokenMint: PublicKey;
  quorumBps: number;
  approvalThresholdBps: number;
  votingPeriod: bigint;
  minProposalTokens: bigint;
  minVoteTokens: bigint;
  proposalCount: bigint;
  activeProposalCount: number;
  agentCount: bigint;
  totalDelegatedWeight: bigint;
  createdAt: bigint;
  bump: number;
}

export interface ProposalAccount {
  isInitialized: boolean;
  dao: PublicKey;
  proposer: PublicKey;
  proposalId: bigint;
  title: string;
  description: string;
  status: ProposalStatus;
  votesFor: bigint;
  votesAgainst: bigint;
  voterCount: number;
  executionPayload: Uint8Array;
  createdAt: bigint;
  votingEndsAt: bigint;
  finalizedAt: bigint | null;
  executedAt: bigint | null;
  bump: number;
}

export interface AgentCapability {
  name: string;
  version: number;
}

export interface AgentAccount {
  isInitialized: boolean;
  dao: PublicKey;
  owner: PublicKey;
  agentName: string;
  status: AgentStatus;
  reputation: bigint;
  tasksCompleted: bigint;
  tasksFailed: bigint;
  proposalsCreated: number;
  votesCast: number;
  capabilities: AgentCapability[];
  delegatedTo: PublicKey | null;
  delegatedWeight: bigint;
  registeredAt: bigint;
  lastActiveAt: bigint;
  bump: number;
}

export interface AllocationRecord {
  proposalId: bigint;
  amount: bigint;
  recipient: PublicKey;
  allocatedAt: bigint;
}

export interface TreasuryAccount {
  isInitialized: boolean;
  dao: PublicKey;
  tokenMint: PublicKey;
  totalDeposits: bigint;
  totalWithdrawals: bigint;
  pendingAllocations: bigint;
  allocationCount: number;
  recentAllocations: AllocationRecord[];
  lastDepositAt: bigint;
  lastWithdrawalAt: bigint;
  bump: number;
}

export interface VoteRecordAccount {
  isInitialized: boolean;
  proposal: PublicKey;
  voter: PublicKey;
  approved: boolean;
  weight: bigint;
  delegatedFrom: PublicKey | null;
  votedAt: bigint;
  bump: number;
}

export interface InitializeDaoParams {
  name: string;
  quorumBps: number;
  approvalThresholdBps: number;
  votingPeriod: number;
  minProposalTokens: number;
  minVoteTokens: number;
  tokenMint: PublicKey;
}

export interface CreateProposalParams {
  daoName: string;
  title: string;
  description: string;
  executionPayload?: Buffer;
}

export interface CastVoteParams {
  daoName: string;
  proposalId: number;
  approve: boolean;
  weight: number;
}

export interface RegisterAgentParams {
  daoName: string;
  agentName: string;
  capabilities: string[];
}

export interface UpdateReputationParams {
  daoName: string;
  agentOwner: PublicKey;
  delta: number;
  reason: string;
}

export interface DepositTreasuryParams {
  daoName: string;
  amount: number;
  depositorTokenAccount: PublicKey;
  treasuryTokenAccount: PublicKey;
  tokenProgram: PublicKey;
}

export interface WithdrawTreasuryParams {
  daoName: string;
  amount: number;
  destinationTokenAccount: PublicKey;
  treasuryTokenAccount: PublicKey;
  tokenProgram: PublicKey;
}

export interface DelegateVotingParams {
  daoName: string;
  delegateTo: PublicKey;
  weight: number;
}
