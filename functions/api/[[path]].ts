interface Env {
  DB: D1Database;
}

// Password Hashing Helper (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // -------------------------------------------------------------
    // 1. AUTH LOGIN (Admin & Client Login)
    // -------------------------------------------------------------
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = (await request.json()) as any;
      const rawIdentifier = (body.email || body.username || "").trim().toLowerCase();
      const rawPassword = body.password || "";
      const reqRole = (body.role || "").trim().toUpperCase();

      if (!rawIdentifier || !rawPassword) {
        return new Response(
          JSON.stringify({ message: "ইমেইল এবং পাসওয়ার্ড প্রদান করুন।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      if (!env.DB) {
        return new Response(
          JSON.stringify({ message: "D1 Database binding (DB) পাওয়া যায়নি। রি-ডিপ্লয় করুন।" }),
          { status: 500, headers: jsonHeaders }
        );
      }

      const hashedPassword = await hashPassword(rawPassword);

      // Check BOTH username AND email columns, accepting hashed or plain password
      const user = (await env.DB.prepare(
        "SELECT * FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND (password = ? OR password = ?)"
      )
        .bind(rawIdentifier, rawIdentifier, hashedPassword, rawPassword.trim())
        .first()) as any;

      if (!user) {
        return new Response(
          JSON.stringify({ message: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" }),
          { status: 401, headers: jsonHeaders }
        );
      }

      if (reqRole && user.role.toUpperCase() !== reqRole) {
        return new Response(
          JSON.stringify({ message: `আপনার অ্যাকাউন্টটি ${user.role} রোল-এর, কিন্তু আপনি ${reqRole} পোর্টালে লগইন করার চেষ্টা করছেন।` }),
          { status: 403, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          token: `token-${user.id}-${Date.now()}`,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            clientId: user.client_id || null,
          },
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // -------------------------------------------------------------
    // 2. GET ALL CLIENTS
    // -------------------------------------------------------------
    if (url.pathname === "/api/admin/clients" && request.method === "GET") {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ message: "D1 Database binding (DB) পাওয়া যায়নি।" }),
          { status: 500, headers: jsonHeaders }
        );
      }

      const { results } = await env.DB.prepare(
        "SELECT id, business_name as businessName, email, phone, created_at as createdAt FROM clients ORDER BY created_at DESC"
      ).all();

      return new Response(
        JSON.stringify({ clients: results || [] }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // -------------------------------------------------------------
    // 3. CREATE NEW CLIENT & USER
    // -------------------------------------------------------------
    if (url.pathname === "/api/admin/clients" && request.method === "POST") {
      const body = (await request.json()) as any;
      const { businessName, email, phone, password } = body;

      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPassword = (password || "").trim();

      if (!businessName || !cleanEmail || !cleanPassword) {
        return new Response(
          JSON.stringify({ message: "বিজনেস নেম, ইমেইল এবং পাসওয়ার্ড আবশ্যক।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      if (!env.DB) {
        return new Response(
          JSON.stringify({ message: "D1 Database binding (DB) পাওয়া যায়নি। রি-ডিপ্লয় করুন।" }),
          { status: 500, headers: jsonHeaders }
        );
      }

      // Duplicate Check across username and email
      const existingUser = await env.DB.prepare(
        "SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?"
      )
        .bind(cleanEmail, cleanEmail)
        .first();

      if (existingUser) {
        return new Response(
          JSON.stringify({ message: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা রয়েছে।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const userId = crypto.randomUUID();
      const clientId = crypto.randomUUID();
      const hashedPassword = await hashPassword(cleanPassword);
      const createdAt = new Date().toISOString();

      // Save Client Info
      await env.DB.prepare(
        "INSERT INTO clients (id, business_name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(clientId, businessName.trim(), cleanEmail, phone ? phone.trim() : "", createdAt)
        .run();

      // Save User Credentials (storing email in both username & email columns)
      await env.DB.prepare(
        "INSERT INTO users (id, username, email, password, role, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, cleanEmail, cleanEmail, hashedPassword, "CLIENT", clientId, createdAt)
        .run();

      return new Response(
        JSON.stringify({ success: true, message: "ক্লায়েন্ট সফলভাবে তৈরি হয়েছে।" }),
        { status: 201, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ message: "Route Not Found" }),
      { status: 404, headers: jsonHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: `Server Error: ${err.message || err.toString()}` }),
      { status: 500, headers: jsonHeaders }
    );
  }
};
