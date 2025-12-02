import { TreasuryAccount, AllocationRecord } from '../types';
import {
  decodeBool,
  decodePublicKey,
  decodeU64,
  decodeI64,
} from '../utils';

function decodeAllocationRecords(data: Buffer, offset: number): [AllocationRecord[], number] {
  const count = data.readUInt32LE(offset);
  offset += 4;

  const records: AllocationRecord[] = [];
  for (let i = 0; i < count; i++) {
    const [proposalId, o1] = decodeU64(data, offset);
    offset = o1;
    const [amount, o2] = decodeU64(data, offset);
    offset = o2;
    const [recipient, o3] = decodePublicKey(data, offset);
    offset = o3;
    const [allocatedAt, o4] = decodeI64(data, offset);
    offset = o4;
    records.push({ proposalId, amount, recipient, allocatedAt });
  }

  return [records, offset];
}

export function deserializeTreasury(data: Buffer): TreasuryAccount {
  let offset = 0;

  const [isInitialized, o1] = decodeBool(data, offset);
  offset = o1;

  const [dao, o2] = decodePublicKey(data, offset);
  offset = o2;

  const [tokenMint, o3] = decodePublicKey(data, offset);
  offset = o3;

  const [totalDeposits, o4] = decodeU64(data, offset);
  offset = o4;

  const [totalWithdrawals, o5] = decodeU64(data, offset);
  offset = o5;

  const [pendingAllocations, o6] = decodeU64(data, offset);
  offset = o6;

  const allocationCount = data.readUInt32LE(offset);
  offset += 4;

  const [recentAllocations, o7] = decodeAllocationRecords(data, offset);
  offset = o7;

  const [lastDepositAt, o8] = decodeI64(data, offset);
  offset = o8;

  const [lastWithdrawalAt, o9] = decodeI64(data, offset);
  offset = o9;

  const bump = data[offset];

  return {
    isInitialized,
    dao,
    tokenMint,
    totalDeposits,
    totalWithdrawals,
    pendingAllocations,
    allocationCount,
    recentAllocations,
    lastDepositAt,
    lastWithdrawalAt,
    bump,
  };
}
