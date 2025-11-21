import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../types';
import { encodeString, encodeU16, encodeI64, encodeU64 } from '../utils';

const INSTRUCTION_INDEX = 0;

export function createInitializeDaoInstruction(
  authority: PublicKey,
  daoPda: PublicKey,
  treasuryPda: PublicKey,
  tokenMint: PublicKey,
  name: string,
  quorumBps: number,
  approvalThresholdBps: number,
  votingPeriod: number,
  minProposalTokens: number,
  minVoteTokens: number,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from([INSTRUCTION_INDEX]),
    encodeString(name),
    encodeU16(quorumBps),
    encodeU16(approvalThresholdBps),
    encodeI64(votingPeriod),
    encodeU64(minProposalTokens),
    encodeU64(minVoteTokens),
  ]);

  const keys = [
    { pubkey: authority, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: true },
    { pubkey: treasuryPda, isSigner: false, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
