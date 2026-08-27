import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  title?: string;
}

export default function AdminLayout({
  children,
  onLogout,
  onNavigate,
  title = "Admin Dashboard",
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-primary text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => onNavigate("/admin/dashboard")}
            className="text-lg font-semibold"
          >
            Nerzov
          </button>

          <nav className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => onNavigate("/admin/dashboard")}
              className="hover:opacity-80"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/admin/clients")}
              className="hover:opacity-80"
            >
              Clients
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-white/20 px-3 py-1.5 hover:bg-white/10"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
