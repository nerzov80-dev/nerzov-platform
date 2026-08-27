interface JwtPayload {
  sub: string;
  username: string;
  role: "admin" | "client";
  clientId: string | null;
  iat: number;
  exp: number;
}

function bytesToBase64Url(
  bytes: Uint8Array,
): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(
  value: string,
): Uint8Array {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeJson(
  value: unknown,
): string {
  return bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(value)),
  );
}

function decodeJson<T>(
  value: string,
): T {
  return JSON.parse(
    new TextDecoder().decode(
      base64UrlToBytes(value),
    ),
  ) as T;
}

async function getSigningKey(
  secret: string,
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );
}

async function sign(
  input: string,
  secret: string,
): Promise<string> {
  const key = await getSigningKey(secret);

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(input),
  );

  return bytesToBase64Url(
    new Uint8Array(signature),
  );
}

export async function createJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  ttlSeconds = 60 * 60 * 24,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = encodeJson({
    alg: "HS256",
    typ: "JWT",
  });

  const body = encodeJson({
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  });

  const unsigned = `${header}.${body}`;
  const signature = await sign(unsigned, secret);

  return `${unsigned}.${signature}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  const parts = token.split(".");

  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;

  const key = await getSigningKey(secret);

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(unsigned),
  );

  if (!valid) return null;

  try {
    const payload = decodeJson<JwtPayload>(body);

    if (
      !payload.exp ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
