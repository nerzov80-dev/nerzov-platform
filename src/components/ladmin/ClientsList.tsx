import type { Client } from "../../../shared/types/client";

interface ClientsListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onCreateLandingPage: (client: Client) => void;
}

export default function ClientsList({
  clients,
  onEdit,
  onCreateLandingPage,
}: ClientsListProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-6 text-muted">
        No clients found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Business
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-3 text-sm">
                  {client.businessName}
                </td>
                <td className="px-4 py-3 text-sm">
                  {client.phone}
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {client.email || "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      client.isActive
                        ? "rounded-md bg-success px-2 py-1 text-xs text-white"
                        : "rounded-md bg-danger px-2 py-1 text-xs text-white"
                    }
                  >
                    {client.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(client)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onCreateLandingPage(client)}
                      className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
                    >
                      Landing Page
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
