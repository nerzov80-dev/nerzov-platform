const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const KEY_LENGTH = 256;

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

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  return baseKey;
}

export async function hashPassword(
  password: string,
): Promise<string> {
  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_BYTES),
  );

  const baseKey = await deriveKey(password, salt);

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    KEY_LENGTH,
  );

  return [
    "pbkdf2",
    "sha256",
    String(PBKDF2_ITERATIONS),
    bytesToBase64(salt),
    bytesToBase64(new Uint8Array(bits)),
  ].join("$");
}

function constantTimeEqual(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i];
  }

  return difference === 0;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");

  if (parts.length !== 5) return false;

  const [
    algorithm,
    hashAlgorithm,
    iterationsString,
    saltBase64,
    hashBase64,
  ] = parts;

  if (
    algorithm !== "pbkdf2" ||
    hashAlgorithm !== "sha256"
  ) {
    return false;
  }

  const iterations = Number(iterationsString);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const salt = base64ToBytes(saltBase64);
  const expected = base64ToBytes(hashBase64);

  const baseKey = await deriveKey(password, salt);

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    expected.length * 8,
  );

  return constantTimeEqual(
    expected,
    new Uint8Array(bits),
  );
}

export function generatePassword(
  length = 14,
): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const values = crypto.getRandomValues(
    new Uint32Array(length),
  );

  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += alphabet[values[i] % alphabet.length];
  }

  return result;
}
