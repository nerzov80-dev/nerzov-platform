import type { UserRole } from "../../shared/constants";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
    clientId: string | null;
  };
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed.");
  }

  return data;
}
