import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../types';
import { encodeString } from '../utils';

const REGISTER_AGENT_INDEX = 5;
const UPDATE_REPUTATION_INDEX = 6;

export function createRegisterAgentInstruction(
  owner: PublicKey,
  daoPda: PublicKey,
  agentPda: PublicKey,
  agentName: string,
  capabilities: string[],
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const capCount = Buffer.alloc(4);
  capCount.writeUInt32LE(capabilities.length);

  const encodedCaps = capabilities.map(c => encodeString(c));

  const data = Buffer.concat([
    Buffer.from([REGISTER_AGENT_INDEX]),
    encodeString(agentName),
    capCount,
    ...encodedCaps,
  ]);

  const keys = [
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: agentPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ keys, programId, data });
}

export function createUpdateAgentReputationInstruction(
  authority: PublicKey,
  daoPda: PublicKey,
  agentPda: PublicKey,
  delta: number,
  reason: string,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const deltaBuf = Buffer.alloc(4);
  deltaBuf.writeInt32LE(delta);

  const data = Buffer.concat([
    Buffer.from([UPDATE_REPUTATION_INDEX]),
    deltaBuf,
    encodeString(reason),
  ]);

  const keys = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: daoPda, isSigner: false, isWritable: false },
    { pubkey: agentPda, isSigner: false, isWritable: true },
  ];

  return new TransactionInstruction({ keys, programId, data });
}
