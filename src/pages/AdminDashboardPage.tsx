import AdminLayout from "../components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import { getClients } from "../services/adminApi";
import type { Client } from "../../shared/types/client";

interface Props {
  auth: {
    token: string;
  };
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export default function AdminDashboardPage({
  auth,
  onLogout,
  onNavigate,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getClients(auth.token)
      .then(setClients)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load clients.",
        ),
      );
  }, [auth.token]);

  return (
    <AdminLayout
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted">Clients</p>
          <p className="mt-2 text-3xl font-semibold">
            {clients.length}
          </p>
        </div>

        <div className="rounded-md border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted">Platform</p>
          <p className="mt-2 text-lg font-semibold">
            Foundation
          </p>
        </div>

        <div className="rounded-md border border-border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted">Step</p>
          <p className="mt-2 text-lg font-semibold">
            1 / 3
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-danger px-4 py-3 text-white">
          {error}
        </div>
      )}

      <div className="mt-8 rounded-md border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">
          Foundation Dashboard
        </h2>
        <p className="mt-2 text-sm text-muted">
          Client management and Landing Page structure are ready.
        </p>
      </div>
    </AdminLayout>
  );
}
