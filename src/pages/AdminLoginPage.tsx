import { FormEvent, useState } from "react";
import { login, type LoginResponse } from "../services/authApi";
import type { UserRole } from "../../shared/constants";

interface Props {
  onLogin: (auth: {
    token: string;
    user: {
      id: string;
      username: string;
      role: UserRole;
      clientId: string | null;
    };
  }) => void;
  onNavigate?: (path: string) => void;
}

export default function AdminLoginPage({ onLogin, onNavigate }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await login(username, password);

      if (result.user.role !== "admin") {
        throw new Error("This account is not an admin account.");
      }

      onLogin(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login.",
      );
    } finally {
      setBusy(false);
    }
  };

  const setup = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Setup failed.");
      }

      onLogin(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Setup failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-md border border-border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Nerzov</h1>
          <p className="mt-1 text-sm text-muted">
            {setupMode ? "Create the first Admin account" : "Admin Login"}
          </p>
        </div>

        <form
          onSubmit={setupMode ? setup : submit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-accent"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-accent"
              autoComplete={
                setupMode ? "new-password" : "current-password"
              }
            />
          </div>

          {error && (
            <div className="rounded-md bg-danger px-3 py-2 text-sm text-white">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {busy
              ? "Please wait..."
              : setupMode
                ? "Create Admin"
                : "Login"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setSetupMode((value) => !value);
              setError("");
            }}
            className="text-left text-sm text-accent"
          >
            {setupMode
              ? "Already have an account? Login"
              : "First deployment? Create Admin"}
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("/client/login")}
              className="text-left text-sm text-muted hover:underline"
            >
              Are you a Client? Login here →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
