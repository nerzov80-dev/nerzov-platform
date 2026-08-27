import { useEffect, useState } from "react";
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

interface Client {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  createdAt?: string;
}

interface AdminClientsPageProps {
  auth: StoredAuth;
  onLogout: () => void;
  onNavigate: (to: string) => void;
}

export default function AdminClientsPage({
  auth,
  onLogout,
  onNavigate,
}: AdminClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.message || "ক্লায়েন্ট তালিকা আনা সম্ভব হয়নি।");
      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          businessName,
          email,
          phone,
          password,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.message || "ক্লায়েন্ট তৈরি করতে সমস্যা হয়েছে।");

      setBusinessName("");
      setEmail("");
      setPhone("");
      setPassword("");
      fetchClients();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-gray-800">অ্যাডমিন প্যানেল</h1>
          <button
            onClick={() => onNavigate("/admin/dashboard")}
            className="text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            ড্যাশবোর্ড
          </button>
          <button
            onClick={() => onNavigate("/admin/clients")}
            className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-1"
          >
            ক্লায়েন্ট তালিকা
          </button>
        </div>
        <button
          onClick={onLogout}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          লগআউট
        </button>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            নতুন ক্লায়েন্ট যোগ করুন
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateClient} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                বিজনেস নেম
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ব্যবসার নাম"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ইমেইল (লগইন আইডি)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ফোন নম্বর
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01700000000"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                লগইন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "তৈরি হচ্ছে..." : "ক্লায়েন্ট তৈরি করুন"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">ক্লায়েন্ট তালিকা</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">লোড হচ্ছে...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          ) : clients.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              কোনো ক্লায়েন্ট পাওয়া যায়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3">ব্যবসার নাম</th>
                    <th className="px-6 py-3">ইমেইল</th>
                    <th className="px-6 py-3">ফোন নম্বর</th>
                    <th className="px-6 py-3">তৈরির তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.businessName}</td>
                      <td className="px-6 py-4">{c.email}</td>
                      <td className="px-6 py-4">{c.phone}</td>
                      <td className="px-6 py-4">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
