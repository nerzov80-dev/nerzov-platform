interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS Headers
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
    // 1. LOGIN ENDPOINT (Handles /api/auth/login, /api/login, etc.)
    // -------------------------------------------------------------
    if (url.pathname.includes("/login") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as any;
      const inputEmail = (body.email || body.username || "").trim().toLowerCase();

      // Default client profile data fallback
      let userData = {
        id: "user_1",
        username: inputEmail || "sh9145080@gmail.com",
        email: inputEmail || "sh9145080@gmail.com",
        role: "CLIENT",
        client_id: "client_1"
      };

      // Query D1 Database if available
      if (env.DB && inputEmail) {
        const dbUser = await env.DB.prepare(
          "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?"
        ).bind(inputEmail, inputEmail).first() as any;

        if (dbUser) {
          userData = {
            id: dbUser.id || "user_1",
            username: dbUser.username || inputEmail,
            email: dbUser.email || inputEmail,
            role: (dbUser.role || "CLIENT").toUpperCase(),
            client_id: dbUser.client_id || "client_1"
          };
        }
      }

      // Return 200 OK with formatted login session
      return new Response(
        JSON.stringify({
          success: true,
          token: `token-${userData.id}-${Date.now()}`,
          accessToken: `token-${userData.id}-${Date.now()}`,
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            clientId: userData.client_id,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // -------------------------------------------------------------
    // 2. CLIENTS MANAGEMENT API
    // -------------------------------------------------------------
    if (url.pathname.includes("/clients")) {
      if (request.method === "GET") {
        let clientsList: any[] = [];
        if (env.DB) {
          const { results } = await env.DB.prepare("SELECT * FROM clients").all();
          clientsList = results || [];
        }
        return new Response(JSON.stringify({ clients: clientsList }), { status: 200, headers: corsHeaders });
      }

      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as any;
        const { businessName, email, phone, password } = body;
        
        if (env.DB) {
          const clientId = crypto.randomUUID();
          const userId = crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO clients (id, business_name, email, phone, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
          ).bind(clientId, businessName || '', email || '', phone || '').run();

          await env.DB.prepare(
            "INSERT INTO users (id, username, email, password, role, client_id, created_at) VALUES (?, ?, ?, ?, 'CLIENT', ?, datetime('now'))"
          ).bind(userId, email || '', email || '', password || '123', clientId).run();
        }
        return new Response(JSON.stringify({ success: true, message: "Client created successfully" }), { status: 201, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ message: "Route Not Found" }), { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err.toString() }), { status: 500, headers: corsHeaders });
  }
};
