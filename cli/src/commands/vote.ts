import { Command } from 'commander';
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { loadKeypair, getClusterUrl, getProgramId } from '../config';
import { success, error, header, keyValue, withSpinner } from '../utils';

export function registerVoteCommands(program: Command): void {
  const vote = program.command('vote').description('Voting commands');

  vote
    .command('cast')
    .description('Cast a vote on a proposal')
    .requiredOption('--dao <name>', 'DAO name')
    .requiredOption('--proposal <id>', 'Proposal ID')
    .requiredOption('--approve <boolean>', 'Vote approve (true/false)')
    .requiredOption('--weight <number>', 'Vote weight')
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findProposalAddress, findVoteRecordAddress } = await import('../../sdk/src/utils');
        const { deserializeDao } = await import('../../sdk/src/accounts/dao');
        const { createCastVoteInstruction } = await import('../../sdk/src/instructions/vote');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const proposalId = parseInt(opts.proposal);
        const [proposalPda] = findProposalAddress(daoPda, proposalId, programId);
        const [voteRecordPda] = findVoteRecordAddress(proposalPda, keypair.publicKey, programId);

        const accountInfo = await connection.getAccountInfo(daoPda);
        if (!accountInfo) {
          error(`DAO '${opts.dao}' not found`);
          process.exit(1);
        }
        const dao = deserializeDao(Buffer.from(accountInfo.data));

        const [ata] = PublicKey.findProgramAddressSync(
          [
            keypair.publicKey.toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
            dao.tokenMint.toBuffer(),
          ],
          new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );

        const approve = opts.approve === 'true';
        const weight = parseInt(opts.weight);

        header('Casting Vote');
        keyValue('Proposal', `#${proposalId}`);
        keyValue('Vote', approve ? 'Approve' : 'Reject');
        keyValue('Weight', weight.toString());

        const ix = createCastVoteInstruction(
          keypair.publicKey, daoPda, proposalPda,
          voteRecordPda, ata, approve, weight, programId
        );

        const sig = await withSpinner('Submitting vote', async () => {
          const tx = new Transaction().add(ix);
          return sendAndConfirmTransaction(connection, tx, [keypair]);
        });

        success(`Vote cast on proposal #${proposalId}`);
        keyValue('Signature', sig);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  vote
    .command('delegate')
    .description('Delegate voting power to another address')
    .requiredOption('--dao <name>', 'DAO name')
    .requiredOption('--to <address>', 'Delegate target address')
    .requiredOption('--weight <number>', 'Delegation weight')
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findAgentAddress } = await import('../../sdk/src/utils');
        const { createDelegateVotingPowerInstruction } = await import('../../sdk/src/instructions/vote');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const [agentPda] = findAgentAddress(daoPda, keypair.publicKey, programId);
        const delegateTo = new PublicKey(opts.to);
        const weight = parseInt(opts.weight);

        header('Delegating Voting Power');
        keyValue('To', delegateTo.toBase58());
        keyValue('Weight', weight.toString());

        const ix = createDelegateVotingPowerInstruction(
          keypair.publicKey, daoPda, agentPda,
          delegateTo, weight, programId
        );

        const sig = await withSpinner('Processing delegation', async () => {
          const tx = new Transaction().add(ix);
          return sendAndConfirmTransaction(connection, tx, [keypair]);
        });

        success('Voting power delegated');
        keyValue('Signature', sig);
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
