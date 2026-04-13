import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import ClientDashboardTabs from "./ClientDashboardTabs";
import {
  CRM_API, SETTINGS_API, STATUS_LABELS,
  Session, ProjectData, WorkItem, Estimate, ChatMessage,
  Brief, BriefField, Reference, ProjectDoc, Payment,
} from "./ClientPortalTypes";

interface Props { session: Session; projectToken: string; onLogout: () => void; }

export default function ClientDashboard({ session, projectToken, onLogout }: Props) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefTemplate, setBriefTemplate] = useState<BriefField[]>([]);
  const [briefIntro, setBriefIntro] = useState("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [documents, setDocuments] = useState<ProjectDoc[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payPaid, setPayPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("estimate");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [clientComment, setClientComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!projectToken) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${CRM_API}?action=client_view&token=${projectToken}`);
      const data = await r.json();
      if (!data.ok) return;
      setProject(data.project);
      setItems(data.items || []);
      setEstimates(data.estimates || []);
      setChatId(data.chat?.id || null);
      setMessages(data.messages || []);
      setProjectId(data.project.id);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectToken]);

  const loadExtras = useCallback(async (pid: number) => {
    const [bR, rfR, doR, paR, tmplR] = await Promise.allSettled([
      fetch(`${CRM_API}?action=brief&project_id=${pid}`),
      fetch(`${CRM_API}?action=references&project_id=${pid}`),
      fetch(`${CRM_API}?action=documents&project_id=${pid}`),
      fetch(`${CRM_API}?action=payments&project_id=${pid}`),
      fetch(`${SETTINGS_API}?action=brief_template`),
    ]);
    if (bR.status === "fulfilled") { const d = await bR.value.json(); if (d.ok && d.brief) { setBrief(d.brief); setClientComment(d.brief.client_comment || ""); } }
    if (rfR.status === "fulfilled") { const d = await rfR.value.json(); if (d.ok) setReferences(d.references || []); }
    if (doR.status === "fulfilled") { const d = await doR.value.json(); if (d.ok) setDocuments(d.documents || []); }
    if (paR.status === "fulfilled") { const d = await paR.value.json(); if (d.ok) { setPayments(d.payments || []); setPayTotal(d.total || 0); setPayPaid(d.paid || 0); } }
    if (tmplR.status === "fulfilled") {
      const d = await tmplR.value.json();
      if (d.ok && d.template) {
        const fields = typeof d.template.fields === "string" ? JSON.parse(d.template.fields) : d.template.fields;
        if (fields?.length) setBriefTemplate(fields.filter((f: BriefField) => f.enabled));
        if (d.template.intro) setBriefIntro(d.template.intro);
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (projectId) loadExtras(projectId); }, [projectId, loadExtras]);
  useEffect(() => { if (tab === "chat") { const t = setInterval(() => load(true), 8000); return () => clearInterval(t); } }, [tab, load]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !chatId || sending) return;
    const text = input.trim(); setInput(""); setSending(true);
    const opt: ChatMessage = { id: -Date.now(), author_name: session.name, author_role: "client", text, created_at: new Date().toISOString() };
    setMessages(p => [...p, opt]);
    try {
      await fetch(`${CRM_API}?action=client_view&token=${projectToken}&sub=message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author_name: session.name }),
      });
      load(true);
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const saveComment = async () => {
    if (!projectId) return;
    setSavingComment(true);
    try {
      await fetch(`${CRM_API}?action=brief&project_id=${projectId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, client_comment: clientComment }),
      });
    } catch { /* ignore */ } finally { setSavingComment(false); }
  };

  const uploadFile = async (file: File, action: string, extraFields: Record<string, string>) => {
    const reader = new FileReader();
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      reader.onload = async ev => {
        const base64 = (ev.target?.result as string).split(",")[1];
        try {
          const r = await fetch(`${CRM_API}?action=${action}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: projectId, file: base64, mime: file.type, ...extraFields }),
          });
          resolve(await r.json());
        } catch (e) { reject(e); }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !projectId) return;
    setUploadingRef(true);
    try {
      const data = await uploadFile(file, "references", { uploaded_by: "client" }) as { ok: boolean; reference: Reference };
      if (data.ok) setReferences(p => [...p, data.reference]);
    } catch { /* ignore */ } finally { setUploadingRef(false); }
    e.target.value = "";
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !projectId) return;
    setUploadingDoc(true);
    try {
      const data = await uploadFile(file, "documents", { name: file.name, uploaded_by: "client", doc_type: "other" }) as { ok: boolean; document: ProjectDoc };
      if (data.ok) setDocuments(p => [...p, data.document]);
    } catch { /* ignore */ } finally { setUploadingDoc(false); }
    e.target.value = "";
  };

  const signDoc = async (docId: number) => {
    if (!projectId) return;
    await fetch(`${CRM_API}?action=documents`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, action: "sign", id: docId }),
    });
    setDocuments(p => p.map(d => d.id === docId ? { ...d, is_signed: true } : d));
  };

  const estimateItems = estimates.flatMap(e => e.items);
  const allItems = estimateItems.length > 0 ? estimateItems : items;
  const subtotal = allItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);
  const disc = project ? subtotal * (Number(project.discount_percent) || 0) / 100 : 0;
  const afterDisc = subtotal - disc;
  const vatRate = project?.vat_rate || 20;
  const vatMode = project?.vat_mode || "none";
  const vatAmt = vatMode === "added" ? afterDisc * vatRate / 100 : vatMode === "included" ? afterDisc - afterDisc / (1 + vatRate / 100) : 0;
  const total = vatMode === "added" ? afterDisc + vatAmt : afterDisc;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  const st = STATUS_LABELS[project?.status || "draft"] || STATUS_LABELS.draft;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <Icon name="Building2" size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none truncate max-w-[180px]">{project?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{session.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.color}`}>{st.label}</span>
            <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 ml-1">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {project && (
          <ClientDashboardTabs
            tab={tab}
            setTab={setTab}
            project={project}
            allItems={allItems}
            estimates={estimates}
            disc={disc}
            vatMode={vatMode}
            vatRate={vatRate}
            vatAmt={vatAmt}
            total={total}
            payments={payments}
            payTotal={payTotal}
            payPaid={payPaid}
            messages={messages}
            input={input}
            setInput={setInput}
            sending={sending}
            onSendMsg={sendMsg}
            chatBottomRef={chatBottomRef}
            sessionName={session.name}
            documents={documents}
            uploadingDoc={uploadingDoc}
            onDocUpload={handleDocUpload}
            onSignDoc={signDoc}
            brief={brief}
            briefTemplate={briefTemplate}
            briefIntro={briefIntro}
            clientComment={clientComment}
            setClientComment={setClientComment}
            savingComment={savingComment}
            onSaveComment={saveComment}
            references={references}
            uploadingRef={uploadingRef}
            onRefUpload={handleRefUpload}
          />
        )}
      </div>
    </div>
  );
}