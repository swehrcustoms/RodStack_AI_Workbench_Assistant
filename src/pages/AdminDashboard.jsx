import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import CreateClientForm from "./admin/CreateClientForm.jsx";
import ClientList from "./admin/ClientList.jsx";
import ClientDetails from "./admin/ClientDetails.jsx";

export default function AdminDashboard({ adminToken }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load clients");
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreated = (client) => {
    setClients((prev) => [client, ...prev]);
  };

  const handleUpdated = (client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    setSelectedClient(client);
  };

  if (selectedClient) {
    return (
      <ClientDetails
        clientId={selectedClient.id}
        adminToken={adminToken}
        onBack={() => setSelectedClient(null)}
        onUpdated={handleUpdated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b111e] to-[#0f172a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
              <Building2 className="text-cyan-400" size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">RodStack Admin</p>
              <h1 className="text-2xl font-bold">Multi-Tenant Portal Manager</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={loadClients}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <p className="mt-1 text-xs text-red-400/80">
              Ensure ADMIN_API_SECRET or admin JWT is configured and Supabase schema is migrated.
            </p>
          </div>
        )}

        <div className="space-y-8">
          <CreateClientForm onCreated={handleCreated} adminToken={adminToken} />
          <ClientList
            clients={clients}
            loading={loading}
            onSelect={setSelectedClient}
            adminToken={adminToken}
          />
        </div>
      </div>
    </div>
  );
}
