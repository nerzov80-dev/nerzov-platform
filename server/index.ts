import {
  requireAdmin,
  requireClient,
} from "./middlewares/auth";

import {
  getLandingPageSlug,
} from "./middlewares/domain-router";

import {
  login,
  setupAdmin,
} from "./modules/auth/controller";

import {
  listClients,
  handleCreateClient,
  handleUpdateClient,
  getClientDashboard,
} from "./modules/clients/controller";

import {
  createLandingPage,
} from "./modules/landing-pages/controller";

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  IMAGES_BUCKET: R2Bucket;
  ASSETS: Fetcher;
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

function withCors(
  response: Response,
): Response {
  const headers = new Headers(
    response.headers,
  );

  headers.set(
    "Access-Control-Allow-Origin",
    "*",
  );

  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );

  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return new Response(
    response.body,
    {
      status: response.status,
      statusText: response.statusText,
      headers,
    },
  );
}

async function handleApi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return withCors(
      new Response(null, { status: 204 }),
    );
  }

  if (
    path === "/api/auth/login" &&
    request.method === "POST"
  ) {
    return login(request, env);
  }

  if (
    path === "/api/auth/setup" &&
    request.method === "POST"
  ) {
    return setupAdmin(request, env);
  }

  if (
    path === "/api/admin/clients" &&
    request.method === "GET"
  ) {
    await requireAdmin(request, env);
    return listClients(env.DB);
  }

  if (
    path === "/api/admin/clients" &&
    request.method === "POST"
  ) {
    await requireAdmin(request, env);
    return handleCreateClient(
      request,
      env.DB,
    );
  }

  const clientMatch = path.match(
    /^\/api\/admin\/clients\/([^/]+)$/,
  );

  if (
    clientMatch &&
    request.method === "PUT"
  ) {
    await requireAdmin(request, env);

    return handleUpdateClient(
      request,
      env.DB,
      clientMatch[1],
    );
  }

  if (
    path === "/api/admin/landing-pages" &&
    request.method === "POST"
  ) {
    await requireAdmin(request, env);

    return createLandingPage(
      request,
      env.DB,
    );
  }

  if (
    path === "/api/client/dashboard" &&
    request.method === "GET"
  ) {
    const user =
      await requireClient(request, env);

    if (!user.clientId) {
      return json(
        { error: "Client account is not linked." },
        400,
      );
    }

    return getClientDashboard(
      env.DB,
      user.clientId,
    );
  }

  if (
    path === "/api/auth/me" &&
    request.method === "GET"
  ) {
    const user =
      await requireAdminOrClient(request, env);

    return json({ user });
  }

  return json(
    { error: "API route not found." },
    404,
  );
}

async function requireAdminOrClient(
  request: Request,
  env: Env,
) {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        error: "Authentication required.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const { authenticate } =
    await import("./middlewares/auth");

  const user = await authenticate(
    request,
    env,
  );

  if (!user) {
    throw new Response(
      JSON.stringify({
        error: "Invalid authentication.",
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

async function handlePublicLandingPage(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const slug = getLandingPageSlug(
    url.pathname,
  );

  if (!slug) return null;

  const cached =
    await env.CACHE_KV.get(
      `lp:html:${slug}`,
    );

  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control":
          "public, max-age=300",
      },
    });
  }

  const landingPage = await env.DB
    .prepare(
      `
      SELECT
        id,
        client_id,
        template,
        slug,
        status
      FROM landing_pages
      WHERE slug = ?
      LIMIT 1
      `,
    )
    .bind(slug)
    .first<{
      id: string;
      client_id: string;
      template: string;
      slug: string;
      status: string;
    }>();

  if (!landingPage) {
    return new Response(
      "Landing Page not found.",
      {
        status: 404,
      },
    );
  }

  if (landingPage.status !== "published") {
    return new Response(
      "Landing Page is not published.",
      {
        status: 404,
      },
    );
  }

  return new Response(
    "Landing Page content will be rendered and cached in Step 2.",
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
    },
  );
}

function isSpaRoute(
  pathname: string,
): boolean {
  return (
    pathname === "/login" ||
    pathname === "/client/login" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/client/")
  );
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        return withCors(
          await handleApi(request, env),
        );
      }

      if (url.pathname.startsWith("/lp/")) {
        const landingResponse =
          await handlePublicLandingPage(
            request,
            env,
          );

        if (landingResponse) {
          return landingResponse;
        }
      }

      if (isSpaRoute(url.pathname)) {
        return env.ASSETS.fetch(
          new Request(
            new URL("/", request.url),
            request,
          ),
        );
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      console.error(error);

      return json(
        {
          error: "Internal server error.",
        },
        500,
      );
    }
  },
};
