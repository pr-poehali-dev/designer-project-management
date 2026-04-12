import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import EstimateTable from "./EstimateTable";
import ProjectChat from "./ProjectChat";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";
const PDF_API = "https://functions.poehali.dev/79538cf9-12ec-42f3-9e60-aaf7a9edfba2";

interface ProjectData {
  id: number; name: string; client_id: number | null; client_name: string;
  status: string; deadline: string; discount_percent: number;
  vat_mode: string; vat_rate: number;
}
interface Estimate {
  id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number;
}
interface TeamMember { id: number; member_name: string; role: string; }
interface ClientShort { id: number; name: string; }

type Tab = "estimates" | "team" | "documents";

const STATUS_OPTIONS = [
  { id: "draft", label: "Черновик" },
  { id: "active", label: "В работе" },
  { id: "done", label: "Завершён" },
  { id: "paused", label: "Пауза" },
];

const VAT_OPTIONS = [
  { id: "none", label: "Без НДС" },
  { id: "included", label: "НДС включён в стоимость" },
  { id: "added", label: "НДС сверх стоимости" },
];

export default function ProjectCard({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("estimates");
  const [showChat, setShowChat] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<ClientShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProject, setSavedProject] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [newMember, setNewMember] = useState({ member_name: "", role: "" });
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showKpModal, setShowKpModal] = useState(false);
  const [kpStyle, setKpStyle] = useState("corporate");
  const [kpIntro, setKpIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "error">("idle");
  const [addingEstimate, setAddingEstimate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pr, cl, est] = await Promise.all([
        fetch(`${API}?action=projects&id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=clients_short`).then(r => r.json()),
        fetch(`${API}?action=estimates&project_id=${projectId}`).then(r => r.json()),
      ]);
      if (pr.ok) {
        setProject(pr.project);
        setSavedProject(JSON.stringify(pr.project));
        setTeam(pr.team || []);
      }
      if (cl.ok) setClients(cl.clients || []);
      if (est.ok) setEstimates(est.estimates || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const saveProject = async () => {
    if (!project || saving) return;
    setSaving(true); setStatus("idle");
    try {
      const r = await fetch(`${API}?action=projects&id=${projectId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const data = await r.json();
      if (data.ok) { setSavedProject(JSON.stringify(project)); setStatus("saved"); setTimeout(() => setStatus("idle"), 3000); }
      else setStatus("error");
    } catch { setStatus("error"); } finally { setSaving(false); }
  };

  const addEstimate = async () => {
    setAddingEstimate(true);
    try {
      const r = await fetch(`${API}?action=estimates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, name: "Дополнительная смета" }),
      });
      const data = await r.json();
      if (data.ok) load();
    } catch { /* ignore */ } finally { setAddingEstimate(false); }
  };

  const addMember = async () => {
    if (!newMember.member_name.trim()) return;
    try {
      await fetch(`${API}?action=team`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...newMember }) });
      setNewMember({ member_name: "", role: "" }); load();
    } catch { /* ignore */ }
  };

  const generatePdf = async () => {
    setGeneratingPdf(true); setPdfUrl("");
    try {
      const r = await fetch(`${PDF_API}?project_id=${projectId}&style=${kpStyle}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro: kpIntro }),
      });
      const data = await r.json();
      if (data.ok) setPdfUrl(data.url);
    } catch { /* ignore */ } finally { setGeneratingPdf(false); }
  };

  const sendToProjectChat = async () => {
    if (!pdfUrl) return;
    setSending(true); setSendStatus("idle");
    try {
      const chatR = await fetch(`${API}?action=project_chat&project_id=${projectId}`);
      const chatData = await chatR.json();
      if (!chatData.ok) { setSendStatus("error"); return; }
      const r = await fetch(`${API}?action=project_chat&sub=message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatData.chat.id, text: `Коммерческое предложение:\n${pdfUrl}`, author_name: "Система", author_role: "manager" }),
      });
      setSendStatus((await r.json()).ok ? "ok" : "error");
    } catch { setSendStatus("error"); } finally { setSending(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20"><p className="text-sm text-ink-faint">Проект не найден</p><button onClick={onBack} className="text-sm text-ink font-medium hover:underline mt-2">Назад</button></div>;

  if (showChat) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setShowChat(false)} className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors">
            <Icon name="ArrowLeft" size={16} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Чат проекта</h2>
            <p className="text-xs text-ink-faint">{project.name}</p>
          </div>
        </div>
        <ProjectChat projectId={projectId} projectName={project.name} />
      </div>
    );
  }

  const hasProjectChanges = JSON.stringify(project) !== savedProject;

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
        <button onClick={() => setShowChat(true)}
          className="h-9 px-4 border border-snow-dark text-sm font-medium rounded-full hover:bg-snow transition-colors flex items-center gap-2 text-ink-muted">
          <Icon name="MessageSquare" size={15} /> Чат
        </button>
        <button onClick={() => { setShowKpModal(true); setPdfUrl(""); setSendStatus("idle"); }}
          className="h-9 px-4 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="FileDown" size={15} /> Скачать КП
        </button>
      </div>

      {/* KP Modal */}
      {showKpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setShowKpModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm">Коммерческое предложение</h3>
              <button onClick={() => setShowKpModal(false)} className="text-ink-faint hover:text-ink"><Icon name="X" size={18} /></button>
            </div>
            {!pdfUrl && !generatingPdf && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-ink-muted mb-3">Стиль</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "minimal", label: "Минимал", icon: "Minus", color: "bg-gray-900" },
                      { id: "corporate", label: "Корпоративный", icon: "Building2", color: "bg-blue-900" },
                      { id: "presentation", label: "Презентация", icon: "Sparkles", color: "bg-violet-600" },
                    ].map(s => (
                      <button key={s.id} onClick={() => setKpStyle(s.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${kpStyle === s.id ? "border-ink bg-ink/[0.03]" : "border-snow-dark hover:border-ink-faint"}`}>
                        <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mb-2`}><Icon name={s.icon} size={14} className="text-white" /></div>
                        <p className="text-xs font-semibold">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-muted mb-2">Вступительный текст <span className="font-normal text-ink-faint">(необязательно)</span></p>
                  <textarea value={kpIntro} onChange={e => setKpIntro(e.target.value)} placeholder="Добрый день!..." rows={3}
                    className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
                </div>
                <button onClick={generatePdf} className="w-full py-3 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors flex items-center justify-center gap-2">
                  <Icon name="Zap" size={16} /> Сгенерировать PDF
                </button>
              </div>
            )}
            {generatingPdf && <div className="flex flex-col items-center py-10 gap-3"><div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /><p className="text-sm text-ink-faint">Генерирую КП...</p></div>}
            {pdfUrl && !generatingPdf && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2"><Icon name="CheckCircle2" size={16} className="text-green-600 shrink-0" /><p className="text-xs text-green-700 font-medium">PDF готов!</p></div>
                <div className="flex gap-2">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors"><Icon name="Download" size={16} /> Скачать</a>
                  <button onClick={() => setPdfUrl("")} className="px-4 py-3 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors text-ink-muted">Другой стиль</button>
                </div>
                <button onClick={sendToProjectChat} disabled={sending}
                  className="w-full py-2.5 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {sending ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="MessageSquare" size={14} />}
                  {sending ? "Отправляю..." : "Отправить в чат проекта"}
                </button>
                {sendStatus === "ok" && <p className="text-xs text-green-600 flex items-center gap-1"><Icon name="Check" size={12} /> Отправлено</p>}
                {sendStatus === "error" && <p className="text-xs text-red-500 flex items-center gap-1"><Icon name="AlertCircle" size={12} /> Ошибка</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project settings */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1.5 block">НДС</label>
            <select value={project.vat_mode} onChange={e => setProject(p => p ? { ...p, vat_mode: e.target.value } : p)}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              {VAT_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          {project.vat_mode !== "none" && (
            <div>
              <label className="text-xs text-ink-muted font-medium mb-1.5 block">Ставка НДС, %</label>
              <input type="number" min={0} max={100} value={project.vat_rate || 20}
                onChange={e => setProject(p => p ? { ...p, vat_rate: Number(e.target.value) } : p)}
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            </div>
          )}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark w-fit">
        {([
          { id: "estimates" as Tab, label: "Сметы", icon: "Calculator" },
          { id: "team" as Tab, label: "Команда", icon: "Users" },
          { id: "documents" as Tab, label: "Документы", icon: "FileText" },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs rounded-full transition-all font-medium flex items-center gap-1.5 ${tab === t.id ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "estimates" && (
        <div className="space-y-6">
          {/* Основная смета (старые позиции без estimate_id) */}
          <EstimateTable
            projectId={projectId}
            discountPercent={project.discount_percent || 0}
            vatMode={project.vat_mode}
            vatRate={project.vat_rate || 20}
            title="Основная смета"
          />

          {/* Дополнительные сметы */}
          {estimates.map(est => (
            <EstimateTable
              key={est.id}
              projectId={projectId}
              estimateId={est.id}
              discountPercent={est.discount_percent || 0}
              vatMode={est.vat_mode || project.vat_mode}
              vatRate={est.vat_rate || project.vat_rate || 20}
              title={est.name}
              onUpdateTitle={(name) => {
                fetch(`${API}?action=estimates&id=${est.id}`, {
                  method: "PUT", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                }).catch(() => {/* ignore */});
              }}
            />
          ))}

          <button onClick={addEstimate} disabled={addingEstimate}
            className="w-full py-4 border-2 border-dashed border-snow-dark hover:border-ink-faint rounded-2xl text-sm text-ink-muted font-medium transition-all flex items-center justify-center gap-2 hover:bg-snow/50">
            <Icon name="Plus" size={16} /> Добавить смету
          </button>
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
              className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">Добавить</button>
          </div>
          {team.length === 0
            ? <div className="text-center py-12"><Icon name="Users" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Команда не назначена</p></div>
            : team.map(m => (
              <div key={m.id} className="card-surface rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">{m.member_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</div>
                <div><p className="text-sm font-medium">{m.member_name}</p><p className="text-xs text-ink-faint">{m.role}</p></div>
              </div>
            ))
          }
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
