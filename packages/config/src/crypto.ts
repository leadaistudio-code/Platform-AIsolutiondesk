import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { env } from './env';

/**
 * AES-256-GCM envelope encryption for per-tenant integration credentials.
 *
 * Layout of the stored blob: [ 12-byte IV | 16-byte authTag | ciphertext ].
 * The key is supplied via ENCRYPTION_KEY (32-byte hex). In production this
 * value should come from a KMS / secret manager, not a static env var.
 */
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function key(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

export function encryptSecret(plaintext: string): Buffer {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

export function decryptSecret(blob: Buffer): string {
  const iv = blob.subarray(0, IV_LEN);
  const authTag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

/** Convenience for JSON credential objects. */
export function encryptJson(obj: unknown): Buffer {
  return encryptSecret(JSON.stringify(obj));
}

export function decryptJson<T = unknown>(blob: Buffer): T {
  return JSON.parse(decryptSecret(blob)) as T;
}
