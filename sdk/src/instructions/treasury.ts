import {
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../types';
import { encodeU64 } from '../utils';

const DEPOSIT_TREASURY_INDEX = 7;
const WITHDRAW_TREASURY_INDEX = 8;

export function createDepositTreasuryInstruction(
  depositor: PublicKey,
  daoPda: PublicKey,
  treasuryPda: PublicKey,
  depositorTokenAccount: PublicKey,
  treasuryTokenAccount: PublicKey,
  tokenProgram: PublicKey,
  amount: number,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from([DEPOSIT_TREASURY_INDEX]),
    encodeU64(amount),
  ]);

  const keys = [
    { pubkey: depositor, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: treasuryPda, isSigner: false, isWritable: true },
    { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function createWithdrawTreasuryInstruction(
  authority: PublicKey,
  daoPda: PublicKey,
  treasuryPda: PublicKey,
  destinationTokenAccount: PublicKey,
  treasuryTokenAccount: PublicKey,
  tokenProgram: PublicKey,
  amount: number,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from([WITHDRAW_TREASURY_INDEX]),
    encodeU64(amount),
  ]);

  const keys = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: treasuryPda, isSigner: false, isWritable: true },
    { pubkey: destinationTokenAccount, isSigner: false, isWritable: true },
    { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
