import chalk from 'chalk';
import ora from 'ora';
import { PublicKey } from '@solana/web3.js';

export function success(message: string): void {
  console.log(chalk.green('  ✓ ') + message);
}

export function error(message: string): void {
  console.error(chalk.red('  ✗ ') + message);
}

export function info(message: string): void {
  console.log(chalk.cyan('  ℹ ') + message);
}

export function warn(message: string): void {
  console.log(chalk.yellow('  ⚠ ') + message);
}

export function header(title: string): void {
  console.log();
  console.log(chalk.bold.white(`  ${title}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

export function keyValue(key: string, value: string): void {
  console.log(`  ${chalk.dim(key + ':')} ${value}`);
}

export function createSpinner(text: string) {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots',
  });
}

export function shortenKey(key: PublicKey | string, chars: number = 4): string {
  const str = typeof key === 'string' ? key : key.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatTimestamp(unix: bigint | number): string {
  const date = new Date(Number(unix) * 1000);
  return date.toLocaleString();
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: chalk.green('Active'),
    1: chalk.blue('Approved'),
    2: chalk.red('Rejected'),
    3: chalk.magenta('Executed'),
    4: chalk.gray('Cancelled'),
  };
  return statusMap[status] || chalk.dim('Unknown');
}

export function formatAgentStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: chalk.green('Active'),
    1: chalk.yellow('Suspended'),
    2: chalk.red('Deregistered'),
  };
  return statusMap[status] || chalk.dim('Unknown');
}

export function table(rows: [string, string][]): void {
  const maxKeyLen = Math.max(...rows.map(([k]) => k.length));
  for (const [key, value] of rows) {
    console.log(`  ${chalk.dim(key.padEnd(maxKeyLen + 2))}${value}`);
  }
}

export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();
  try {
    const result = await fn();
    spinner.succeed(text);
    return result;
  } catch (err) {
    spinner.fail(text);
    throw err;
  }
}
