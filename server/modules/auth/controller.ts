import {
  createJwt,
} from "./jwt";
import {
  generatePassword,
  hashPassword,
  verifyPassword,
} from "./hash";

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

function json(
  data: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

function normalizeUsername(
  username: string,
): string {
  return username.trim().toLowerCase();
}

export async function setupAdmin(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.JWT_SECRET) {
    return json(
      { error: "JWT_SECRET is not configured." },
      500,
    );
  }

  const count = await env.DB
    .prepare(
      "SELECT COUNT(*) AS count FROM users",
    )
    .first<{ count: number }>();

  if (Number(count?.count || 0) > 0) {
    return json(
      {
        error:
          "Admin setup is already completed.",
      },
      409,
    );
  }

  const body = await request.json() as {
    username?: string;
    password?: string;
  };

  const username =
    normalizeUsername(body.username || "");
  const password = body.password || "";

  if (!username || username.length < 3) {
    return json(
      { error: "Username must be at least 3 characters." },
      400,
    );
  }

  if (password.length < 8) {
    return json(
      { error: "Password must be at least 8 characters." },
      400,
    );
  }

  const id = crypto.randomUUID();
  const passwordHash =
    await hashPassword(password);

  await env.DB
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
      VALUES (?, ?, ?, 'admin', NULL, 1, datetime('now'), datetime('now'))
      `,
    )
    .bind(
      id,
      username,
      passwordHash,
    )
    .run();

  const token = await createJwt(
    {
      sub: id,
      username,
      role: "admin",
      clientId: null,
    },
    env.JWT_SECRET,
  );

  return json({
    token,
    user: {
      id,
      username,
      role: "admin",
      clientId: null,
    },
  });
}

export async function login(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.JWT_SECRET) {
    return json(
      { error: "JWT_SECRET is not configured." },
      500,
    );
  }

  const body = await request.json() as {
    username?: string;
    password?: string;
  };

  const username =
    normalizeUsername(body.username || "");
  const password = body.password || "";

  if (!username || !password) {
    return json(
      { error: "Username and password are required." },
      400,
    );
  }

  const user = await env.DB
    .prepare(
      `
      SELECT
        id,
        username,
        password_hash,
        role,
        client_id,
        is_active
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
    )
    .bind(username)
    .first<{
      id: string;
      username: string;
      password_hash: string;
      role: "admin" | "client";
      client_id: string | null;
      is_active: number;
    }>();

  if (
    !user ||
    !user.is_active ||
    !(await verifyPassword(
      password,
      user.password_hash,
    ))
  ) {
    return json(
      { error: "Invalid username or password." },
      401,
    );
  }

  const token = await createJwt(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      clientId: user.client_id,
    },
    env.JWT_SECRET,
  );

  return json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      clientId: user.client_id,
    },
  });
}

export { generatePassword };
