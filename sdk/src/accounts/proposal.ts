import { ProposalAccount, ProposalStatus } from '../types';
import {
  decodeBool,
  decodePublicKey,
  decodeString,
  decodeU64,
  decodeI64,
} from '../utils';

function decodeProposalStatus(value: number): ProposalStatus {
  switch (value) {
    case 0: return ProposalStatus.Active;
    case 1: return ProposalStatus.Approved;
    case 2: return ProposalStatus.Rejected;
    case 3: return ProposalStatus.Executed;
    case 4: return ProposalStatus.Cancelled;
    default: return ProposalStatus.Active;
  }
}

function decodeOptionalI64(data: Buffer, offset: number): [bigint | null, number] {
  const hasValue = data[offset] === 1;
  if (!hasValue) {
    return [null, offset + 1];
  }
  const value = data.readBigInt64LE(offset + 1);
  return [value, offset + 9];
}

export function deserializeProposal(data: Buffer): ProposalAccount {
  let offset = 0;

  const [isInitialized, o1] = decodeBool(data, offset);
  offset = o1;

  const [dao, o2] = decodePublicKey(data, offset);
  offset = o2;

  const [proposer, o3] = decodePublicKey(data, offset);
  offset = o3;

  const [proposalId, o4] = decodeU64(data, offset);
  offset = o4;

  const [title, o5] = decodeString(data, offset);
  offset = o5;

  const [description, o6] = decodeString(data, offset);
  offset = o6;

  const status = decodeProposalStatus(data[offset]);
  offset += 1;

  const [votesFor, o7] = decodeU64(data, offset);
  offset = o7;

  const [votesAgainst, o8] = decodeU64(data, offset);
  offset = o8;

  const voterCount = data.readUInt32LE(offset);
  offset += 4;

  const payloadLen = data.readUInt32LE(offset);
  offset += 4;
  const executionPayload = new Uint8Array(data.slice(offset, offset + payloadLen));
  offset += payloadLen;

  const [createdAt, o9] = decodeI64(data, offset);
  offset = o9;

  const [votingEndsAt, o10] = decodeI64(data, offset);
  offset = o10;

  const [finalizedAt, o11] = decodeOptionalI64(data, offset);
  offset = o11;

  const [executedAt, o12] = decodeOptionalI64(data, offset);
  offset = o12;

  const bump = data[offset];

  return {
    isInitialized,
    dao,
    proposer,
    proposalId,
    title,
    description,
    status,
    votesFor,
    votesAgainst,
    voterCount,
    executionPayload,
    createdAt,
    votingEndsAt,
    finalizedAt,
    executedAt,
    bump,
  };
}
