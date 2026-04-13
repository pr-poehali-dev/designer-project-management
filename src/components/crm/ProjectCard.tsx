import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import ProjectChat from "./ProjectChat";
import ProjectCardKpModal from "./ProjectCardKpModal";
import {
  API, PDF_API, DOC_API,
  ProjectData, Estimate, TeamMember, ClientShort,
  Brief, Reference, ProjectDoc, Payment, Act, Invoice, Stage,
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

// ── Карточка-плитка ─────────────────────────────────────────
function Tile({
  icon, title, children, onClick, accent,
}: {
  icon: string; title: string; children: React.ReactNode; onClick: () => void; accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="card-surface rounded-2xl p-4 text-left w-full hover:shadow-md transition-all active:scale-[0.98] group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent || "bg-snow-mid"}`}>
          <Icon name={icon} size={14} className="text-ink-muted" />
        </div>
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{title}</span>
        <Icon name="ChevronRight" size={13} className="ml-auto text-ink-faint group-hover:text-ink transition-colors" />
      </div>
      <div>{children}</div>
    </button>
  );
}

// ── Слайд-панель ─────────────────────────────────────────────
function SlidePanel({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-panel">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-snow-dark shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-snow hover:bg-snow-dark transition-colors flex items-center justify-center">
            <Icon name="X" size={15} />
          </button>
          <h2 className="font-semibold text-base">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ProjectCard({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [showChat, setShowChat] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

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
      if (pr.ok) {
        setProject(pr.project);
        setSavedProject(JSON.stringify(pr.project));
        setTeam(pr.team || []);
      }
      if (cl.ok) setClients(cl.clients || []);
      if (est.ok) setEstimates(est.estimates || []);
      if (brf.ok && brf.brief) {
        const b = { ...BRIEF_EMPTY, ...brf.brief };
        setBrief(b); setBriefSaved(b); setBriefLoaded(true);
      } else setBriefLoaded(true);
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

  const generateDoc = async () => {
    setGeneratingDoc(true);
    try {
      const r = await fetch(`${DOC_API}?action=generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, template_id: 1 }),
      });
      const data = await r.json();
      if (data.ok) window.open(data.url, "_blank");
    } catch { /* ignore */ } finally { setGeneratingDoc(false); }
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

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );
  if (!project) return (
    <div className="text-center py-20">
      <p className="text-sm text-ink-faint">Проект не найден</p>
      <button onClick={onBack} className="text-sm text-ink font-medium hover:underline mt-2">Назад</button>
    </div>
  );

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

  // ── Статусы для карточек ──
  const briefStatusLabel: Record<string, string> = {
    draft: "Ожидает отправки", sent: "Отправлен клиенту", filled: "Заполнен",
  };
  const contractDocs = documents.filter(d => d.doc_type === "contract");
  const contractStatus = contractDocs.length === 0 ? "Не сформирован"
    : contractDocs.some(d => d.is_signed) ? "Подписан"
    : "Отправлен клиенту";

  const approvedEstimate = estimates.find(e => e.is_approved) ?? (project.discount_percent != null ? null : null);
  const estimateStatus = project.main_estimate_approved ? "Утверждена"
    : estimates.some(e => e.is_approved) ? "На утверждении"
    : "Не утверждена";

  const stagesProgress = `${acts.length} актов`;
  const payRemaining = payTotal - payPaid;

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
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

        {/* Статус */}
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
          projectId={projectId}
          onClose={() => setShowKpModal(false)}
          kpStyle={kpStyle} setKpStyle={setKpStyle}
          kpIntro={kpIntro} setKpIntro={setKpIntro}
          generatingPdf={generatingPdf} pdfUrl={pdfUrl} setPdfUrl={setPdfUrl}
          onGenerate={generatePdf}
          onSendToChat={sendToProjectChat}
          sending={sending} sendStatus={sendStatus}
        />
      )}

      {/* ── Сетка карточек ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

        {/* Объект */}
        <Tile icon="Home" title="Объект" onClick={() => setActivePanel("object")}>
          <p className="text-sm font-semibold text-ink leading-snug line-clamp-1">{project.client_name || "—"}</p>
          <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{project.object_address || "Адрес не указан"}</p>
          <span className={`mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
            project.status === "active" ? "bg-blue-50 text-blue-600"
            : project.status === "done" ? "bg-green-50 text-green-600"
            : "bg-snow-mid text-ink-faint"}`}>
            {{draft:"Черновик",active:"В работе",done:"Завершён",paused:"Пауза"}[project.status] || project.status}
          </span>
        </Tile>

        {/* Бриф */}
        <Tile icon="ClipboardList" title="Бриф" onClick={() => setActivePanel("brief")}>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${
            brief.status === "filled" ? "bg-green-50 text-green-600"
            : brief.status === "sent" ? "bg-blue-50 text-blue-600"
            : "bg-snow-mid text-ink-faint"}`}>
            {briefStatusLabel[brief.status] || "Ожидает отправки"}
          </span>
          {brief.style && <p className="text-xs text-ink-muted mt-1.5 line-clamp-1">{brief.style}</p>}
        </Tile>

        {/* Смета */}
        <Tile icon="Calculator" title="Смета" onClick={() => setActivePanel("estimate")}>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${
            estimateStatus === "Утверждена" ? "bg-green-50 text-green-600"
            : estimateStatus === "На утверждении" ? "bg-amber-50 text-amber-600"
            : "bg-snow-mid text-ink-faint"}`}>
            {estimateStatus}
          </span>
          {payTotal > 0 && <p className="text-sm font-semibold text-ink mt-1.5">{fmt(payTotal)} ₽</p>}
        </Tile>

        {/* Договор */}
        <Tile icon="FileText" title="Договор" onClick={() => setActivePanel("contract")}>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${
            contractStatus === "Подписан" ? "bg-green-50 text-green-600"
            : contractStatus === "Отправлен клиенту" ? "bg-blue-50 text-blue-600"
            : "bg-snow-mid text-ink-faint"}`}>
            {contractStatus}
          </span>
        </Tile>

        {/* Финансы */}
        <Tile icon="Wallet" title="Финансы" onClick={() => setActivePanel("finance")}>
          {payTotal > 0 ? (
            <>
              <p className="text-xs text-ink-muted">Получено</p>
              <p className="text-sm font-semibold text-green-600">{fmt(payPaid)} ₽</p>
              <p className="text-xs text-ink-faint mt-0.5">Осталось: {fmt(payRemaining)} ₽</p>
            </>
          ) : (
            <p className="text-xs text-ink-faint">График не задан</p>
          )}
        </Tile>

        {/* Акты */}
        <Tile icon="Receipt" title="Акты" onClick={() => setActivePanel("acts")}>
          {acts.length > 0 ? (
            <p className="text-sm font-semibold text-ink">{acts.length} {acts.length === 1 ? "акт" : "акта"}</p>
          ) : (
            <p className="text-xs text-ink-faint">Нет актов</p>
          )}
          {invoices.length > 0 && <p className="text-xs text-ink-muted mt-0.5">{invoices.length} счёт{invoices.length > 1 ? "а" : ""}</p>}
        </Tile>

        {/* Выполнение */}
        <Tile icon="ListChecks" title="Выполнение" onClick={() => setActivePanel("stages")} accent="bg-violet-50">
          <p className="text-xs text-ink-muted">Этапы работ</p>
        </Tile>

      </div>

      {/* ── Панели ── */}
      <SlidePanel open={activePanel === "object"} onClose={() => setActivePanel(null)} title="Объект">
        <PanelObject
          project={project}
          setProject={setProject}
          clients={clients}
          team={team}
          memberOptions={memberOptions}
          roleOptions={roleOptions}
          onSave={saveProject}
          onAddMember={async (m) => {
            await fetch(`${API}?action=team`, { method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: projectId, ...m }) });
            load();
          }}
          onDeleteMember={async (id) => {
            await fetch(`${API}?action=team&id=${id}`, { method: "DELETE" });
            setTeam(prev => prev.filter(m => m.id !== id));
          }}
          photos={references.filter(r => r.uploaded_by === "designer")}
          onPhotoUpload={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async ev => {
              const base64 = (ev.target?.result as string).split(",")[1];
              const r = await fetch(`${API}?action=references`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: projectId, file: base64, mime: file.type, uploaded_by: "designer" }),
              });
              const data = await r.json();
              if (data.ok) setReferences(p => [...p, data.reference]);
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "brief"} onClose={() => setActivePanel(null)} title="Бриф">
        <PanelBrief
          brief={brief}
          briefSaved={briefSaved}
          briefLoaded={briefLoaded}
          setBrief={setBrief}
          onSave={async () => {
            await fetch(`${API}?action=brief&project_id=${projectId}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: projectId, ...brief }),
            });
            setBriefSaved({ ...brief });
          }}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "estimate"} onClose={() => setActivePanel(null)} title="Смета">
        <PanelEstimate
          projectId={projectId}
          project={project}
          estimates={estimates}
          onReload={load}
          onShowKp={() => { setActivePanel(null); setTimeout(() => { setPdfUrl(""); setSendStatus("idle"); setShowKpModal(true); }, 100); }}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "contract"} onClose={() => setActivePanel(null)} title="Договор">
        <PanelContract
          projectId={projectId}
          documents={documents}
          setDocuments={setDocuments}
          generatingDoc={generatingDoc}
          onGenerateDoc={generateDoc}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "finance"} onClose={() => setActivePanel(null)} title="График платежей">
        <PanelFinance
          projectId={projectId}
          payments={payments}
          setPayments={setPayments}
          payTotal={payTotal}
          payPaid={payPaid}
          onReload={load}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "acts"} onClose={() => setActivePanel(null)} title="Акты и счета">
        <PanelActs
          projectId={projectId}
          acts={acts}
          invoices={invoices}
          setActs={setActs}
          setInvoices={setInvoices}
        />
      </SlidePanel>

      <SlidePanel open={activePanel === "stages"} onClose={() => setActivePanel(null)} title="Выполнение">
        <PanelStages projectId={projectId} />
      </SlidePanel>
    </div>
  );
}