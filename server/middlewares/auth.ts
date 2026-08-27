import { verifyJwt } from "../modules/auth/jwt";

export interface AuthEnv {
  JWT_SECRET?: string;
}

export interface AuthUser {
  sub: string;
  username: string;
  role: "admin" | "client";
  clientId: string | null;
}

export async function authenticate(
  request: Request,
  env: AuthEnv,
): Promise<AuthUser | null> {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);

  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const payload = await verifyJwt(
    token,
    env.JWT_SECRET,
  );

  if (!payload) return null;

  return {
    sub: payload.sub,
    username: payload.username,
    role: payload.role,
    clientId: payload.clientId,
  };
}

export async function requireAdmin(
  request: Request,
  env: AuthEnv,
): Promise<AuthUser> {
  const user = await authenticate(request, env);

  if (!user || user.role !== "admin") {
    throw new Response(
      JSON.stringify({
        error: "Admin authentication required.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return user;
}

export async function requireClient(
  request: Request,
  env: AuthEnv,
): Promise<AuthUser> {
  const user = await authenticate(request, env);

  if (!user || user.role !== "client") {
    throw new Response(
      JSON.stringify({
        error: "Client authentication required.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return user;
}
