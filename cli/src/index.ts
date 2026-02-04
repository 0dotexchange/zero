#!/usr/bin/env node

import { Command } from 'commander';
import { registerDaoCommands } from './commands/dao';
import { registerProposalCommands } from './commands/proposal';
import { registerAgentCommands } from './commands/agent';
import { registerTreasuryCommands } from './commands/treasury';
import { registerVoteCommands } from './commands/vote';

const program = new Command();

program
  .name('zero')
  .description('CLI for the Zero AGI DAO governance protocol on Solana')
  .version('0.1.0');

registerDaoCommands(program);
registerProposalCommands(program);
registerAgentCommands(program);
registerTreasuryCommands(program);
registerVoteCommands(program);

program.parse(process.argv);
