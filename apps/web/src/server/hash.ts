import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of buffer data
 */
export async function sha256(buffer: ArrayBuffer | Buffer): Promise<string> {
  const hash = createHash('sha256');
  hash.update(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Generate SHA-256 hash of string
 */
export async function sha256Text(text: string): Promise<string> {
  const hash = createHash('sha256');
  hash.update(text, 'utf8');
  return hash.digest('hex');
}

/**
 * Normalize text for consistent hashing
 * - Uppercase
 * - Collapse whitespace
 * - Strip punctuation except digits and /-.
 */
export function normalizeTextForHash(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^\w\s\/\-\.]/g, ' ')  // Keep only word chars, spaces, /, -, .
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .trim();
}