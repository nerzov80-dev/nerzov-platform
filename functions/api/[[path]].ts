interface Env {
  DB: D1Database;
}

// Password Hashing Helper (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS Preflight
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
      const identifier = body.email || body.username;
      const password = body.password;
      const reqRole = body.role;

      if (!identifier || !password) {
        return new Response(
          JSON.stringify({ message: "ইমেইল/ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const hashedPassword = await hashPassword(password);

      // Verify User from DB using username (which holds email)
      const user = (await env.DB.prepare(
        "SELECT * FROM users WHERE username = ? AND password = ?"
      )
        .bind(identifier, hashedPassword)
        .first()) as any;

      if (!user) {
        return new Response(
          JSON.stringify({ message: "ইমেইল/ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।" }),
          { status: 401, headers: jsonHeaders }
        );
      }

      if (reqRole && user.role !== reqRole) {
        return new Response(
          JSON.stringify({ message: "আপনার রোল (Role) এই পোর্টালে প্রবেশের জন্য অনুমোদিত নয়।" }),
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
    // 2. GET ALL CLIENTS (Admin Panel)
    // -------------------------------------------------------------
    if (url.pathname === "/api/admin/clients" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, business_name as businessName, email, phone, created_at as createdAt FROM clients ORDER BY created_at DESC"
      ).all();

      return new Response(
        JSON.stringify({ clients: results || [] }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // -------------------------------------------------------------
    // 3. CREATE NEW CLIENT & USER (Admin Panel)
    // -------------------------------------------------------------
    if (url.pathname === "/api/admin/clients" && request.method === "POST") {
      const body = (await request.json()) as any;
      const { businessName, email, phone, password } = body;

      if (!businessName || !email || !password) {
        return new Response(
          JSON.stringify({ message: "বিজনেস নেম, ইমেইল এবং পাসওয়ার্ড আবশ্যক।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Check duplicate user
      const existingUser = await env.DB.prepare(
        "SELECT id FROM users WHERE username = ?"
      )
        .bind(email)
        .first();

      if (existingUser) {
        return new Response(
          JSON.stringify({ message: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা রয়েছে।" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const userId = crypto.randomUUID();
      const clientId = crypto.randomUUID();
      const hashedPassword = await hashPassword(password);
      const createdAt = new Date().toISOString();

      // 1. Save profile into clients table
      await env.DB.prepare(
        "INSERT INTO clients (id, business_name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(clientId, businessName, email, phone || "", createdAt)
        .run();

      // 2. Save login details into users table (username holds email)
      await env.DB.prepare(
        "INSERT INTO users (id, username, password, role, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, email, hashedPassword, "CLIENT", clientId, createdAt)
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
      JSON.stringify({ message: err.message || "Internal Server Error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
};
