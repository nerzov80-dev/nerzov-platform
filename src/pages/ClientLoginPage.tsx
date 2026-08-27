import { FormEvent, useState } from "react";
import { login } from "../services/authApi";
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

export default function ClientLoginPage({ onLogin, onNavigate }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await login(username, password);

      if (result.user.role !== "client") {
        throw new Error("Please use the client login.");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-md border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Client Login</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to your Nerzov dashboard.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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
              className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-accent"
              autoComplete="current-password"
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
            {busy ? "Please wait..." : "Login"}
          </button>
        </form>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("/admin/login")}
            className="mt-4 block w-full text-center text-sm text-muted hover:underline"
          >
            ← Admin Login
          </button>
        )}
      </div>
    </div>
  );
}
