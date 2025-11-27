import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../types';
import { encodeBool, encodeU64, encodePublicKey } from '../utils';

const CAST_VOTE_INDEX = 2;
const DELEGATE_VOTING_INDEX = 9;

export function createCastVoteInstruction(
  voter: PublicKey,
  daoPda: PublicKey,
  proposalPda: PublicKey,
  voteRecordPda: PublicKey,
  voterTokenAccount: PublicKey,
  approve: boolean,
  weight: number,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from([CAST_VOTE_INDEX]),
    encodeBool(approve),
    encodeU64(weight),
  ]);

  const keys = [
    { pubkey: voter, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: proposalPda, isSigner: false, isWritable: true },
    { pubkey: voteRecordPda, isSigner: false, isWritable: true },
    { pubkey: voterTokenAccount, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function createDelegateVotingPowerInstruction(
  delegator: PublicKey,
  daoPda: PublicKey,
  agentPda: PublicKey,
  delegateTo: PublicKey,
  weight: number,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from([DELEGATE_VOTING_INDEX]),
    encodePublicKey(delegateTo),
    encodeU64(weight),
  ]);

  const keys = [
    { pubkey: delegator, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: agentPda, isSigner: false, isWritable: true },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
