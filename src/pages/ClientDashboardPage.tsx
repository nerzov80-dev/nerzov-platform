import { useEffect, useState } from "react";
import ClientLayout from "../components/layouts/ClientLayout";
import { getClientDashboard } from "../services/clientApi";
import type { ClientDashboardData } from "../../shared/types/client";

interface Props {
  auth: {
    token: string;
  };
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export default function ClientDashboardPage({
  auth,
  onLogout,
}: Props) {
  const [data, setData] =
    useState<ClientDashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getClientDashboard(auth.token)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard.",
        ),
      );
  }, [auth.token]);

  return (
    <ClientLayout onLogout={onLogout}>
      <h1 className="mb-2 text-2xl font-semibold">
        Client Dashboard
      </h1>

      <p className="mb-8 text-sm text-muted">
        Welcome back.
      </p>

      {error && (
        <div className="mb-6 rounded-md bg-danger px-4 py-3 text-white">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-border bg-background p-5 shadow-sm">
              <p className="text-sm text-muted">
                Business
              </p>
              <p className="mt-2 text-lg font-semibold">
                {data.client.businessName}
              </p>
            </div>

            <div className="rounded-md border border-border bg-background p-5 shadow-sm">
              <p className="text-sm text-muted">
                Landing Pages
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {data.landingPages.length}
              </p>
            </div>

            <div className="rounded-md border border-border bg-background p-5 shadow-sm">
              <p className="text-sm text-muted">
                Status
              </p>
              <p className="mt-2 text-lg font-semibold">
                {data.client.isActive
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-md border border-border bg-background shadow-sm">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold">
                Landing Pages
              </h2>
            </div>

            {data.landingPages.length === 0 ? (
              <p className="p-5 text-sm text-muted">
                No Landing Pages yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data.landingPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {page.slug}
                      </p>
                      <p className="text-sm text-muted">
                        {page.template}
                      </p>
                    </div>

                    <span className="w-fit rounded-md bg-surface px-3 py-1 text-sm">
                      {page.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </ClientLayout>
  );
}
