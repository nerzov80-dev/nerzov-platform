import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../shared/types/client";
import type { CreateLandingPageInput } from "../../shared/types/landing-page";

async function request<T>(
  token: string,
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function getClients(
  token: string,
): Promise<Client[]> {
  const data = await request<{ clients: Client[] }>(
    token,
    "/api/admin/clients",
  );

  return data.clients;
}

export async function createClient(
  token: string,
  input: CreateClientInput,
) {
  return request<{
    client: Client;
    credentials: {
      username: string;
      password: string;
    };
  }>(token, "/api/admin/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateClient(
  token: string,
  id: string,
  input: UpdateClientInput,
) {
  return request<{ client: Client }>(
    token,
    `/api/admin/clients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function createLandingPage(
  token: string,
  input: CreateLandingPageInput,
) {
  return request(
    token,
    "/api/admin/landing-pages",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
