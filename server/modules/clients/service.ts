import {
  generatePassword,
  hashPassword,
} from "../auth/hash";

export interface CreateClientData {
  businessName: string;
  phone: string;
  email?: string;
}

export async function createClient(
  db: D1Database,
  input: CreateClientData,
) {
  const clientId = crypto.randomUUID();

  const usernameBase =
    input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18) || "client";

  const suffix = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 6);

  const username =
    `${usernameBase}_${suffix}`;

  const password = await generatePassword();
  const passwordHash =
    await hashPassword(password);

  await db.batch([
    db
      .prepare(
        `
        INSERT INTO clients (
          id,
          business_name,
          phone,
          email,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `,
      )
      .bind(
        clientId,
        input.businessName.trim(),
        input.phone.trim(),
        input.email?.trim() || null,
      ),

    db
      .prepare(
        `
        INSERT INTO users (
          id,
          username,
          password_hash,
          role,
          client_id,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 'client', ?, 1, datetime('now'), datetime('now'))
        `,
      )
      .bind(
        crypto.randomUUID(),
        username,
        passwordHash,
        clientId,
      ),
  ]);

  const client = await db
    .prepare(
      `
      SELECT
        id,
        business_name AS businessName,
        phone,
        email,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM clients
      WHERE id = ?
      `,
    )
    .bind(clientId)
    .first();

  return {
    client,
    credentials: {
      username,
      password,
    },
  };
}
