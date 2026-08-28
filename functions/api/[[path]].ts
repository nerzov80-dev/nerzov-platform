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

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------
    // 1. AUTH LOGIN (Dynamic Support for ADMIN & CLIENT)
    // -------------------------------------------------------------
    if (url.pathname.includes("/login") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as any;
      const inputIdentifier = (body.email || body.username || "").trim().toLowerCase();
      const inputPassword = (body.password || "").trim();
      const requestedRole = (body.role || "").trim().toUpperCase();

      if (!inputIdentifier) {
        return new Response(
          JSON.stringify({ message: "ইমেইল বা ইউজারনেম দিন।" }),
          { status: 400, headers: corsHeaders }
        );
      }

      let userRole = requestedRole || "CLIENT";
      let userId = "user_" + Date.now();
      let clientId: string | null = null;
      let matchedUser: any = null;

      // Query D1 DB if available
      if (env.DB) {
        matchedUser = await env.DB.prepare(
          "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?"
        ).bind(inputIdentifier, inputIdentifier).first() as any;
      }

      if (matchedUser) {
        userRole = (matchedUser.role || userRole).toUpperCase();
        userId = matchedUser.id || userId;
        clientId = matchedUser.client_id || null;
      } else {
        // Fallback for Admin login if identifier has 'admin' or requestedRole is ADMIN
        if (inputIdentifier.includes("admin") || requestedRole === "ADMIN") {
          userRole = "ADMIN";
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          token: `token-${userId}-${Date.now()}`,
          accessToken: `token-${userId}-${Date.now()}`,
          user: {
            id: userId,
            username: inputIdentifier,
            email: inputIdentifier,
            role: userRole,
            clientId: clientId,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // -------------------------------------------------------------
    // 2. CLIENTS MANAGEMENT API (Admin Panel)
    // -------------------------------------------------------------
    if (url.pathname.includes("/clients")) {
      if (request.method === "GET") {
        let clientsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
          clientsList = results || [];
        }
        return new Response(JSON.stringify({ clients: clientsList }), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const { businessName, email, phone, password } = body;
        
        const cleanEmail = (email || "").trim().toLowerCase();
        const cleanPassword = (password || "123").trim();

        if (env.DB && cleanEmail) {
          const clientId = crypto.randomUUID();
          const userId = crypto.randomUUID();
          const hashedPassword = await hashPassword(cleanPassword);

          await env.DB.prepare(
            "INSERT INTO clients (id, business_name, email, phone, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
          ).bind(clientId, businessName || '', cleanEmail, phone || '').run();

          await env.DB.prepare(
            "INSERT INTO users (id, username, email, password, role, client_id, created_at) VALUES (?, ?, ?, ?, 'CLIENT', ?, datetime('now'))"
          ).bind(userId, cleanEmail, cleanEmail, hashedPassword, clientId).run();
        }
        return new Response(JSON.stringify({ success: true, message: "Client created successfully" }), { status: 201, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ message: "Route Not Found" }), { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err.toString() }), { status: 500, headers: corsHeaders });
  }
};
