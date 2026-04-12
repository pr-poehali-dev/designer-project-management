import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

type Tab = "info" | "notes" | "projects" | "documents" | "chats";

interface ClientData {
  id: number; name: string; contact_person: string; phone: string; email: string;
  legal_form: string; company_name: string; inn: string; ogrn: string; kpp: string;
  legal_address: string; bank_name: string; bik: string; checking_account: string;
  corr_account: string; status: string; notes: string;
}

interface Note { id: number; text: string; created_at: string; }
interface Project { id: number; name: string; status: string; deadline: string; }
interface Doc { id: number; name: string; doc_type: string; created_at: string; }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "info", label: "Данные", icon: "User" },
  { id: "notes", label: "Заметки", icon: "StickyNote" },
  { id: "projects", label: "Проекты", icon: "FolderKanban" },
  { id: "documents", label: "Документы", icon: "FileText" },
  { id: "chats", label: "Чаты", icon: "MessageSquare" },
];

const LEGAL_FORMS = [
  { id: "individual", label: "Физлицо" },
  { id: "self_employed", label: "Самозанятый" },
  { id: "ip", label: "ИП" },
  { id: "ooo", label: "ООО" },
];

const statusOptions = [
  { id: "new", label: "Новый" },
  { id: "active", label: "Активный" },
  { id: "vip", label: "VIP" },
  { id: "inactive", label: "Неактивный" },
];

