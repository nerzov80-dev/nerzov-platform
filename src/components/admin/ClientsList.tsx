import type { Client } from "../../shared/types/client";

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
      <div className="rounded-md border border-border bg-background p-6 text-center text-muted">
        No clients found. Create your first client using the form.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-background shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-background text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Business Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="px-4 py-3 font-medium">{client.businessName}</td>
              <td className="px-4 py-3">{client.phone}</td>
              <td className="px-4 py-3">{client.email || "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                    client.isActive
                      ? "bg-success text-white"
                      : "bg-danger text-white"
                  }`}
                >
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(client)}
                  className="rounded border border-border px-2.5 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => onCreateLandingPage(client)}
                  className="rounded bg-accent px-2.5 py-1 text-xs text-white"
                >
                  + Landing Page
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
