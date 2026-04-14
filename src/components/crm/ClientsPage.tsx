import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ClientCard from "./ClientCard";
import { getAuthHeaders } from "@/lib/designerAuth";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface Client {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: string;
  project_count: number;
  created_at: string;
}

const statusStyle: Record<string, string> = {
  vip: "bg-amber-50 text-amber-700",
  active: "bg-green-50 text-green-600",
  new: "bg-blue-50 text-blue-600",
  inactive: "bg-gray-100 text-ink-faint",
};
const statusLabel: Record<string, string> = {
  vip: "VIP", active: "Активный", new: "Новый", inactive: "Неактивный",
};

export default function ClientsPage({ onOpenProject }: { onOpenProject?: (id: number) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=clients`, { headers: { ...getAuthHeaders() } });
      const data = await r.json();
      if (data.ok) setClients(data.clients || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addClient = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      const r = await fetch(`${API}?action=clients`, {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: newName.trim(), status: "new" }),
      });
      const data = await r.json();
      if (data.ok) {
        setNewName("");
        setShowAdd(false);
        setSelectedId(data.id);
        await load();
      }
    } catch { /* ignore */ } finally { setAdding(false); }
  };

  if (selectedId) {
    return <ClientCard
      clientId={selectedId}
      onBack={() => { setSelectedId(null); load(); }}
      onOpenProject={onOpenProject}
    />;
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-snow-dark rounded-full px-4 py-2 w-64">
          <Icon name="Search" size={14} className="text-ink-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск клиентов..." className="bg-transparent text-sm placeholder:text-ink-faint focus:outline-none w-full" />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="UserPlus" size={14} /> Добавить
        </button>
      </div>

      {showAdd && (
        <div className="card-surface rounded-2xl p-5 flex items-center gap-3 animate-fade-in">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addClient()}
            placeholder="Имя клиента или название компании..."
            className="flex-1 bg-snow border border-snow-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" autoFocus />
          <button onClick={addClient} disabled={adding}
            className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors">
            {adding ? "..." : "Создать"}
          </button>
          <button onClick={() => setShowAdd(false)} className="text-ink-faint hover:text-ink transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="Users" size={32} className="text-ink-faint mx-auto mb-3" />
          <p className="text-sm text-ink-faint">{clients.length === 0 ? "Клиентов пока нет" : "Ничего не найдено"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className="card-surface rounded-2xl p-6 text-left hover:shadow-md transition-all">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-full bg-ink flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{initials(c.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[c.status] || statusStyle.new}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </div>
                  {c.contact_person && <p className="text-xs text-ink-muted mt-0.5">{c.contact_person}</p>}
                </div>
              </div>
              {c.email && <p className="text-xs text-ink-faint mb-4">{c.email}</p>}
              <div className="flex items-center justify-between pt-4 border-t border-snow-dark">
                <div>
                  <p className="font-display text-xl font-semibold">{c.project_count || 0}</p>
                  <p className="text-xs text-ink-faint">проектов</p>
                </div>
                <Icon name="ArrowRight" size={16} className="text-ink-faint" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}