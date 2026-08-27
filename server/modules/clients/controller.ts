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
    return new Response(
      JSON.stringify({
        error: "Client not found.",
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      },
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

  return new Response(
    JSON.stringify({
      client,
      landingPages: landingPages.results,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