export default function ClientCard({ clientId, onBack, onOpenProject }: {
  clientId: number;
  onBack: () => void;
  onOpenProject?: (id: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [client, setClient] = useState<ClientData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=clients&id=${clientId}`);
      const data = await r.json();
      if (data.ok) {
        setClient(data.client);
        setSaved(JSON.stringify(data.client));
        setProjects(data.projects || []);
        setNotes(data.notes || []);
        setDocs(data.documents || []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!client || saving) return;
    setSaving(true);
    setStatus("idle");
    try {
      const r = await fetch(`${API}?action=clients&id=${clientId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      const data = await r.json();
      if (data.ok) {
        setSaved(JSON.stringify(client));
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else { setStatus("error"); }
    } catch { /* ignore */ setStatus("error"); } finally { setSaving(false); }
  };

  const addNote = async () => {
    if (!newNote.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const r = await fetch(`${API}?action=notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, text: newNote.trim() }),
      });
      const data = await r.json();
      if (data.ok) {
        setNewNote("");
        load();
      }
    } catch { /* ignore */ } finally { setAddingNote(false); }
  };

  const createProject = async () => {
    try {
      const r = await fetch(`${API}?action=projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Проект для ${client?.name || "клиента"}`, client_id: clientId, status: "draft" }),
      });
      const data = await r.json();
      if (data.ok && onOpenProject) {
        onOpenProject(data.id);
      } else {
        load();
      }
    } catch { /* ignore */ }
  };

  const set = (field: string, value: string) => {
    setClient(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const hasChanges = client && JSON.stringify(client) !== saved;
  const isOrg = client?.legal_form === "ip" || client?.legal_form === "ooo";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-ink-faint">Клиент не найден</p>
        <button onClick={onBack} className="text-sm text-ink font-medium hover:underline mt-2">Назад</button>
      </div>
    );
  }

  const initials = client.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors">
          <Icon name="ArrowLeft" size={16} />
        </button>
        <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center">
          <span className="text-white font-bold">{initials}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{client.name}</h2>
          <p className="text-xs text-ink-faint">{client.contact_person || client.email || "—"}</p>
        </div>
        <button onClick={createProject}
          className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="Plus" size={14} /> Создать проект
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs rounded-full transition-all font-medium flex items-center gap-1.5 ${tab === t.id ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-6">
          <div className="card-surface rounded-2xl p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Icon name="Contact" size={16} className="text-ink-muted" /> Контактные данные
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Имя / Название" value={client.name} onChange={v => set("name", v)} />
              <Field label="Контактное лицо" value={client.contact_person} onChange={v => set("contact_person", v)} />
              <Field label="Телефон" value={client.phone} onChange={v => set("phone", v)} placeholder="+7 (999) 123-45-67" />
              <Field label="Email" value={client.email} onChange={v => set("email", v)} placeholder="client@email.com" />
              <div>
                <label className="text-xs text-ink-muted font-medium mb-1.5 block">Статус</label>
                <select value={client.status} onChange={e => set("status", e.target.value)}
                  className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
                  {statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Icon name="Building2" size={16} className="text-ink-muted" /> Юридические данные
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {LEGAL_FORMS.map(f => (
                <button key={f.id} onClick={() => set("legal_form", f.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all ${client.legal_form === f.id ? "border-ink bg-ink/[0.03]" : "border-snow-dark hover:border-ink-faint"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isOrg && <Field label="Название организации" value={client.company_name} onChange={v => set("company_name", v)} />}
              <Field label="ИНН" value={client.inn} onChange={v => set("inn", v)} />
              {isOrg && <Field label={client.legal_form === "ooo" ? "ОГРН" : "ОГРНИП"} value={client.ogrn} onChange={v => set("ogrn", v)} />}
              {client.legal_form === "ooo" && <Field label="КПП" value={client.kpp} onChange={v => set("kpp", v)} />}
              <Field label="Юридический адрес" value={client.legal_address} onChange={v => set("legal_address", v)} full />
            </div>
          </div>

          {isOrg && (
            <div className="card-surface rounded-2xl p-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Icon name="Landmark" size={16} className="text-ink-muted" /> Банковские реквизиты
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Банк" value={client.bank_name} onChange={v => set("bank_name", v)} />
                <Field label="БИК" value={client.bik} onChange={v => set("bik", v)} />
                <Field label="Расчётный счёт" value={client.checking_account} onChange={v => set("checking_account", v)} />
                <Field label="Корр. счёт" value={client.corr_account} onChange={v => set("corr_account", v)} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              {status === "saved" && <span className="flex items-center gap-1 text-xs text-green-600"><Icon name="Check" size={14} /> Сохранено</span>}
              {status === "error" && <span className="flex items-center gap-1 text-xs text-red-500"><Icon name="AlertCircle" size={14} /> Ошибка</span>}
            </div>
            <button onClick={save} disabled={saving || !hasChanges}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${hasChanges ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={16} />}
              {saving ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          <div className="card-surface rounded-2xl p-5 flex gap-3">
            <input value={newNote} onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNote()}
              placeholder="Добавить заметку..."
              className="flex-1 bg-snow border border-snow-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <button onClick={addNote} disabled={addingNote || !newNote.trim()}
              className="px-5 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
              Добавить
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="StickyNote" size={28} className="text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-faint">Заметок пока нет</p>
            </div>
          ) : notes.map(n => (
            <div key={n.id} className="card-surface rounded-xl p-4">
              <p className="text-sm">{n.text}</p>
              <p className="text-[10px] text-ink-faint mt-2">{new Date(n.created_at).toLocaleString("ru")}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-4">
          <button onClick={createProject}
            className="card-surface rounded-xl p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-3 border-2 border-dashed border-snow-dark hover:border-ink-faint">
            <Icon name="Plus" size={18} className="text-ink-faint" />
            <span className="text-sm text-ink-muted font-medium">Создать новый проект</span>
          </button>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="FolderKanban" size={28} className="text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-faint">Проектов пока нет</p>
            </div>
          ) : projects.map(p => (
            <button key={p.id} onClick={() => onOpenProject?.(p.id)}
              className="card-surface rounded-xl p-5 w-full text-left hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-ink-faint mt-1">
                    {p.status === "draft" ? "Черновик" : p.status === "active" ? "В работе" : p.status === "done" ? "Завершён" : p.status}
                    {p.deadline && ` • до ${new Date(p.deadline).toLocaleDateString("ru")}`}
                  </p>
                </div>
                <Icon name="ArrowRight" size={16} className="text-ink-faint" />
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-4">
          {docs.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="FileText" size={28} className="text-ink-faint mx-auto mb-2" />
              <p className="text-sm text-ink-faint">Документов пока нет</p>
              <p className="text-xs text-ink-faint mt-1">Документы появятся при создании в проектах</p>
            </div>
          ) : docs.map(d => (
            <div key={d.id} className="card-surface rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-snow flex items-center justify-center">
                <Icon name="FileText" size={16} className="text-ink-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-[10px] text-ink-faint">{d.doc_type} • {new Date(d.created_at).toLocaleDateString("ru")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "chats" && (
        <div className="text-center py-12">
          <Icon name="MessageSquare" size={28} className="text-ink-faint mx-auto mb-2" />
          <p className="text-sm text-ink-faint">Чаты с клиентом</p>
          <p className="text-xs text-ink-faint mt-1">Привяжется автоматически из Авито</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-xs text-ink-muted font-medium mb-1.5 block">{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
        className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all" />
    </div>
  );
}
