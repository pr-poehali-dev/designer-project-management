import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ProjectChat from "./ProjectChat";
import ProjectCardKpModal from "./ProjectCardKpModal";
import {
  API, PDF_API, DOC_API,
  ProjectData, Estimate, TeamMember, ClientShort,
  Brief, Reference, ProjectDoc, Payment, Act, Invoice,
  BRIEF_EMPTY,
} from "./ProjectCardTypes";
import PanelObject from "./panels/PanelObject";
import PanelBrief from "./panels/PanelBrief";
import PanelEstimate from "./panels/PanelEstimate";
import PanelContract from "./panels/PanelContract";
import PanelFinance from "./panels/PanelFinance";
import PanelActs from "./panels/PanelActs";
import PanelStages from "./panels/PanelStages";

type PanelId = "object" | "brief" | "estimate" | "contract" | "finance" | "acts" | "stages";

function fmt(n: number) {
  return n.toLocaleString("ru", { maximumFractionDigits: 0 });
}

export default function ProjectCard({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [showChat, setShowChat] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>("object");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<ClientShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedProject, setSavedProject] = useState("");

  const [clientLink, setClientLink] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showKpModal, setShowKpModal] = useState(false);
  const [kpStyle, setKpStyle] = useState("corporate");
  const [kpIntro, setKpIntro] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "error">("idle");

  const [brief, setBrief] = useState<Brief>(BRIEF_EMPTY);
  const [briefSaved, setBriefSaved] = useState<Brief>(BRIEF_EMPTY);
  const [briefLoaded, setBriefLoaded] = useState(false);

  const [documents, setDocuments] = useState<ProjectDoc[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payPaid, setPayPaid] = useState(0);
  const [references, setReferences] = useState<Reference[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [memberOptions, setMemberOptions] = useState<{ name: string; label: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ id: string; label: string }[]>([]);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pr, cl, est, brf, docs, pays, refs, mbr, actsR] = await Promise.all([
        fetch(`${API}?action=projects&id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=clients_short`).then(r => r.json()),
        fetch(`${API}?action=estimates&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=brief&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=documents&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=payments&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=references&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=members&project_id=${projectId}`).then(r => r.json()),
        fetch(`${API}?action=acts&project_id=${projectId}`).then(r => r.json()),
      ]);
      if (pr.ok) { setProject(pr.project); setSavedProject(JSON.stringify(pr.project)); setTeam(pr.team || []); }
      if (cl.ok) setClients(cl.clients || []);
      if (est.ok) setEstimates(est.estimates || []);
      if (brf.ok && brf.brief) { const b = { ...BRIEF_EMPTY, ...brf.brief }; setBrief(b); setBriefSaved(b); setBriefLoaded(true); }
      else setBriefLoaded(true);
      if (docs.ok) setDocuments(docs.documents || []);
      if (pays.ok) { setPayments(pays.payments || []); setPayTotal(pays.total || 0); setPayPaid(pays.paid || 0); }
      if (refs.ok) setReferences(refs.references || []);
      if (mbr.ok) { setMemberOptions(mbr.members || []); setRoleOptions(mbr.roles || []); }
      if (actsR.ok) { setActs(actsR.acts || []); setInvoices(actsR.invoices || []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const saveProject = async (updated?: ProjectData) => {
    const p = updated ?? project;
    if (!p) return;
    try {
      await fetch(`${API}?action=projects&id=${projectId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      setSavedProject(JSON.stringify(p));
    } catch { /* ignore */ }
  };

  const getClientLink = async () => {
    if (clientLink) { navigator.clipboard.writeText(clientLink); setCopyStatus("copied"); setTimeout(() => setCopyStatus("idle"), 2000); return; }
    try {
      const r = await fetch(`${API}?action=client_token&project_id=${projectId}`);
      const data = await r.json();
      if (data.ok) {
        const link = `${window.location.origin}/client/${data.token}`;
        setClientLink(link); navigator.clipboard.writeText(link);
        setCopyStatus("copied"); setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch { /* ignore */ }
  };

  const getClientLinkAndReturn = async (): Promise<string> => {
    if (clientLink) return clientLink;
    const r = await fetch(`${API}?action=client_token&project_id=${projectId}`);
    const data = await r.json();
    if (data.ok) { const link = `${window.location.origin}/client/${data.token}`; setClientLink(link); return link; }
    return "";
  };

  const sendMessageToChat = async (text: string) => {
    const chatR = await fetch(`${API}?action=project_chat&project_id=${projectId}`);
    const chatData = await chatR.json();
    if (!chatData.ok) throw new Error("chat error");
    const r = await fetch(`${API}?action=project_chat&sub=message`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatData.chat.id, text, author_name: "Менеджер", author_role: "manager" }),
    });
    if (!(await r.json()).ok) throw new Error("send error");
  };

  const generateDoc = async () => {
    setGeneratingDoc(true);
    try {
      const r = await fetch(`${DOC_API}?action=generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: projectId, template_id: 1 }) });
      const data = await r.json();
      if (data.ok) window.open(data.url, "_blank");
    } catch { /* ignore */ } finally { setGeneratingDoc(false); }
  };

  const generatePdf = async () => {
    setGeneratingPdf(true); setPdfUrl("");
    try {
      const r = await fetch(`${PDF_API}?project_id=${projectId}&style=${kpStyle}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: kpIntro }) });
      const data = await r.json();
      if (data.ok) setPdfUrl(data.url);
    } catch { /* ignore */ } finally { setGeneratingPdf(false); }
  };

  const sendToProjectChat = async () => {
    if (!pdfUrl) return;
    setSending(true); setSendStatus("idle");
    try { await sendMessageToChat(`Коммерческое предложение:\n${pdfUrl}`); setSendStatus("ok"); }
    catch { setSendStatus("error"); } finally { setSending(false); }
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
          <div className="flex-1"><h2 className="text-lg font-semibold">Чат проекта</h2><p className="text-xs text-ink-faint">{project.name}</p></div>
        </div>
        <ProjectChat projectId={projectId} projectName={project.name} />
      </div>
    );
  }

  // ── Вычисляемые статусы ──
  const briefStatusLabel: Record<string, { label: string; dot: string }> = {
    draft:  { label: "Ожидает отправки", dot: "bg-ink-faint" },
    sent:   { label: "Отправлен",        dot: "bg-blue-500" },
    filled: { label: "Заполнен",         dot: "bg-green-500" },
  };
  const contractDocs = documents.filter(d => d.doc_type === "contract");
  const contractStatus = contractDocs.length === 0 ? { label: "Не сформирован", dot: "bg-ink-faint" }
    : contractDocs.some(d => d.is_signed) ? { label: "Подписан", dot: "bg-green-500" }
    : { label: "Отправлен", dot: "bg-blue-500" };
  const estimateStatus = project.main_estimate_approved ? { label: "Утверждена", dot: "bg-green-500" }
    : estimates.some(e => e.is_approved) ? { label: "На утверждении", dot: "bg-amber-500" }
    : { label: "Не утверждена", dot: "bg-ink-faint" };
  const payRemaining = payTotal - payPaid;

  // ── Табы ──
  const TABS: { id: PanelId; icon: string; label: string; badge?: string; dot?: string }[] = [
    { id: "object",   icon: "Home",        label: "Объект",      badge: project.object_address ? undefined : undefined },
    { id: "brief",    icon: "ClipboardList", label: "Бриф",      dot: briefStatusLabel[brief.status]?.dot },
    { id: "estimate", icon: "Calculator",  label: "Смета",       dot: estimateStatus.dot },
    { id: "contract", icon: "FileText",    label: "Договор",     dot: contractStatus.dot },
    { id: "finance",  icon: "Wallet",      label: "Финансы",     badge: payTotal > 0 ? fmt(payRemaining) + " ₽" : undefined },
    { id: "acts",     icon: "Receipt",     label: "Акты",        badge: acts.length > 0 ? String(acts.length) : undefined },
    { id: "stages",   icon: "ListChecks",  label: "Выполнение" },
  ];

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors shrink-0">
          <Icon name="ArrowLeft" size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={project.name}
            onChange={e => setProject(p => p ? { ...p, name: e.target.value } : p)}
            onBlur={() => saveProject()}
            className="text-lg font-semibold bg-transparent focus:outline-none focus:bg-snow rounded-lg px-2 py-1 -ml-2 w-full"
          />
          <p className="text-xs text-ink-faint ml-0.5">{project.client_name || "Клиент не выбран"}</p>
        </div>
        <select
          value={project.status}
          onChange={e => { const p = { ...project, status: e.target.value }; setProject(p); saveProject(p); }}
          className="h-8 px-3 text-xs font-medium rounded-full border border-snow-dark bg-snow cursor-pointer outline-none"
        >
          {[{id:"draft",label:"Черновик"},{id:"active",label:"В работе"},{id:"done",label:"Завершён"},{id:"paused",label:"Пауза"}].map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button onClick={getClientLink} className="h-9 px-4 border border-snow-dark text-sm font-medium rounded-full hover:bg-snow transition-colors flex items-center gap-2 text-ink-muted">
          {copyStatus === "copied"
            ? <><Icon name="Check" size={15} className="text-green-600" /><span className="text-green-600 text-xs">Скопировано</span></>
            : <><Icon name="Link" size={15} /><span className="text-xs">Ссылка клиенту</span></>}
        </button>
        <button onClick={() => setShowChat(true)} className="h-9 px-4 border border-snow-dark text-sm font-medium rounded-full hover:bg-snow transition-colors flex items-center gap-2 text-ink-muted">
          <Icon name="MessageSquare" size={15} /><span className="text-xs">Чат</span>
        </button>
      </div>

      {/* KP Modal */}
      {showKpModal && (
        <ProjectCardKpModal
          projectId={projectId} onClose={() => setShowKpModal(false)}
          kpStyle={kpStyle} setKpStyle={setKpStyle}
          kpIntro={kpIntro} setKpIntro={setKpIntro}
          generatingPdf={generatingPdf} pdfUrl={pdfUrl} setPdfUrl={setPdfUrl}
          onGenerate={generatePdf} onSendToChat={sendToProjectChat}
          sending={sending} sendStatus={sendStatus}
        />
      )}

      {/* ── Таб-навигатор ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {TABS.map(tab => {
          const active = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                active
                  ? "bg-ink text-white shadow-sm"
                  : "bg-snow text-ink-muted hover:bg-snow-dark hover:text-ink"
              }`}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
              {tab.dot && !active && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot}`} />
              )}
              {tab.badge && !active && (
                <span className="text-[10px] font-semibold bg-ink/10 text-ink px-1.5 py-0.5 rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Контент ── */}
      <div className="card-surface rounded-2xl p-6">
        {activePanel === "object" && (
          <PanelObject
            project={project} setProject={setProject} clients={clients}
            team={team} memberOptions={memberOptions} roleOptions={roleOptions}
            onSave={saveProject}
            onAddMember={async (m) => { await fetch(`${API}?action=team`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: projectId, ...m }) }); load(); }}
            onDeleteMember={async (id) => { await fetch(`${API}?action=team&id=${id}`, { method: "DELETE" }); setTeam(prev => prev.filter(m => m.id !== id)); }}
            photos={references.filter(r => r.uploaded_by === "designer")}
            onPhotoUpload={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = async ev => {
                const base64 = (ev.target?.result as string).split(",")[1];
                const r = await fetch(`${API}?action=references`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: projectId, file: base64, mime: file.type, uploaded_by: "designer" }) });
                const data = await r.json();
                if (data.ok) setReferences(p => [...p, data.reference]);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        )}

        {activePanel === "brief" && (
          <PanelBrief
            brief={brief} briefSaved={briefSaved} briefLoaded={briefLoaded} setBrief={setBrief}
            clientLink={clientLink} onGetClientLink={getClientLinkAndReturn} onSendToChat={sendMessageToChat}
            onSave={async () => {
              await fetch(`${API}?action=brief&project_id=${projectId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: projectId, ...brief }) });
              setBriefSaved({ ...brief });
            }}
          />
        )}

        {activePanel === "estimate" && (
          <PanelEstimate
            projectId={projectId} project={project} estimates={estimates} onReload={load}
            onShowKp={() => { setPdfUrl(""); setSendStatus("idle"); setShowKpModal(true); }}
          />
        )}

        {activePanel === "contract" && (
          <PanelContract
            projectId={projectId} documents={documents} setDocuments={setDocuments}
            generatingDoc={generatingDoc} onGenerateDoc={generateDoc}
          />
        )}

        {activePanel === "finance" && (
          <PanelFinance
            projectId={projectId} payments={payments} setPayments={setPayments}
            payTotal={payTotal} payPaid={payPaid} onReload={load}
          />
        )}

        {activePanel === "acts" && (
          <PanelActs
            projectId={projectId} acts={acts} invoices={invoices}
            setActs={setActs} setInvoices={setInvoices}
          />
        )}

        {activePanel === "stages" && (
          <PanelStages projectId={projectId} />
        )}
      </div>
    </div>
  );
}
