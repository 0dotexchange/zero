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
