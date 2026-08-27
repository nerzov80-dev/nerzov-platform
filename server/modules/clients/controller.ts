import {
  createClient,
} from "./service";

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

export async function listClients(
  db: D1Database,
): Promise<Response> {
  const result = await db
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
      ORDER BY created_at DESC
      `,
    )
    .all();

  return json({
    clients: result.results,
  });
}

export async function handleCreateClient(
  request: Request,
  db: D1Database,
): Promise<Response> {
  const body = await request.json() as {
    businessName?: string;
    phone?: string;
    email?: string;
  };

  const businessName =
    body.businessName?.trim() || "";
  const phone =
    body.phone?.trim() || "";

  if (!businessName || !phone) {
    return json(
      {
        error:
          "Business name and phone are required.",
      },
      400,
    );
  }

  const result = await createClient(
    db,
    {
      businessName,
      phone,
      email: body.email,
    },
  );

  return json(result, 201);
}

export async function handleUpdateClient(
  request: Request,
  db: D1Database,
  clientId: string,
): Promise<Response> {
  const body = await request.json() as {
    businessName?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  };

  if (
    !body.businessName?.trim() ||
    !body.phone?.trim()
  ) {
    return json(
      {
        error:
          "Business name and phone are required.",
      },
      400,
    );
  }

  const result = await db
    .prepare(
      `
      UPDATE clients
      SET
        business_name = ?,
        phone = ?,
        email = ?,
        is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
    )
    .bind(
      body.businessName.trim(),
      body.phone.trim(),
      body.email?.trim() || null,
      body.isActive === false ? 0 : 1,
      clientId,
    )
    .run();

  if (!result.success || result.meta.changes === 0) {
    return json(
      { error: "Client not found." },
      404,
    );
  }

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

  return json({ client });
}

export async function getClientDashboard(
  db: D1Database,
  clientId: string,
): Promise<Response> {
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

  if (!client) {
    return json(
      { error: "Client not found." },
      404,
    );
  }

  const landingPages = await db
    .prepare(
      `
      SELECT
        id,
        template,
        slug,
        status,
        created_at AS createdAt
      FROM landing_pages
      WHERE client_id = ?
      ORDER BY created_at DESC
      `,
    )
    .bind(clientId)
    .all();

  return json({
    client,
    landingPages: landingPages.results,
  });
  }
