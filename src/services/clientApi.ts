import type { ClientDashboardData } from "../../shared/types/client";

export async function getClientDashboard(
  token: string,
): Promise<ClientDashboardData> {
  const response = await fetch("/api/client/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as ClientDashboardData & { error?: string };

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to load dashboard.",
    );
  }

  return data;
}
