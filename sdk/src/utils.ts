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
