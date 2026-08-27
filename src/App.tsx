import { useEffect, useState } from "react";
import { AUTH_STORAGE_KEY, ROLES } from "../shared/constants";
import type { UserRole } from "../shared/constants";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminClientsPage from "./pages/AdminClientsPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";

interface StoredAuth {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
    clientId: string | null;
  };
}

function readAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(readAuth);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () =>
      window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
    navigate("/login");
  };

  const handleLogin = (nextAuth: StoredAuth) => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(nextAuth),
    );
    setAuth(nextAuth);

    if (nextAuth.user.role === ROLES.ADMIN) {
      navigate("/admin/dashboard");
    } else {
      navigate("/client/dashboard");
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-background">
        {path === "/client/login" ? (
          <ClientLoginPage onLogin={handleLogin} />
        ) : (
          <AdminLoginPage onLogin={handleLogin} />
        )}
      </div>
    );
  }

  if (auth.user.role === ROLES.ADMIN) {
    if (!path.startsWith("/admin")) {
      navigate("/admin/dashboard");
      return null;
    }

    if (path === "/admin/clients") {
      return (
        <AdminClientsPage
          auth={auth}
          onLogout={logout}
          onNavigate={navigate}
        />
      );
    }

    return (
      <AdminDashboardPage
        auth={auth}
        onLogout={logout}
        onNavigate={navigate}
      />
    );
  }

  if (auth.user.role === ROLES.CLIENT) {
    if (!path.startsWith("/client")) {
      navigate("/client/dashboard");
      return null;
    }

    return (
      <ClientDashboardPage
        auth={auth}
        onLogout={logout}
        onNavigate={navigate}
      />
    );
  }

  return null;
}
