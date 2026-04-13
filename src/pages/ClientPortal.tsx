import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_API = "https://functions.poehali.dev/6939c14f-545b-476e-9041-fb66c4517ab0";
const CRM_API  = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";
const SESSION_KEY = "client_session";

interface Session { token: string; name: string; client_id: number; }

// ─── Login ────────────────────────────────────────────────────────────────────
function ClientLoginScreen({ projectToken, onAuth }: { projectToken: string; onAuth: (s: Session) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) { setError("Пароли не совпадают"); return; }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      const b: Record<string, string> = { project_token: projectToken, email, password };
      if (mode === "register" && name) b.name = name;
      const r = await fetch(`${AUTH_API}?action=${mode === "register" ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error || "Ошибка"); return; }
      const s: Session = { token: data.token, name: data.name, client_id: data.client_id };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      onAuth(s);
    } catch { setError("Ошибка сети"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <Icon name="Building2" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-sm text-gray-500 mt-1">Войдите или создайте аккаунт</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Ваше имя</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Повторите пароль</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gray-900 text-white font-medium text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProjectData { id: number; name: string; status: string; deadline: string; discount_percent: number; vat_mode: string; vat_rate: number; client_name: string; contact_person: string; }
interface WorkItem { id: number; name: string; quantity: number; unit: string; price: number; }
interface Estimate { id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number; items: WorkItem[]; }
interface ChatMessage { id: number; author_name: string; author_role: string; text: string; created_at: string; }
interface Brief { style: string; area: number; budget: number; rooms: string; wishes: string; color_palette: string; furniture: string; restrictions: string; extra: string; client_comment: string; }
interface Reference { id: number; url: string; caption: string; uploaded_by: string; }
interface ProjectDoc { id: number; name: string; url: string; doc_type: string; uploaded_by: string; is_signed: boolean; created_at: string; }
interface Payment { id: number; amount: number; label: string; is_paid: boolean; paid_at: string | null; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:  { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-600" },
  done:   { label: "Завершён", color: "bg-green-50 text-green-600" },
  paused: { label: "Пауза",    color: "bg-amber-50 text-amber-600" },
};

const NAV_TABS = [
  { id: "estimate",   label: "Смета",     icon: "FileText" },
  { id: "finance",    label: "Финансы",   icon: "CreditCard" },
  { id: "chat",       label: "Чат",       icon: "MessageSquare" },
  { id: "documents",  label: "Документы", icon: "Paperclip" },
  { id: "brief",      label: "Бриф",      icon: "ClipboardList" },
  { id: "references", label: "Референсы", icon: "Images" },
];

const BRIEF_FIELDS = [
  { key: "style",         label: "Стиль" },
  { key: "area",          label: "Площадь (м²)" },
  { key: "budget",        label: "Бюджет (₽)" },
  { key: "rooms",         label: "Комнаты" },
  { key: "color_palette", label: "Цветовая палитра" },
  { key: "furniture",     label: "Мебель" },
  { key: "restrictions",  label: "Ограничения" },
  { key: "wishes",        label: "Пожелания" },
  { key: "extra",         label: "Дополнительно" },
];

const DOC_TYPES: Record<string, string> = { contract: "Договор", act: "Акт", invoice: "Счёт", other: "Документ" };

// ─── Dashboard ────────────────────────────────────────────────────────────────
function ClientDashboard({ session, projectToken, onLogout }: { session: Session; projectToken: string; onLogout: () => void }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
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
  const refInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
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
    const [bR, rfR, doR, paR] = await Promise.allSettled([
      fetch(`${CRM_API}?action=brief&project_id=${pid}`),
      fetch(`${CRM_API}?action=references&project_id=${pid}`),
      fetch(`${CRM_API}?action=documents&project_id=${pid}`),
      fetch(`${CRM_API}?action=payments&project_id=${pid}`),
    ]);
    if (bR.status === "fulfilled") { const d = await bR.value.json(); if (d.ok && d.brief) { setBrief(d.brief); setClientComment(d.brief.client_comment || ""); } }
    if (rfR.status === "fulfilled") { const d = await rfR.value.json(); if (d.ok) setReferences(d.references || []); }
    if (doR.status === "fulfilled") { const d = await doR.value.json(); if (d.ok) setDocuments(d.documents || []); }
    if (paR.status === "fulfilled") { const d = await paR.value.json(); if (d.ok) { setPayments(d.payments || []); setPayTotal(d.total || 0); setPayPaid(d.paid || 0); } }
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

  const fmtTime = (iso: string) => {
    const d = new Date(iso); const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  };

  const allItems = estimates.length > 0 ? estimates.flatMap(e => e.items) : items;
  const subtotal = allItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const disc = project ? subtotal * (project.discount_percent || 0) / 100 : 0;
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

        {/* Nav */}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <div className="flex min-w-max px-2 py-2 gap-1">
            {NAV_TABS.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-medium text-xs transition-colors whitespace-nowrap ${tab === n.id ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon name={n.icon} size={13} />{n.label}
              </button>
            ))}
          </div>
        </div>

        {/* СМЕТА */}
        {tab === "estimate" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {allItems.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Смета ещё не сформирована</div> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      {["#","Наименование","Кол.","Ед.","Цена","Сумма"].map(h => (
                        <th key={h} className={`py-3 px-4 text-xs text-gray-400 font-medium ${h === "Наименование" ? "text-left" : h === "Ед." ? "text-center" : "text-right"}`}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allItems.map((item, i) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-xs text-gray-300">{i+1}</td>
                          <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-500 tabular-nums">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-center text-gray-400">{item.unit}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-500 tabular-nums">{Number(item.price).toLocaleString("ru")} ₽</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-gray-800 tabular-nums">{(item.quantity * item.price).toLocaleString("ru")} ₽</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-4 space-y-2 border-t border-gray-100">
                  {disc > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Скидка {project?.discount_percent}%:</span><span className="text-red-500 tabular-nums">−{Math.round(disc).toLocaleString("ru")} ₽</span></div>}
                  {vatMode !== "none" && <div className="flex justify-between text-sm text-gray-500"><span>{vatMode === "included" ? `В т.ч. НДС ${vatRate}%` : `НДС ${vatRate}%`}:</span><span className="tabular-nums">{Math.round(vatAmt).toLocaleString("ru")} ₽</span></div>}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Итого к оплате:</span><span className="tabular-nums">{Math.round(total).toLocaleString("ru")} ₽</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ФИНАНСЫ */}
        {tab === "finance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Стоимость", val: Math.round(payTotal || total), color: "text-gray-900" },
                { label: "Оплачено",  val: Math.round(payPaid),           color: "text-green-600" },
                { label: "Остаток",   val: Math.round((payTotal || total) - payPaid), color: "text-amber-600" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 tabular-nums ${s.color}`}>{s.val.toLocaleString("ru")} ₽</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {payments.length === 0
                ? <div className="text-center py-10 text-gray-400 text-sm">График платежей не установлен</div>
                : <div className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${p.is_paid ? "bg-green-100" : "bg-gray-100"}`}>
                          <Icon name={p.is_paid ? "CheckCircle" : "Clock"} size={16} className={p.is_paid ? "text-green-600" : "text-gray-400"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{p.label || "Платёж"}</p>
                          {p.paid_at && <p className="text-xs text-gray-400">{fmtTime(p.paid_at)}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold tabular-nums ${p.is_paid ? "text-green-600" : "text-gray-900"}`}>{Number(p.amount).toLocaleString("ru")} ₽</p>
                          <p className={`text-xs ${p.is_paid ? "text-green-500" : "text-amber-500"}`}>{p.is_paid ? "Оплачено" : "Ожидает"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ЧАТ */}
        {tab === "chat" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0
                ? <div className="flex flex-col items-center justify-center h-full text-center"><Icon name="MessageSquare" size={28} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">Напишите вашему дизайнеру</p></div>
                : messages.map(msg => {
                    const isMe = msg.author_role === "client";
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        {!isMe && <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">{msg.author_name?.charAt(0) || "Д"}</div>}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                          {!isMe && <p className="text-[10px] font-medium mb-1 opacity-60">{msg.author_name}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/40" : "text-gray-400"}`}>{fmtTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
              }
              <div ref={chatBottomRef} />
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMsg())}
                placeholder="Написать дизайнеру..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
              <button onClick={sendMsg} disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 shrink-0">
                {sending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Send" size={14} className="text-white" />}
              </button>
            </div>
          </div>
        )}

        {/* ДОКУМЕНТЫ */}
        {tab === "documents" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Документы проекта</p>
              <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40">
                {uploadingDoc ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Icon name="Upload" size={13} />}
                Загрузить
              </button>
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDocUpload} className="hidden" />
            </div>
            {documents.length === 0
              ? <div className="text-center py-10 text-gray-400 text-sm">Документов пока нет</div>
              : <div className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${doc.uploaded_by === "client" ? "bg-blue-50" : "bg-gray-100"}`}>
                        <Icon name="FileText" size={16} className={doc.uploaded_by === "client" ? "text-blue-500" : "text-gray-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{DOC_TYPES[doc.doc_type] || "Документ"} · {fmtTime(doc.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.is_signed
                          ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><Icon name="CheckCircle" size={12} />Подписан</span>
                          : doc.uploaded_by === "designer"
                            ? <button onClick={() => signDoc(doc.id)} className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg">Подписать</button>
                            : null
                        }
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                          <Icon name="Download" size={13} className="text-gray-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* БРИФ */}
        {tab === "brief" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Параметры проекта</p>
                <p className="text-xs text-gray-400 mt-0.5">Заполнено дизайнером</p>
              </div>
              {!brief
                ? <div className="text-center py-10 text-gray-400 text-sm">Бриф ещё не заполнен дизайнером</div>
                : <div className="divide-y divide-gray-50">
                    {BRIEF_FIELDS.filter(f => brief[f.key as keyof Brief]).map(f => (
                      <div key={f.key} className="flex gap-3 px-4 py-3">
                        <p className="text-xs text-gray-400 font-medium w-32 shrink-0 mt-0.5">{f.label}</p>
                        <p className="text-sm text-gray-800">{String(brief[f.key as keyof Brief])}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Ваши комментарии</p>
              <textarea value={clientComment} onChange={e => setClientComment(e.target.value)}
                rows={4} placeholder="Уточнения, пожелания, правки к брифу..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
              <button onClick={saveComment} disabled={savingComment}
                className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                {savingComment && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        )}

        {/* РЕФЕРЕНСЫ */}
        {tab === "references" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Референсы</p>
                <p className="text-xs text-gray-400 mt-0.5">Фото для вдохновения дизайнера</p>
              </div>
              <button onClick={() => refInputRef.current?.click()} disabled={uploadingRef}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50">
                {uploadingRef ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={13} />}
                Добавить
              </button>
              <input ref={refInputRef} type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
            </div>
            {references.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center"><Icon name="Images" size={20} className="text-gray-400" /></div>
                  <div><p className="text-sm font-medium text-gray-600">Добавьте референсы</p><p className="text-xs text-gray-400 mt-1">Фото интерьеров, мебели, цветов</p></div>
                </div>
              : <div className="p-3 grid grid-cols-3 gap-2">
                  {references.map(ref => (
                    <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                      <img src={ref.url} alt="Референс" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
            }
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<Session | null>(() => {
    try { const s = sessionStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    if (!session) { setValidating(false); return; }
    (async () => {
      try {
        const r = await fetch(`${AUTH_API}?action=me`, { headers: { "X-Client-Token": session.token } });
        const data = await r.json();
        if (!data.ok) { sessionStorage.removeItem(SESSION_KEY); setSession(null); }
      } catch { /* ignore */ } finally { setValidating(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (validating) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><Icon name="LinkOff" size={32} className="text-gray-400 mx-auto mb-4" /><p className="text-sm text-gray-500">Ссылка недействительна</p></div>
    </div>
  );

  if (!session) return <ClientLoginScreen projectToken={token} onAuth={s => setSession(s)} />;
  return <ClientDashboard session={session} projectToken={token} onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setSession(null); }} />;
}
