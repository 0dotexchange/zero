import { Command } from 'commander';
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { loadKeypair, getClusterUrl, getProgramId } from '../config';
import { success, error, header, keyValue, withSpinner, formatTimestamp, formatStatus, table } from '../utils';

export function registerProposalCommands(program: Command): void {
  const proposal = program.command('proposal').description('Proposal management commands');

  proposal
    .command('create')
    .description('Create a new governance proposal')
    .requiredOption('--dao <name>', 'DAO name')
    .requiredOption('--title <title>', 'Proposal title')
    .requiredOption('--description <desc>', 'Proposal description')
    .option('--payload <hex>', 'Execution payload in hex')
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findProposalAddress } = await import('../../sdk/src/utils');
        const { deserializeDao } = await import('../../sdk/src/accounts/dao');
        const { createCreateProposalInstruction } = await import('../../sdk/src/instructions/proposal');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const accountInfo = await connection.getAccountInfo(daoPda);
        if (!accountInfo) {
          error(`DAO '${opts.dao}' not found`);
          process.exit(1);
        }
        const dao = deserializeDao(Buffer.from(accountInfo.data));
        const proposalId = Number(dao.proposalCount);
        const [proposalPda] = findProposalAddress(daoPda, proposalId, programId);

        const [ata] = PublicKey.findProgramAddressSync(
          [
            keypair.publicKey.toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
            dao.tokenMint.toBuffer(),
          ],
          new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );

        const payload = opts.payload ? Buffer.from(opts.payload, 'hex') : Buffer.alloc(0);

        header('Creating Proposal');
        keyValue('DAO', opts.dao);
        keyValue('Title', opts.title);
        keyValue('Proposal ID', proposalId.toString());

        const ix = createCreateProposalInstruction(
          keypair.publicKey, daoPda, proposalPda, ata,
          opts.title, opts.description, payload, programId
        );

        const sig = await withSpinner('Submitting proposal', async () => {
          const tx = new Transaction().add(ix);
          return sendAndConfirmTransaction(connection, tx, [keypair]);
        });

        success(`Proposal #${proposalId} created`);
        keyValue('Signature', sig);
        keyValue('Proposal Address', proposalPda.toBase58());
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  proposal
    .command('info')
    .description('Display proposal details')
    .requiredOption('--dao <name>', 'DAO name')
    .requiredOption('--id <number>', 'Proposal ID')
    .action(async (opts) => {
      try {
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findProposalAddress } = await import('../../sdk/src/utils');
        const { deserializeProposal } = await import('../../sdk/src/accounts/proposal');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const [proposalPda] = findProposalAddress(daoPda, parseInt(opts.id), programId);

        const accountInfo = await connection.getAccountInfo(proposalPda);
        if (!accountInfo) {
          error(`Proposal #${opts.id} not found`);
          process.exit(1);
        }

        const prop = deserializeProposal(Buffer.from(accountInfo.data));

        header(`Proposal #${prop.proposalId}`);
        table([
          ['Title', prop.title],
          ['Status', formatStatus(prop.status)],
          ['Proposer', prop.proposer.toBase58()],
          ['Votes For', prop.votesFor.toString()],
          ['Votes Against', prop.votesAgainst.toString()],
          ['Voter Count', prop.voterCount.toString()],
          ['Created', formatTimestamp(prop.createdAt)],
          ['Voting Ends', formatTimestamp(prop.votingEndsAt)],
        ]);

        if (prop.finalizedAt) {
          keyValue('Finalized', formatTimestamp(prop.finalizedAt));
        }
        if (prop.executedAt) {
          keyValue('Executed', formatTimestamp(prop.executedAt));
        }
      } catch (err: any) {
        error(err.message);
