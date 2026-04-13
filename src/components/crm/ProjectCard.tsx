import { useState, useEffect, useCallback, useRef } from "react";
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
interface Brief { style: string; area: string; budget: string; rooms: string; wishes: string; color_palette: string; furniture: string; restrictions: string; extra: string; client_comment: string; }
interface Reference { id: number; url: string; caption: string; uploaded_by: string; }
interface ProjectDoc { id: number; name: string; url: string; doc_type: string; uploaded_by: string; is_signed: boolean; created_at: string; }
interface Payment { id: number; amount: number; label: string; is_paid: boolean; paid_at: string | null; }

type Tab = "estimates" | "team" | "brief" | "documents" | "payments" | "references";

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
  const [clientLink, setClientLink] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showKpModal, setShowKpModal] = useState(false);
  const [kpStyle, setKpStyle] = useState("corporate");
  const [kpIntro, setKpIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "error">("idle");
  const [addingEstimate, setAddingEstimate] = useState(false);

  // Brief
  const BRIEF_EMPTY: Brief = { style: "", area: "", budget: "", rooms: "", wishes: "", color_palette: "", furniture: "", restrictions: "", extra: "", client_comment: "" };
  const [brief, setBrief] = useState<Brief>(BRIEF_EMPTY);
  const [briefSaved, setBriefSaved] = useState<Brief>(BRIEF_EMPTY);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<ProjectDoc[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payPaid, setPayPaid] = useState(0);
  const [newPayment, setNewPayment] = useState({ label: "", amount: "" });
  const [addingPayment, setAddingPayment] = useState(false);

  // References
  const [references, setReferences] = useState<Reference[]>([]);
  const [uploadingRef, setUploadingRef] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [pr, cl, est, brf, docs, pays, refs] = await Promise.all([
        fetch(`${API}?action=projects&id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=clients_short`).then(r => r.json()),
        fetch(`${API}?action=estimates&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=brief&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=documents&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=payments&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=references&project_id=${projectId}`).then(r => r.json()),
      ]);
      if (pr.ok) { setProject(pr.project); setSavedProject(JSON.stringify(pr.project)); setTeam(pr.team || []); }
      if (cl.ok) setClients(cl.clients || []);
      if (est.ok) setEstimates(est.estimates || []);
      if (brf.ok && brf.brief) { const b = { ...BRIEF_EMPTY, ...brf.brief }; setBrief(b); setBriefSaved(b); setBriefLoaded(true); }
      else setBriefLoaded(true);
      if (docs.ok) setDocuments(docs.documents || []);
      if (pays.ok) { setPayments(pays.payments || []); setPayTotal(pays.total || 0); setPayPaid(pays.paid || 0); }
      if (refs.ok) setReferences(refs.references || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const saveBrief = async () => {
    setSavingBrief(true);
    try {
      await fetch(`${API}?action=brief&project_id=${projectId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...brief }),
      });
      setBriefSaved({ ...brief });
    } catch { /* ignore */ } finally { setSavingBrief(false); }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = (ev.target?.result as string).split(",")[1];
      const docType = file.name.toLowerCase().includes("договор") ? "contract"
        : file.name.toLowerCase().includes("акт") ? "act"
        : file.name.toLowerCase().includes("счет") || file.name.toLowerCase().includes("счёт") ? "invoice" : "other";
      try {
        const r = await fetch(`${API}?action=documents`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, file: base64, mime: file.type, name: file.name, uploaded_by: "designer", doc_type: docType }),
        });
        const data = await r.json();
        if (data.ok) setDocuments(p => [...p, data.document]);
      } catch { /* ignore */ } finally { setUploadingDoc(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addPayment = async () => {
    if (!newPayment.amount || !newPayment.label.trim()) return;
    setAddingPayment(true);
    try {
      const r = await fetch(`${API}?action=payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, amount: parseFloat(newPayment.amount), label: newPayment.label }),
      });
      const data = await r.json();
      if (data.ok) { setPayments(p => [...p, data.payment]); setNewPayment({ label: "", amount: "" }); load(); }
    } catch { /* ignore */ } finally { setAddingPayment(false); }
  };

  const togglePayment = async (id: number, currentPaid: boolean) => {
    await fetch(`${API}?action=payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, action: "mark_paid", id, is_paid: !currentPaid }),
    });
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, is_paid: !currentPaid, paid_at: !currentPaid ? new Date().toISOString() : null } : pay));
    load();
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingRef(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = (ev.target?.result as string).split(",")[1];
      try {
        const r = await fetch(`${API}?action=references`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, file: base64, mime: file.type, uploaded_by: "designer" }),
        });
        const data = await r.json();
        if (data.ok) setReferences(p => [...p, data.reference]);
      } catch { /* ignore */ } finally { setUploadingRef(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short" }) : "";

  const getClientLink = async () => {
    if (clientLink) {
      navigator.clipboard.writeText(clientLink);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }
    try {
      const r = await fetch(`${API}?action=client_token&project_id=${projectId}`);
      const data = await r.json();
      if (data.ok) {
        const link = `${window.location.origin}/client/${data.token}`;
        setClientLink(link);
        navigator.clipboard.writeText(link);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch { /* ignore */ }
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
        <button onClick={getClientLink}
          className="h-9 px-4 border border-snow-dark text-sm font-medium rounded-full hover:bg-snow transition-colors flex items-center gap-2 text-ink-muted">
          {copyStatus === "copied"
            ? <><Icon name="Check" size={15} className="text-green-600" /><span className="text-green-600">Скопировано</span></>
            : <><Icon name="Link" size={15} /> Ссылка клиенту</>}
        </button>
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
      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark flex-wrap">
        {([
          { id: "estimates" as Tab, label: "Сметы",     icon: "Calculator" },
          { id: "team"      as Tab, label: "Команда",   icon: "Users" },
          { id: "brief"     as Tab, label: "Бриф",      icon: "ClipboardList" },
          { id: "documents" as Tab, label: "Документы", icon: "Paperclip" },
          { id: "payments"  as Tab, label: "Платежи",   icon: "CreditCard" },
          { id: "references"as Tab, label: "Референсы", icon: "Images" },
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

      {/* ── БРИФ ── */}
      {tab === "brief" && (
        <div className="space-y-4">
          <div className="card-surface rounded-2xl p-6">
            <p className="text-sm font-semibold mb-4">Параметры проекта</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "style",         label: "Стиль интерьера",     placeholder: "Современный, скандинавский..." },
                { key: "area",          label: "Площадь (м²)",        placeholder: "85" },
                { key: "budget",        label: "Бюджет (₽)",          placeholder: "1 500 000" },
                { key: "rooms",         label: "Комнаты",             placeholder: "Гостиная, спальня, 2 детских..." },
                { key: "color_palette", label: "Цветовая палитра",    placeholder: "Светлые тона, акцент терракот..." },
                { key: "furniture",     label: "Мебель",              placeholder: "ИКЕА, итальянские бренды..." },
                { key: "restrictions",  label: "Ограничения",         placeholder: "Нельзя трогать несущие стены..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-ink-muted font-medium mb-1.5 block">{f.label}</label>
                  <input value={brief[f.key as keyof Brief] || ""} onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-muted font-medium mb-1.5 block">Пожелания клиента</label>
              <textarea value={brief.wishes || ""} onChange={e => setBrief(p => ({ ...p, wishes: e.target.value }))}
                rows={3} placeholder="Открытая планировка, много света..."
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-muted font-medium mb-1.5 block">Дополнительно</label>
              <textarea value={brief.extra || ""} onChange={e => setBrief(p => ({ ...p, extra: e.target.value }))}
                rows={2} placeholder="Любая другая информация..."
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
            </div>
            {brief.client_comment && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium mb-1">Комментарий клиента</p>
                <p className="text-sm text-amber-800">{brief.client_comment}</p>
              </div>
            )}
            <div className="flex items-center justify-end mt-4 pt-4 border-t border-snow-dark">
              <button onClick={saveBrief} disabled={savingBrief || JSON.stringify(brief) === JSON.stringify(briefSaved)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${JSON.stringify(brief) !== JSON.stringify(briefSaved) ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
                {savingBrief ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                Сохранить
              </button>
            </div>
          </div>
          {briefLoaded && !brief.client_comment && (
            <p className="text-xs text-ink-faint text-center">Клиент может оставить комментарий в своём кабинете</p>
          )}
        </div>
      )}

      {/* ── ДОКУМЕНТЫ ── */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
              <p className="text-sm font-semibold">Документы</p>
              <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
                className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
                {uploadingDoc ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
                Загрузить
              </button>
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDocUpload} className="hidden" />
            </div>
            {documents.length === 0
              ? <div className="text-center py-12"><Icon name="Paperclip" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Документов пока нет</p></div>
              : <div className="divide-y divide-snow-dark">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${doc.uploaded_by === "client" ? "bg-blue-50" : "bg-snow"}`}>
                        <Icon name="FileText" size={16} className={doc.uploaded_by === "client" ? "text-blue-500" : "text-ink-muted"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-ink-faint">{doc.uploaded_by === "client" ? "От клиента" : "От дизайнера"} · {fmtDate(doc.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.is_signed && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><Icon name="CheckCircle" size={12} />Подписан</span>}
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors">
                          <Icon name="Download" size={13} className="text-ink-muted" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── ПЛАТЕЖИ ── */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Стоимость", val: Math.round(payTotal), color: "text-ink" },
              { label: "Оплачено",  val: Math.round(payPaid),  color: "text-green-600" },
              { label: "Остаток",   val: Math.round(payTotal - payPaid), color: "text-amber-600" },
            ].map(s => (
              <div key={s.label} className="card-surface rounded-2xl p-4 text-center">
                <p className="text-xs text-ink-faint font-medium">{s.label}</p>
                <p className={`text-xl font-bold mt-1 tabular-nums ${s.color}`}>{s.val.toLocaleString("ru")} ₽</p>
              </div>
            ))}
          </div>
          <div className="card-surface rounded-2xl p-4 flex gap-3">
            <input value={newPayment.label} onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))}
              placeholder="Название (аванс, 1-й платёж...)"
              className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <input type="number" value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
              placeholder="Сумма ₽" className="w-36 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <button onClick={addPayment} disabled={!newPayment.label.trim() || !newPayment.amount || addingPayment}
              className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
              {addingPayment ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Добавить"}
            </button>
          </div>
          <div className="card-surface rounded-2xl overflow-hidden">
            {payments.length === 0
              ? <div className="text-center py-12"><Icon name="CreditCard" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Платежей нет</p></div>
              : <div className="divide-y divide-snow-dark">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      <button onClick={() => togglePayment(p.id, p.is_paid)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${p.is_paid ? "bg-green-500 hover:bg-green-600" : "bg-snow-dark hover:bg-ink-faint/20"}`}>
                        <Icon name={p.is_paid ? "Check" : "Circle"} size={15} className={p.is_paid ? "text-white" : "text-ink-faint"} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.label || "Платёж"}</p>
                        {p.paid_at && <p className="text-xs text-ink-faint">{fmtDate(p.paid_at)}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${p.is_paid ? "text-green-600" : "text-ink"}`}>{Number(p.amount).toLocaleString("ru")} ₽</p>
                        <p className={`text-xs ${p.is_paid ? "text-green-500" : "text-amber-500"}`}>{p.is_paid ? "Оплачено" : "Ожидает"}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── РЕФЕРЕНСЫ ── */}
      {tab === "references" && (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
            <p className="text-sm font-semibold">Референсы ({references.length})</p>
            <button onClick={() => refInputRef.current?.click()} disabled={uploadingRef}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
              {uploadingRef ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Plus" size={15} />}
              Добавить
            </button>
            <input ref={refInputRef} type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
          </div>
          {references.length === 0
            ? <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-snow flex items-center justify-center"><Icon name="Images" size={20} className="text-ink-faint" /></div>
                <div><p className="text-sm font-medium">Референсов пока нет</p><p className="text-xs text-ink-faint mt-1">Клиент может добавить в своём кабинете</p></div>
              </div>
            : <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {references.map(ref => (
                  <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="relative group aspect-square rounded-xl overflow-hidden bg-snow hover:opacity-80 transition-opacity">
                    <img src={ref.url} alt="Референс" className="w-full h-full object-cover" />
                    {ref.uploaded_by === "client" && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">клиент</span>
                    )}
                  </a>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}