import { AgentAccount, AgentCapability, AgentStatus } from '../types';
import {
  decodeBool,
  decodePublicKey,
  decodeString,
  decodeI64,
  decodeU64,
  decodeU16,
  decodeOptionalPublicKey,
} from '../utils';

function decodeAgentStatus(value: number): AgentStatus {
  switch (value) {
    case 0: return AgentStatus.Active;
    case 1: return AgentStatus.Suspended;
    case 2: return AgentStatus.Deregistered;
    default: return AgentStatus.Active;
  }
}

function decodeCapabilities(data: Buffer, offset: number): [AgentCapability[], number] {
  const count = data.readUInt32LE(offset);
  offset += 4;

  const capabilities: AgentCapability[] = [];
  for (let i = 0; i < count; i++) {
    const [name, nextOffset] = decodeString(data, offset);
    offset = nextOffset;
    const [version, vOffset] = decodeU16(data, offset);
    offset = vOffset;
    capabilities.push({ name, version });
  }

  return [capabilities, offset];
}

export function deserializeAgent(data: Buffer): AgentAccount {
  let offset = 0;

  const [isInitialized, o1] = decodeBool(data, offset);
  offset = o1;

  const [dao, o2] = decodePublicKey(data, offset);
  offset = o2;

  const [owner, o3] = decodePublicKey(data, offset);
  offset = o3;

  const [agentName, o4] = decodeString(data, offset);
  offset = o4;

  const status = decodeAgentStatus(data[offset]);
  offset += 1;

  const [reputation, o5] = decodeI64(data, offset);
  offset = o5;

  const [tasksCompleted, o6] = decodeU64(data, offset);
  offset = o6;

  const [tasksFailed, o7] = decodeU64(data, offset);
  offset = o7;

  const proposalsCreated = data.readUInt32LE(offset);
  offset += 4;

  const votesCast = data.readUInt32LE(offset);
  offset += 4;

  const [capabilities, o8] = decodeCapabilities(data, offset);
  offset = o8;

  const [delegatedTo, o9] = decodeOptionalPublicKey(data, offset);
  offset = o9;

  const [delegatedWeight, o10] = decodeU64(data, offset);
  offset = o10;

  const [registeredAt, o11] = decodeI64(data, offset);
  offset = o11;

  const [lastActiveAt, o12] = decodeI64(data, offset);
  offset = o12;

  const bump = data[offset];

  return {
    isInitialized,
    dao,
    owner,
    agentName,
    status,
    reputation,
    tasksCompleted,
    tasksFailed,
    proposalsCreated,
    votesCast,
    capabilities,
    delegatedTo,
    delegatedWeight,
    registeredAt,
    lastActiveAt,
    bump,
  };
}
