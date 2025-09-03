import fs from 'fs/promises';
import path from 'path';

export class StoreError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
export async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic load function with type safety
export async function loadJsonFile<T>(fileName: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new StoreError('READ_ERROR', `Failed to read ${fileName}: ${error.message}`);
  }
}

// In-memory write locks to prevent concurrent access
const writeLocks = new Set<string>();

// Generic save function with atomic writes
export async function saveJsonFile<T>(fileName: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  
  if (writeLocks.has(filePath)) {
    throw new StoreError('LOCK_ERROR', 'File is currently being written');
  }
  
  writeLocks.add(filePath);
  
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
  } finally {
    writeLocks.delete(filePath);
  }
}

