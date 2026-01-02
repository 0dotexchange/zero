import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Keypair, PublicKey } from '@solana/web3.js';

export interface ZeroCliConfig {
  cluster: string;
  keypairPath: string;
  programId: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.zero');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CLI_CONFIG: ZeroCliConfig = {
  cluster: 'https://api.devnet.solana.com',
  keypairPath: path.join(os.homedir(), '.config', 'solana', 'id.json'),
  programId: 'ZER0DAO1111111111111111111111111111111111111',
};

export function loadConfig(): ZeroCliConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_CLI_CONFIG;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CLI_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CLI_CONFIG;
  }
}

export function saveConfig(config: Partial<ZeroCliConfig>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const current = loadConfig();
  const merged = { ...current, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}

export function loadKeypair(configPath?: string): Keypair {
  const config = loadConfig();
  const keypairFile = configPath || config.keypairPath;

  if (!fs.existsSync(keypairFile)) {
    throw new Error(`Keypair file not found: ${keypairFile}`);
  }

  const raw = fs.readFileSync(keypairFile, 'utf-8');
  const secretKey = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secretKey);
}

export function getProgramId(): PublicKey {
  const config = loadConfig();
  return new PublicKey(config.programId);
}

export function getClusterUrl(): string {
  const config = loadConfig();
  return config.cluster;
}
