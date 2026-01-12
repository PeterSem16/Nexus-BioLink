/**
 * Token Encryption/Decryption Module
 * Uses AES-256-GCM for encrypting sensitive OAuth tokens at rest
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET not configured - required for token encryption');
  }
  return crypto.scryptSync(secret, 'oauth-token-salt', 32);
}

/**
 * Encrypt a token for storage
 * Returns base64 encoded string containing IV + AuthTag + CipherText
 */
export function encryptToken(plainToken: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainToken, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a token from storage
 * Expects base64 encoded string containing IV + AuthTag + CipherText
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedToken, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

// Encrypted tokens are prefixed with this marker for unambiguous identification
const ENCRYPTED_PREFIX = 'ENC:';

/**
 * Encrypt a token for storage with explicit marker
 * Returns prefixed base64 encoded string
 */
export function encryptTokenWithMarker(plainToken: string): string {
  return ENCRYPTED_PREFIX + encryptToken(plainToken);
}

/**
 * Check if a token is encrypted (has explicit prefix marker)
 */
export function isEncryptedToken(token: string): boolean {
  if (!token) return false;
  return token.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Decrypt a token - handles encrypted (new and legacy) and plaintext tokens
 * 1. Tokens with ENC: prefix: decrypts and returns plaintext
 * 2. Tokens without prefix: attempts decryption (legacy encrypted), falls back to plaintext JWT
 */
export function decryptTokenSafe(token: string): string {
  if (!token) return token;
  
  // New format: explicit ENC: prefix
  if (token.startsWith(ENCRYPTED_PREFIX)) {
    const encryptedPart = token.substring(ENCRYPTED_PREFIX.length);
    return decryptToken(encryptedPart);
  }
  
  // Check if this looks like a JWT (starts with eyJ = base64 for {"...)
  // JWTs are plaintext tokens from Microsoft - don't try to decrypt
  if (token.startsWith('eyJ')) {
    return token;
  }
  
  // Try to decrypt legacy encrypted tokens (base64 without prefix)
  // If decryption fails, assume it's plaintext and return as-is
  try {
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (base64Regex.test(token) && token.length > 100) {
      return decryptToken(token);
    }
  } catch (e) {
    // Decryption failed - token is likely plaintext, return as-is
  }
  
  return token;
}
