import crypto from 'crypto';

interface FileTokenData {
  fileName: string;
  uploadTime: number;
}

const tokens = new Map<string, FileTokenData>();

export function storeFileToken(fileName: string): string {
  const token = crypto.randomBytes(16).toString('hex');
  tokens.set(token, {
    fileName,
    uploadTime: Date.now()
  });
  
  // Clean up old tokens (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of tokens.entries()) {
    if (value.uploadTime < oneHourAgo) {
      tokens.delete(key);
    }
  }
  
  return token;
}

export function getFileTokenData(token: string): FileTokenData | null {
  return tokens.get(token) || null;
}

export function clearFileToken(token: string): void {
  tokens.delete(token);
}