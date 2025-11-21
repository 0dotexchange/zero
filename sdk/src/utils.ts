import { PublicKey } from '@solana/web3.js';
import {
  PROGRAM_ID,
  DAO_SEED,
  PROPOSAL_SEED,
  AGENT_SEED,
  TREASURY_SEED,
  VOTE_RECORD_SEED,
} from './types';

export function findDaoAddress(name: string, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DAO_SEED, Buffer.from(name)],
    programId
  );
}

export function findProposalAddress(
  dao: PublicKey,
  proposalId: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(proposalId));
  return PublicKey.findProgramAddressSync(
    [PROPOSAL_SEED, dao.toBuffer(), idBuffer],
    programId
  );
}

export function findAgentAddress(
  dao: PublicKey,
  owner: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [AGENT_SEED, dao.toBuffer(), owner.toBuffer()],
    programId
  );
}

export function findTreasuryAddress(
  dao: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [TREASURY_SEED, dao.toBuffer()],
    programId
  );
}

export function findVoteRecordAddress(
  proposal: PublicKey,
  voter: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VOTE_RECORD_SEED, proposal.toBuffer(), voter.toBuffer()],
    programId
  );
}

export function encodeString(value: string): Buffer {
  const encoded = Buffer.from(value, 'utf8');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32LE(encoded.length);
  return Buffer.concat([lengthBuf, encoded]);
}

export function decodeString(data: Buffer, offset: number): [string, number] {
  const length = data.readUInt32LE(offset);
  const str = data.slice(offset + 4, offset + 4 + length).toString('utf8');
  return [str, offset + 4 + length];
}

export function encodeU64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

export function decodeU64(data: Buffer, offset: number): [bigint, number] {
  const value = data.readBigUInt64LE(offset);
  return [value, offset + 8];
}

export function encodeI64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value));
  return buf;
}

export function decodeI64(data: Buffer, offset: number): [bigint, number] {
  const value = data.readBigInt64LE(offset);
  return [value, offset + 8];
}

export function encodeU16(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

export function decodeU16(data: Buffer, offset: number): [number, number] {
  return [data.readUInt16LE(offset), offset + 2];
}

export function encodeBool(value: boolean): Buffer {
  return Buffer.from([value ? 1 : 0]);
}

export function decodeBool(data: Buffer, offset: number): [boolean, number] {
  return [data[offset] === 1, offset + 1];
}

export function encodePublicKey(key: PublicKey): Buffer {
  return key.toBuffer();
}

export function decodePublicKey(data: Buffer, offset: number): [PublicKey, number] {
  const key = new PublicKey(data.slice(offset, offset + 32));
  return [key, offset + 32];
}

export function encodeOptionalPublicKey(key: PublicKey | null): Buffer {
  if (key === null) {
    return Buffer.from([0]);
  }
  return Buffer.concat([Buffer.from([1]), key.toBuffer()]);
}

export function decodeOptionalPublicKey(data: Buffer, offset: number): [PublicKey | null, number] {
  const hasValue = data[offset] === 1;
  if (!hasValue) {
    return [null, offset + 1];
  }
  const key = new PublicKey(data.slice(offset + 1, offset + 33));
  return [key, offset + 33];
}

export function shortenAddress(address: PublicKey | string, chars: number = 4): string {
  const str = typeof address === 'string' ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / 1_000_000_000;
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * 1_000_000_000));
}
