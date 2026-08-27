const PBKDF2_ITERATIONS = 100_000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const passwordBytes = new TextEncoder().encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_LENGTH * 8,
  );
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 1) {
    throw new Error("Password is required");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derivedBits = await deriveKey(password, salt);
  const hash = new Uint8Array(derivedBits);

  return `${bytesToBase64(salt)}.${bytesToBase64(hash)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  const parts = storedHash.split(".");

  if (parts.length !== 2) {
    return false;
  }

  try {
    const salt = base64ToBytes(parts[0]);
    const expectedHash = base64ToBytes(parts[1]);

    const derivedBits = await deriveKey(password, salt);
    const actualHash = new Uint8Array(derivedBits);

    return constantTimeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

export async function generatePassword(length = 16): Promise<string> {
  const safeLength = Math.max(12, Math.min(length, 64));

  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const random = crypto.getRandomValues(new Uint32Array(safeLength));

  let password = "";

  for (let i = 0; i < safeLength; i += 1) {
    password += alphabet[random[i] % alphabet.length];
  }

  return password;
}
