import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHmac,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SEPARATOR = ':';

/**
 * Lấy encryption key từ env.
 * Key phải là 32 bytes (hex 64 chars).
 * Nếu chưa set → trả null (fallback plaintext cho dev).
 */
function getEncryptionKey(): Buffer | null {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt token bằng AES-256-GCM.
 * Output: "enc:iv_hex:authTag_hex:ciphertext_hex"
 *
 * Nếu TOKEN_ENCRYPTION_KEY chưa set → trả plaintext (dev mode).
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    'enc',
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(SEPARATOR);
}

/**
 * Decrypt token đã encrypt bằng AES-256-GCM.
 *
 * Backward-compatible: nếu input không bắt đầu bằng "enc:" → coi là plaintext legacy.
 */
export function decryptToken(stored: string): string {
  if (!stored.startsWith('enc:')) return stored;

  const key = getEncryptionKey();
  if (!key) {
    // Key chưa set nhưng data đã encrypt → không decrypt được
    throw new Error(
      'TOKEN_ENCRYPTION_KEY not configured but encrypted token found',
    );
  }

  const parts = stored.split(SEPARATOR);
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const ciphertext = Buffer.from(parts[3], 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Tạo signed state cho OAuth (chống forge).
 * Format: "tenantId.timestamp.signature"
 * Signature = HMAC-SHA256(tenantId.timestamp, secret).substring(0, 16)
 */
export function createSignedState(tenantId: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${tenantId}.${timestamp}`;
  const sig = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return `${payload}.${sig}`;
}

/**
 * Verify + extract tenantId từ signed state.
 * Trả về tenantId nếu valid, throw nếu invalid/expired.
 * TTL mặc định: 10 phút.
 */
export function verifySignedState(
  state: string,
  secret: string,
  maxAgeSec = 600,
): string {
  const parts = state.split('.');

  // Backward-compatible: nếu state không có dấu chấm → coi là plain tenantId (legacy)
  if (parts.length < 3) return state;

  // state = "tenantId.timestamp.signature" — tenantId có thể chứa dấu gạch ngang (UUID)
  const sig = parts.pop()!;
  const timestamp = parts.pop()!;
  const tenantId = parts.join('.');

  // Verify signature
  const payload = `${tenantId}.${timestamp}`;
  const expectedSig = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);

  if (sig !== expectedSig) {
    throw new Error('Invalid OAuth state signature');
  }

  // Verify TTL
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > maxAgeSec) {
    throw new Error('OAuth state expired');
  }

  return tenantId;
}
