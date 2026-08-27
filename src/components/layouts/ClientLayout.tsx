import type { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function ClientLayout({
  children,
  onLogout,
}: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-border bg-primary text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold">Nerzov</div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
