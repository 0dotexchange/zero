import { Command } from 'commander';
import { Connection, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { loadKeypair, getClusterUrl, getProgramId } from '../config';
import { success, error, header, keyValue, withSpinner, formatTimestamp, formatAgentStatus, table } from '../utils';

export function registerAgentCommands(program: Command): void {
  const agent = program.command('agent').description('AGI agent management commands');

  agent
    .command('register')
    .description('Register an AGI agent with a DAO')
    .requiredOption('--dao <name>', 'DAO name')
    .requiredOption('--name <agentName>', 'Agent display name')
    .option('--capabilities <caps...>', 'Agent capabilities', [])
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findAgentAddress } = await import('../../sdk/src/utils');
        const { createRegisterAgentInstruction } = await import('../../sdk/src/instructions/agent');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const [agentPda] = findAgentAddress(daoPda, keypair.publicKey, programId);

        header('Registering Agent');
        keyValue('DAO', opts.dao);
        keyValue('Agent Name', opts.name);
        keyValue('Capabilities', opts.capabilities.join(', ') || 'none');

        const ix = createRegisterAgentInstruction(
          keypair.publicKey, daoPda, agentPda,
          opts.name, opts.capabilities, programId
        );

        const sig = await withSpinner('Registering agent on-chain', async () => {
          const tx = new Transaction().add(ix);
          return sendAndConfirmTransaction(connection, tx, [keypair]);
        });

        success(`Agent '${opts.name}' registered`);
        keyValue('Signature', sig);
        keyValue('Agent Address', agentPda.toBase58());
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });

  agent
    .command('info')
    .description('Display agent information')
    .requiredOption('--dao <name>', 'DAO name')
    .option('--keypair <path>', 'Path to keypair file')
    .action(async (opts) => {
      try {
        const keypair = loadKeypair(opts.keypair);
        const connection = new Connection(getClusterUrl(), 'confirmed');
        const programId = getProgramId();

        const { findDaoAddress, findAgentAddress } = await import('../../sdk/src/utils');
        const { deserializeAgent } = await import('../../sdk/src/accounts/agent');

        const [daoPda] = findDaoAddress(opts.dao, programId);
        const [agentPda] = findAgentAddress(daoPda, keypair.publicKey, programId);

        const accountInfo = await connection.getAccountInfo(agentPda);
        if (!accountInfo) {
          error('Agent not found');
          process.exit(1);
        }

        const ag = deserializeAgent(Buffer.from(accountInfo.data));

        header(`Agent: ${ag.agentName}`);
        table([
          ['Status', formatAgentStatus(ag.status)],
          ['Owner', ag.owner.toBase58()],
          ['Reputation', ag.reputation.toString()],
          ['Tasks Completed', ag.tasksCompleted.toString()],
          ['Tasks Failed', ag.tasksFailed.toString()],
          ['Proposals Created', ag.proposalsCreated.toString()],
          ['Votes Cast', ag.votesCast.toString()],
          ['Capabilities', ag.capabilities.map(c => c.name).join(', ') || 'none'],
          ['Registered', formatTimestamp(ag.registeredAt)],
          ['Last Active', formatTimestamp(ag.lastActiveAt)],
        ]);

        if (ag.delegatedTo) {
          keyValue('Delegated To', ag.delegatedTo.toBase58());
          keyValue('Delegated Weight', ag.delegatedWeight.toString());
        }
      } catch (err: any) {
        error(err.message);
        process.exit(1);
      }
    });
}
