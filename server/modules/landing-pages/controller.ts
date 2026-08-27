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

const allowedTemplates = new Set([
  "template1",
  "template2",
  "template3",
  "template4",
  "template5",
]);

function validSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function createLandingPage(
  request: Request,
  db: D1Database,
): Promise<Response> {
  const body = await request.json() as {
    clientId?: string;
    template?: string;
    slug?: string;
  };

  const clientId =
    body.clientId?.trim() || "";
  const template =
    body.template?.trim() || "";
  const slug =
    body.slug?.trim().toLowerCase() || "";

  if (!clientId || !template || !slug) {
    return json(
      {
        error:
          "Client, template and slug are required.",
      },
      400,
    );
  }

  if (!allowedTemplates.has(template)) {
    return json(
      { error: "Invalid Landing Page template." },
      400,
    );
  }

  if (!validSlug(slug)) {
    return json(
      {
        error:
          "Slug may contain lowercase letters, numbers and hyphens only.",
      },
      400,
    );
  }

  const client = await db
    .prepare(
      "SELECT id FROM clients WHERE id = ?",
    )
    .bind(clientId)
    .first();

  if (!client) {
    return json(
      { error: "Client not found." },
      404,
    );
  }

  const existing = await db
    .prepare(
      "SELECT id FROM landing_pages WHERE slug = ?",
    )
    .bind(slug)
    .first();

  if (existing) {
    return json(
      { error: "Slug is already in use." },
      409,
    );
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `
      INSERT INTO landing_pages (
        id,
        client_id,
        template,
        slug,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
      `,
    )
    .bind(
      id,
      clientId,
      template,
      slug,
    )
    .run();

  const landingPage = await db
    .prepare(
      `
      SELECT
        id,
        client_id AS clientId,
        template,
        slug,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM landing_pages
      WHERE id = ?
      `,
    )
    .bind(id)
    .first();

  return json(
    { landingPage },
    201,
  );
}

export async function listClientLandingPages(
  db: D1Database,
  clientId: string,
): Promise<Response> {
  const result = await db
    .prepare(
      `
      SELECT
        id,
        client_id AS clientId,
        template,
        slug,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM landing_pages
      WHERE client_id = ?
      ORDER BY created_at DESC
      `,
    )
    .bind(clientId)
    .all();

  return json({
    landingPages: result.results,
  });
}
