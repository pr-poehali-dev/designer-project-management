import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import ProjectChat from "./ProjectChat";
import ProjectCardKpModal from "./ProjectCardKpModal";
import ProjectCardSettings from "./ProjectCardSettings";
import ProjectCardTabs from "./ProjectCardTabs";
import {
  API, PDF_API,
  Tab, ProjectData, Estimate, TeamMember, ClientShort,
  Brief, Reference, ProjectDoc, Payment,
  BRIEF_EMPTY,
} from "./ProjectCardTypes";

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
  const [brief, setBrief] = useState<Brief>(BRIEF_EMPTY);
  const [briefSaved, setBriefSaved] = useState<Brief>(BRIEF_EMPTY);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<ProjectDoc[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docUploadRef = useRef<((e: React.ChangeEvent<HTMLInputElement>) => void) | null>(null);

  // Payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payPaid, setPayPaid] = useState(0);
  const [newPayment, setNewPayment] = useState({ label: "", amount: "" });
  const [addingPayment, setAddingPayment] = useState(false);

  // References
  const [references, setReferences] = useState<Reference[]>([]);
  const [uploadingRef, setUploadingRef] = useState(false);

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

  const deleteMember = async (id: number) => {
    try {
      await fetch(`${API}?action=team&id=${id}`, { method: "DELETE" });
      setTeam(prev => prev.filter(m => m.id !== id));
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
      {/* Header */}
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
        <ProjectCardKpModal
          projectId={projectId}
          onClose={() => setShowKpModal(false)}
          kpStyle={kpStyle}
          setKpStyle={setKpStyle}
          kpIntro={kpIntro}
          setKpIntro={setKpIntro}
          generatingPdf={generatingPdf}
          pdfUrl={pdfUrl}
          setPdfUrl={setPdfUrl}
          onGenerate={generatePdf}
          onSendToChat={sendToProjectChat}
          sending={sending}
          sendStatus={sendStatus}
        />
      )}

      {/* Project settings */}
      <ProjectCardSettings
        project={project}
        setProject={setProject}
        clients={clients}
        saving={saving}
        hasChanges={hasProjectChanges}
        saveStatus={status}
        onSave={saveProject}
        team={team}
        newMember={newMember}
        setNewMember={setNewMember}
        onAddMember={addMember}
        onDeleteMember={deleteMember}
      />

      {/* Tabs */}
      <ProjectCardTabs
        tab={tab}
        setTab={setTab}
        projectId={projectId}
        project={project}
        estimates={estimates}
        addingEstimate={addingEstimate}
        onAddEstimate={addEstimate}
        team={team}
        newMember={newMember}
        setNewMember={setNewMember}
        onAddMember={addMember}
        brief={brief}
        briefSaved={briefSaved}
        briefLoaded={briefLoaded}
        savingBrief={savingBrief}
        setBrief={setBrief}
        onSaveBrief={saveBrief}
        documents={documents}
        uploadingDoc={uploadingDoc}
        onDocUpload={handleDocUpload}
        payments={payments}
        payTotal={payTotal}
        payPaid={payPaid}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        addingPayment={addingPayment}
        onAddPayment={addPayment}
        onTogglePayment={togglePayment}
        references={references}
        uploadingRef={uploadingRef}
        onRefUpload={handleRefUpload}
        fmtDate={fmtDate}
      />
    </div>
  );
}