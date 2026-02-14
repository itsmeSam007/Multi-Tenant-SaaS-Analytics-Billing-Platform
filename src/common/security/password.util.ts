import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';

// Passwords: use bcrypt (slow hash protects low-entropy inputs)
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

// Tokens: use SHA-256 (tokens are already cryptographically random,
// bcrypt's 72-byte truncation makes it unsafe for long inputs like JWTs)
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false;
  try {
    const incoming = Buffer.from(createHash('sha256').update(token).digest('hex'), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return timingSafeEqual(incoming, stored);
  } catch {
    return false;
  }
}