import { DaoAccount } from '../types';
import {
  decodeBool,
  decodePublicKey,
  decodeString,
  decodeU16,
  decodeI64,
  decodeU64,
} from '../utils';

export function deserializeDao(data: Buffer): DaoAccount {
  let offset = 0;

  const [isInitialized, o1] = decodeBool(data, offset);
  offset = o1;

  const [authority, o2] = decodePublicKey(data, offset);
  offset = o2;

  const [name, o3] = decodeString(data, offset);
  offset = o3;

  const [tokenMint, o4] = decodePublicKey(data, offset);
  offset = o4;

  const [quorumBps, o5] = decodeU16(data, offset);
  offset = o5;

  const [approvalThresholdBps, o6] = decodeU16(data, offset);
  offset = o6;

  const [votingPeriod, o7] = decodeI64(data, offset);
  offset = o7;

  const [minProposalTokens, o8] = decodeU64(data, offset);
  offset = o8;

  const [minVoteTokens, o9] = decodeU64(data, offset);
  offset = o9;

  const [proposalCount, o10] = decodeU64(data, offset);
  offset = o10;

  const activeProposalCount = data[offset];
  offset += 1;

  const [agentCount, o11] = decodeU64(data, offset);
  offset = o11;

  const [totalDelegatedWeight, o12] = decodeU64(data, offset);
  offset = o12;

  const [createdAt, o13] = decodeI64(data, offset);
  offset = o13;

  const bump = data[offset];

  return {
    isInitialized,
    authority,
    name,
    tokenMint,
    quorumBps,
    approvalThresholdBps,
    votingPeriod,
    minProposalTokens,
    minVoteTokens,
    proposalCount,
    activeProposalCount,
    agentCount,
    totalDelegatedWeight,
    createdAt,
    bump,
  };
}
