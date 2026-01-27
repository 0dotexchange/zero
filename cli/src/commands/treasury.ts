import { Command } from 'commander';
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { loadKeypair, getClusterUrl, getProgramId } from '../config';
import { success, error, header, keyValue, withSpinner, formatTimestamp, table } from '../utils';

export function registerTreasuryCommands(program: Command): void {
  const treasury = program.command('treasury').description('Treasury management commands');

  treasury
    .command('info')
    .description('Display treasury information')
    .requiredOption('--dao <name>', 'DAO name')
    .action(async (opts) => {
      try {
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findTreasuryAddress } = await import('../../sdk/src/utils');
        const { deserializeTreasury } = await import('../../sdk/src/accounts/treasury');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const [treasuryPda] = findTreasuryAddress(daoPda, programId);

        const accountInfo = await connection.getAccountInfo(treasuryPda);
        if (!accountInfo) {
          error('Treasury not found');
          process.exit(1);
        }

        const tr = deserializeTreasury(Buffer.from(accountInfo.data));
        const available = tr.totalDeposits - tr.totalWithdrawals - tr.pendingAllocations;

        header(`Treasury for DAO: ${opts.dao}`);
        table([
          ['Token Mint', tr.tokenMint.toBase58()],
          ['Total Deposits', tr.totalDeposits.toString()],
          ['Total Withdrawals', tr.totalWithdrawals.toString()],
          ['Pending Allocations', tr.pendingAllocations.toString()],
          ['Available Balance', available.toString()],
          ['Allocation Count', tr.allocationCount.toString()],
          ['Last Deposit', tr.lastDepositAt > 0n ? formatTimestamp(tr.lastDepositAt) : 'never'],
          ['Last Withdrawal', tr.lastWithdrawalAt > 0n ? formatTimestamp(tr.lastWithdrawalAt) : 'never'],
        ]);

        if (tr.recentAllocations.length > 0) {
          header('Recent Allocations');
          for (const alloc of tr.recentAllocations) {
            console.log(`  Proposal #${alloc.proposalId} — ${alloc.amount} tokens to ${alloc.recipient.toBase58().slice(0, 8)}…`);
          }
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
