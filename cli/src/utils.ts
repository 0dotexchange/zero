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
