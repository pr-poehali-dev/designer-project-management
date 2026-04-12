import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface ProjectData {
  id: number; name: string; client_id: number | null; client_name: string;
  status: string; deadline: string; discount_percent: number;
}
interface WorkItem {
  id: number; name: string; quantity: number; unit: string; price: number; sort_order: number;
}
interface TeamMember { id: number; member_name: string; role: string; }
interface ClientShort { id: number; name: string; }

type Tab = "estimate" | "team" | "documents";

const STATUS_OPTIONS = [
  { id: "draft", label: "Черновик" },
  { id: "active", label: "В работе" },
  { id: "done", label: "Завершён" },
  { id: "paused", label: "Пауза" },
];

export default function ProjectCard({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("estimate");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<ClientShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProject, setSavedProject] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const [newItem, setNewItem] = useState({ name: "", quantity: "1", unit: "шт", price: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({ name: "", quantity: "", unit: "", price: "" });

  const [newMember, setNewMember] = useState({ member_name: "", role: "" });

  const load = useCallback(async () => {
    try {
      const [pr, cl] = await Promise.all([
        fetch(`${API}?action=projects&id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=clients_short`).then(r => r.json()),
      ]);
      if (pr.ok) {
        setProject(pr.project);
        setSavedProject(JSON.stringify(pr.project));
        setItems((pr.work_items || []).filter((i: WorkItem) => i.sort_order >= 0));
        setTeam(pr.team || []);
      }
      if (cl.ok) setClients(cl.clients || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const saveProject = async () => {
    if (!project || saving) return;
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${API}?action=projects&id=${projectId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const data = await r.json();
      if (data.ok) {
        setSavedProject(JSON.stringify(project));
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else { setStatus("error"); }
    } catch { /* ignore */ setStatus("error"); } finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      await fetch(`${API}?action=work_items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId, name: newItem.name,
          quantity: parseFloat(newItem.quantity) || 1,
          unit: newItem.unit || "шт",
          price: parseFloat(newItem.price) || 0,
        }),
      });
      setNewItem({ name: "", quantity: "1", unit: "шт", price: "0" });
      load();
    } catch { /* ignore */ }
  };

  const updateItem = async (id: number) => {
    try {
      await fetch(`${API}?action=work_items&id=${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItem.name,
          quantity: parseFloat(editItem.quantity) || 1,
          unit: editItem.unit,
          price: parseFloat(editItem.price) || 0,
        }),
      });
      setEditingId(null);
      load();
    } catch { /* ignore */ }
  };

  const removeItem = async (id: number) => {
    try {
      await fetch(`${API}?action=work_items&id=${id}&delete=true`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      load();
    } catch { /* ignore */ }
  };

  const addMember = async () => {
    if (!newMember.member_name.trim()) return;
    try {
      await fetch(`${API}?action=team`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...newMember }),
      });
      setNewMember({ member_name: "", role: "" });
      load();
    } catch { /* ignore */ }
  };

  const startEdit = (item: WorkItem) => {
    setEditingId(item.id);
    setEditItem({ name: item.name, quantity: String(item.quantity), unit: item.unit, price: String(item.price) });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /></div>;
  }
  if (!project) {
    return <div className="text-center py-20"><p className="text-sm text-ink-faint">Проект не найден</p>
      <button onClick={onBack} className="text-sm text-ink font-medium hover:underline mt-2">Назад</button></div>;
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = subtotal * (project.discount_percent || 0) / 100;
  const total = subtotal - discount;
  const hasProjectChanges = project && JSON.stringify(project) !== savedProject;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors">
          <Icon name="ArrowLeft" size={16} />
        </button>
        <div className="flex-1">
          <input value={project.name} onChange={e => setProject(p => p ? { ...p, name: e.target.value } : p)}
            className="text-lg font-semibold bg-transparent focus:outline-none focus:bg-snow rounded-lg px-2 py-1 -ml-2 w-full" />
          <p className="text-xs text-ink-faint ml-0.5">{project.client_name || "Клиент не выбран"}</p>
        </div>
      </div>

      <div className="card-surface rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">Клиент</label>
            <select value={project.client_id || ""} onChange={e => setProject(p => p ? { ...p, client_id: Number(e.target.value) || null } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              <option value="">Не выбран</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">Статус</label>
            <select value={project.status} onChange={e => setProject(p => p ? { ...p, status: e.target.value } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">Дедлайн</label>
            <input type="date" value={project.deadline || ""} onChange={e => setProject(p => p ? { ...p, deadline: e.target.value } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          </div>
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">Скидка, %</label>
            <input type="number" min={0} max={100} value={project.discount_percent || 0}
              onChange={e => setProject(p => p ? { ...p, discount_percent: Number(e.target.value) } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-snow-dark">
          <div>
            {status === "saved" && <span className="flex items-center gap-1 text-xs text-green-600"><Icon name="Check" size={14} /> Сохранено</span>}
            {status === "error" && <span className="flex items-center gap-1 text-xs text-red-500"><Icon name="AlertCircle" size={14} /> Ошибка</span>}
          </div>
          <button onClick={saveProject} disabled={saving || !hasProjectChanges}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${hasProjectChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
            Сохранить
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark w-fit">
        {([
          { id: "estimate" as Tab, label: "Смета", icon: "Calculator" },
          { id: "team" as Tab, label: "Команда", icon: "Users" },
          { id: "documents" as Tab, label: "Документы", icon: "FileText" },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs rounded-full transition-all font-medium flex items-center gap-1.5 ${tab === t.id ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "estimate" && (
        <div className="card-surface rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-snow-dark bg-snow/50">
                <th className="text-left px-4 py-3 text-xs text-ink-faint font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-xs text-ink-faint font-medium">Наименование</th>
                <th className="text-right px-4 py-3 text-xs text-ink-faint font-medium w-20">Кол-во</th>
                <th className="text-center px-4 py-3 text-xs text-ink-faint font-medium w-16">Ед.</th>
                <th className="text-right px-4 py-3 text-xs text-ink-faint font-medium w-28">Цена</th>
                <th className="text-right px-4 py-3 text-xs text-ink-faint font-medium w-28">Сумма</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-snow-dark">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-snow/30 transition-colors">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2 text-xs text-ink-faint">{i + 1}</td>
                      <td className="px-4 py-2">
                        <input value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={editItem.quantity} onChange={e => setEditItem(p => ({ ...p, quantity: e.target.value }))}
                          className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editItem.unit} onChange={e => setEditItem(p => ({ ...p, unit: e.target.value }))}
                          className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={editItem.price} onChange={e => setEditItem(p => ({ ...p, price: e.target.value }))}
                          className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none" />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium tabular-nums">
                        {((parseFloat(editItem.quantity) || 0) * (parseFloat(editItem.price) || 0)).toLocaleString("ru")} ₽
                      </td>
                      <td className="px-4 py-2 flex gap-1 justify-end">
                        <button onClick={() => updateItem(item.id)} className="text-green-600 hover:text-green-700"><Icon name="Check" size={15} /></button>
                        <button onClick={() => setEditingId(null)} className="text-ink-faint hover:text-ink"><Icon name="X" size={15} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs text-ink-faint">{i + 1}</td>
                      <td className="px-4 py-3 text-sm">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-center text-ink-faint">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{Number(item.price).toLocaleString("ru")} ₽</td>
                      <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">{(item.quantity * item.price).toLocaleString("ru")} ₽</td>
                      <td className="px-4 py-3 flex gap-1 justify-end">
                        <button onClick={() => startEdit(item)} className="text-ink-faint hover:text-ink"><Icon name="Pencil" size={13} /></button>
                        <button onClick={() => removeItem(item.id)} className="text-ink-faint hover:text-red-500"><Icon name="Trash2" size={13} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              <tr className="bg-snow/30">
                <td className="px-4 py-2 text-xs text-ink-faint">+</td>
                <td className="px-4 py-2">
                  <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addItem()}
                    placeholder="Новый вид работ..." className="w-full bg-transparent text-sm placeholder:text-ink-faint/50 focus:outline-none" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full bg-transparent text-sm text-right focus:outline-none" />
                </td>
                <td className="px-4 py-2">
                  <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-transparent text-sm text-center focus:outline-none" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                    className="w-full bg-transparent text-sm text-right focus:outline-none" />
                </td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2">
                  <button onClick={addItem} disabled={!newItem.name.trim()} className="text-ink-faint hover:text-ink disabled:opacity-30">
                    <Icon name="Plus" size={15} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="border-t border-snow-dark p-5 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-muted">Подитого:</span><span className="tabular-nums">{subtotal.toLocaleString("ru")} ₽</span></div>
            {project.discount_percent > 0 && (
              <div className="flex justify-between text-sm"><span className="text-ink-muted">Скидка {project.discount_percent}%:</span><span className="text-red-500 tabular-nums">−{discount.toLocaleString("ru")} ₽</span></div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-snow-dark"><span>Итого:</span><span className="tabular-nums">{total.toLocaleString("ru")} ₽</span></div>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-4">
          <div className="card-surface rounded-xl p-4 flex gap-3">
            <input value={newMember.member_name} onChange={e => setNewMember(p => ({ ...p, member_name: e.target.value }))}
              placeholder="Имя сотрудника" className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <input value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
              placeholder="Роль" className="w-40 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <button onClick={addMember} disabled={!newMember.member_name.trim()}
              className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
              Добавить
            </button>
          </div>
          {team.length === 0 ? (
            <div className="text-center py-12"><Icon name="Users" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Команда не назначена</p></div>
          ) : team.map(m => (
            <div key={m.id} className="card-surface rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">
                {m.member_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div><p className="text-sm font-medium">{m.member_name}</p><p className="text-xs text-ink-faint">{m.role}</p></div>
            </div>
          ))}
        </div>
      )}

      {tab === "documents" && (
        <div className="text-center py-12">
          <Icon name="FileText" size={28} className="text-ink-faint mx-auto mb-2" />
          <p className="text-sm text-ink-faint">Договоры, акты, КП, брифы</p>
          <p className="text-xs text-ink-faint mt-1">Генерация документов — в разработке</p>
        </div>
      )}
    </div>
  );
}
