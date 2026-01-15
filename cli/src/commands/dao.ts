import { Command } from 'commander';
import { Connection, PublicKey } from '@solana/web3.js';
import { loadKeypair, getClusterUrl, getProgramId, saveConfig, loadConfig } from '../config';
import { success, error, header, keyValue, withSpinner, formatTimestamp, formatBps, table } from '../utils';

export function registerDaoCommands(program: Command): void {
  const dao = program.command('dao').description('DAO management commands');

  dao
    .command('init')
    .description('Initialize a new DAO')
    .requiredOption('--name <name>', 'DAO name')
    .requiredOption('--mint <address>', 'Governance token mint address')
    .option('--quorum <bps>', 'Quorum in basis points', '2000')
    .option('--threshold <bps>', 'Approval threshold in basis points', '5100')
    .option('--voting-period <seconds>', 'Voting period in seconds', '259200')
    .option('--min-proposal-tokens <amount>', 'Minimum tokens to create proposal', '100')
    .option('--min-vote-tokens <amount>', 'Minimum tokens to vote', '10')
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        header('Initializing DAO');
        keyValue('Name', opts.name);
        keyValue('Token Mint', opts.mint);
        keyValue('Quorum', formatBps(parseInt(opts.quorum)));
        keyValue('Threshold', formatBps(parseInt(opts.threshold)));

        const { findDaoAddress, findTreasuryAddress } = await import('../../sdk/src/utils');
        const { createInitializeDaoInstruction } = await import('../../sdk/src/instructions/dao');
        const { Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');

        const [daoPda] = findDaoAddress(opts.name, programId);
        const [treasuryPda] = findTreasuryAddress(daoPda, programId);
        const tokenMint = new PublicKey(opts.mint);

        const ix = createInitializeDaoInstruction(
          keypair.publicKey,
          daoPda,
          treasuryPda,
          tokenMint,
          opts.name,
          parseInt(opts.quorum),
          parseInt(opts.threshold),
          parseInt(opts.votingPeriod),
          parseInt(opts.minProposalTokens),
          parseInt(opts.minVoteTokens),
          programId
        );

        const sig = await withSpinner('Creating DAO on-chain', async () => {
          const tx = new Transaction().add(ix);
          return sendAndConfirmTransaction(connection, tx, [keypair]);
        });

        success(`DAO initialized: ${opts.name}`);
        keyValue('Signature', sig);
        keyValue('DAO Address', daoPda.toBase58());
        keyValue('Treasury', treasuryPda.toBase58());
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  dao
    .command('info')
    .description('Display DAO information')
    .requiredOption('--name <name>', 'DAO name')
    .action(async (opts) => {
      try {
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress } = await import('../../sdk/src/utils');
        const { deserializeDao } = await import('../../sdk/src/accounts/dao');

        const [daoPda] = findDaoAddress(opts.name, programId);
        const accountInfo = await connection.getAccountInfo(daoPda);

        if (!accountInfo) {
          error(`DAO '${opts.name}' not found`);
          process.exit(1);
        }

        const dao = deserializeDao(Buffer.from(accountInfo.data));

        header(`DAO: ${dao.name}`);
        table([
          ['Authority', dao.authority.toBase58()],
          ['Token Mint', dao.tokenMint.toBase58()],
          ['Quorum', formatBps(dao.quorumBps)],
          ['Approval Threshold', formatBps(dao.approvalThresholdBps)],
          ['Voting Period', `${Number(dao.votingPeriod)}s`],
          ['Proposals', `${dao.proposalCount} total, ${dao.activeProposalCount} active`],
          ['Agents', dao.agentCount.toString()],
          ['Delegated Weight', dao.totalDelegatedWeight.toString()],
          ['Created', formatTimestamp(dao.createdAt)],
        ]);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
