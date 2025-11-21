import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../types';
import { encodeString } from '../utils';

const CREATE_PROPOSAL_INDEX = 1;
const FINALIZE_PROPOSAL_INDEX = 3;
const EXECUTE_PROPOSAL_INDEX = 4;

export function createCreateProposalInstruction(
  proposer: PublicKey,
  daoPda: PublicKey,
  proposalPda: PublicKey,
  proposerTokenAccount: PublicKey,
  title: string,
  description: string,
  executionPayload: Buffer = Buffer.alloc(0),
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const payloadLen = Buffer.alloc(4);
  payloadLen.writeUInt32LE(executionPayload.length);

  const data = Buffer.concat([
    Buffer.from([CREATE_PROPOSAL_INDEX]),
    encodeString(title),
    encodeString(description),
    payloadLen,
    executionPayload,
  ]);

  const keys = [
    { pubkey: proposer, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: true },
    { pubkey: proposalPda, isSigner: false, isWritable: true },
    { pubkey: proposerTokenAccount, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function createFinalizeProposalInstruction(
  caller: PublicKey,
  daoPda: PublicKey,
  proposalPda: PublicKey,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.from([FINALIZE_PROPOSAL_INDEX]);

  const keys = [
    { pubkey: caller, isSigner: true, isWritable: false },
    { pubkey: daoPda, isSigner: false, isWritable: true },
    { pubkey: proposalPda, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function createExecuteProposalInstruction(
  authority: PublicKey,
  daoPda: PublicKey,
  proposalPda: PublicKey,
  treasuryPda: PublicKey,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.from([EXECUTE_PROPOSAL_INDEX]);

  const keys = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: daoPda, isSigner: false, isWritable: true },
    { pubkey: proposalPda, isSigner: false, isWritable: true },
    { pubkey: treasuryPda, isSigner: false, isWritable: true },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
