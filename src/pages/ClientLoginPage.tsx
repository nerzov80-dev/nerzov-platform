import { useState } from "react";
import { ROLES } from "../../shared/constants";
import type { UserRole } from "../../shared/constants";

interface StoredAuth {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
    clientId: string | null;
  };
}

interface ClientLoginPageProps {
  onLogin: (auth: StoredAuth) => void;
  onNavigate?: (to: string) => void;
}

export default function ClientLoginPage({
  onLogin,
  onNavigate,
}: ClientLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: email,
          password,
          role: ROLES.CLIENT,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new Error(
          data?.message || "লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড পরীক্ষা করুন।"
        );
      }

      onLogin(data as StoredAuth);
    } catch (err: any) {
      setError(err.message || "সার্ভারে যোগাযোগ করতে সমস্যা হচ্ছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            ক্লায়েন্ট পোর্টাল
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ইমেইল এড্রেস
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                পাসওয়ার্ড
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </div>
        </form>

        {onNavigate && (
          <div className="text-center pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onNavigate("/admin/login")}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← অ্যাডমিন লগইন পেজে যেতে এখানে ক্লিক করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
