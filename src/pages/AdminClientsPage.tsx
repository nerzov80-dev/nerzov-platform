import { FormEvent, useEffect, useState } from "react";
import AdminLayout from "../components/layouts/AdminLayout";
import ClientsList from "../components/admin/ClientsList";
import {
  createClient,
  createLandingPage,
  getClients,
  updateClient,
} from "../services/adminApi";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../shared/types/client";
import {
  LANDING_PAGE_TEMPLATES,
  type LandingPageTemplate,
} from "../../shared/constants";

interface Props {
  auth: {
    token: string;
  };
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const emptyForm: CreateClientInput = {
  businessName: "",
  phone: "",
  email: "",
};

export default function AdminClientsPage({
  auth,
  onLogout,
  onNavigate,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<CreateClientInput>(emptyForm);
  const [editing, setEditing] = useState<Client | null>(null);
  const [template, setTemplate] =
    useState<LandingPageTemplate>("template1");
  const [slug, setSlug] = useState("");
  const [landingClient, setLandingClient] =
    useState<Client | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setClients(await getClients(auth.token));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load clients.",
      );
    }
  };

  useEffect(() => {
    load();
  }, [auth.token]);

  const submitClient = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (editing) {
        const input: UpdateClientInput = {
          businessName: form.businessName,
          phone: form.phone,
          email: form.email,
          isActive: editing.isActive,
        };

        await updateClient(auth.token, editing.id, input);
        setMessage("Client updated successfully.");
      } else {
        const result = await createClient(auth.token, form);
        setMessage(
          `Client created. Username: ${result.credentials.username} | Password: ${result.credentials.password}`,
        );
      }

      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save client.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLandingPage = async (event: FormEvent) => {
    event.preventDefault();

    if (!landingClient) return;

    setError("");
    setMessage("");
    setBusy(true);

    try {
      await createLandingPage(auth.token, {
        clientId: landingClient.id,
        template,
        slug,
      });

      setMessage("Draft Landing Page created successfully.");
      setLandingClient(null);
      setSlug("");
      setTemplate("template1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Landing Page.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout
      title="Client Management"
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-md border border-border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit Client" : "Create Client"}
          </h2>

          <form
            onSubmit={submitClient}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Business Name
              </label>
              <input
                value={form.businessName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    businessName: e.target.value,
                  })
                }
                required
                className="w-full rounded-md border border-border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                required
                className="w-full rounded-md border border-border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-md border border-border px-3 py-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
              >
                {editing ? "Update" : "Create"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-md border border-border px-4 py-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          {message && (
            <div className="mb-4 rounded-md bg-success px-4 py-3 text-white">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-danger px-4 py-3 text-white">
              {error}
            </div>
          )}

          <ClientsList
            clients={clients}
            onEdit={(client: Client) => {
              setEditing(client);
              setForm({
                businessName: client.businessName,
                phone: client.phone,
                email: client.email || "",
              });
            }}
            onCreateLandingPage={(client: Client) => {
              setLandingClient(client);
              setSlug(
                `${client.businessName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")}-landing`,
              );
            }}
          />
        </section>
      </div>

      {landingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-md bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Create Landing Page
            </h2>

            <p className="mt-1 text-sm text-muted">
              {landingClient.businessName}
            </p>

            <form
              onSubmit={submitLandingPage}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) =>
                    setTemplate(
                      e.target.value as LandingPageTemplate,
                    )
                  }
                  className="w-full rounded-md border border-border px-3 py-2"
                >
                  {LANDING_PAGE_TEMPLATES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Slug
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className="w-full rounded-md border border-border px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLandingClient(null)}
                  className="rounded-md border border-border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-accent px-4 py-2 text-white disabled:opacity-50"
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
