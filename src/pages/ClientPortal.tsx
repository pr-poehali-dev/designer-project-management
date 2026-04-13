import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_API = "https://functions.poehali.dev/6939c14f-545b-476e-9041-fb66c4517ab0";
const CRM_API  = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

const SESSION_KEY = "client_session";

interface Session {
  token: string;
  name: string;
  client_id: number;
}

// ─────────────────────────────────────────────
// Экран входа / регистрации
// ─────────────────────────────────────────────
function ClientLoginScreen({ projectToken, onAuth }: { projectToken: string; onAuth: (s: Session) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== passwordConfirm) {
      setError("Пароли не совпадают"); return;
    }
    if (password.length < 6) {
      setError("Пароль минимум 6 символов"); return;
    }
    setLoading(true);
    try {
      const action = mode === "register" ? "register" : "login";
      const body: Record<string, string> = { project_token: projectToken, email, password };
      if (mode === "register" && name) body.name = name;
      const r = await fetch(`${AUTH_API}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error || "Ошибка"); return; }
      const session: Session = { token: data.token, name: data.name, client_id: data.client_id };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onAuth(session);
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
            <button onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              Войти
            </button>
            <button onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              Регистрация
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Ваше имя</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">Повторите пароль</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gray-900 text-white font-medium text-sm rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Личный кабинет клиента
// ─────────────────────────────────────────────
interface ProjectData {
  id: number; name: string; status: string; deadline: string;
  discount_percent: number; vat_mode: string; vat_rate: number;
  client_name: string; contact_person: string;
}
interface WorkItem { id: number; name: string; quantity: number; unit: string; price: number; }
interface Estimate { id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number; items: WorkItem[]; }
interface ChatMessage { id: number; author_name: string; author_role: string; text: string; created_at: string; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:  { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  active: { label: "В работе", color: "bg-blue-50 text-blue-600" },
  done:   { label: "Завершён", color: "bg-green-50 text-green-600" },
  paused: { label: "Пауза",    color: "bg-amber-50 text-amber-600" },
};

const NAV = [
  { id: "estimate", label: "Смета", icon: "FileText" },
  { id: "chat",     label: "Чат",   icon: "MessageSquare" },
];

function ClientDashboard({ session, projectToken, onLogout }: {
  session: Session; projectToken: string; onLogout: () => void;
}) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"estimate" | "chat">("estimate");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!projectToken) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${CRM_API}?action=client_view&token=${projectToken}`);
      const data = await r.json();
      if (!data.ok) { setError("Проект не найден"); return; }
      setProject(data.project);
      setItems(data.items || []);
      setEstimates(data.estimates || []);
      setChatId(data.chat?.id || null);
      setMessages(data.messages || []);
    } catch { setError("Ошибка загрузки"); } finally { setLoading(false); }
  }, [projectToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab === "chat") {
      const t = setInterval(() => load(true), 8000);
      return () => clearInterval(t);
    }
  }, [tab, load]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const optimistic: ChatMessage = {
      id: -Date.now(), author_name: session.name, author_role: "client",
      text, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await fetch(`${CRM_API}?action=client_view&token=${projectToken}&sub=message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author_name: session.name }),
      });
      load(true);
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" }) + " " +
        d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <Icon name="LinkOff" size={32} className="text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  const st = STATUS_LABELS[project?.status || "draft"] || STATUS_LABELS.draft;
  const allItems = estimates.length > 0
    ? estimates.flatMap(e => e.items)
    : items;
  const subtotal = allItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const disc = project ? subtotal * (project.discount_percent || 0) / 100 : 0;
  const afterDisc = subtotal - disc;
  const vatRate = project?.vat_rate || 20;
  const vatMode = project?.vat_mode || "none";
  const vatAmt = vatMode === "added" ? afterDisc * vatRate / 100
    : vatMode === "included" ? afterDisc - afterDisc / (1 + vatRate / 100) : 0;
  const total = vatMode === "added" ? afterDisc + vatAmt : afterDisc;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Icon name="Building2" size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">{project?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{session.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.color}`}>{st.label}</span>
            <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Стоимость проекта</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(total).toLocaleString("ru")} ₽</p>
            {disc > 0 && <p className="text-xs text-green-600 mt-0.5">Скидка {project?.discount_percent}%</p>}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Срок</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString("ru", { day: "numeric", month: "long" }) : "—"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id as "estimate" | "chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-sm transition-colors ${
                tab === n.id ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              <Icon name={n.icon} size={15} />
              {n.label}
            </button>
          ))}
        </div>

        {/* Estimate */}
        {tab === "estimate" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {allItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Смета ещё не сформирована</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs text-gray-400 font-medium">#</th>
                        <th className="text-left py-3 px-4 text-xs text-gray-400 font-medium">Наименование</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium">Кол-во</th>
                        <th className="text-center py-3 px-4 text-xs text-gray-400 font-medium">Ед.</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium">Цена</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allItems.map((item, i) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-xs text-gray-300">{i + 1}</td>
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
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Итого:</span>
                    <span className="tabular-nums">{subtotal.toLocaleString("ru")} ₽</span>
                  </div>
                  {disc > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Скидка {project?.discount_percent}%:</span>
                      <span className="text-red-500 tabular-nums">−{Math.round(disc).toLocaleString("ru")} ₽</span>
                    </div>
                  )}
                  {vatMode !== "none" && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{vatMode === "included" ? `В т.ч. НДС ${vatRate}%` : `НДС ${vatRate}%`}:</span>
                      <span className="tabular-nums">{Math.round(vatAmt).toLocaleString("ru")} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Итого к оплате:</span>
                    <span className="tabular-nums">{Math.round(total).toLocaleString("ru")} ₽</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Chat */}
        {tab === "chat" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 400 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon name="MessageSquare" size={28} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Напишите вашему дизайнеру</p>
                </div>
              ) : messages.map(msg => {
                const isMe = msg.author_role === "client";
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">
                        {msg.author_name?.charAt(0) || "Д"}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                      {!isMe && <p className="text-[10px] font-medium mb-1 opacity-60">{msg.author_name}</p>}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/40" : "text-gray-400"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Написать дизайнеру..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0">
                {sending
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Icon name="Send" size={14} className="text-white" />
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Главный компонент — роутер кабинета
// ─────────────────────────────────────────────
export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [validating, setValidating] = useState(true);

  // При наличии сессии — проверяем её актуальность
  useEffect(() => {
    if (!session) { setValidating(false); return; }
    (async () => {
      try {
        const r = await fetch(`${AUTH_API}?action=me`, {
          headers: { "X-Client-Token": session.token },
        });
        const data = await r.json();
        if (!data.ok) {
          sessionStorage.removeItem(SESSION_KEY);
          setSession(null);
        }
      } catch { /* ignore, оставляем сессию */ } finally {
        setValidating(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuth = (s: Session) => setSession(s);
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (validating) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <Icon name="LinkOff" size={32} className="text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Ссылка недействительна</p>
      </div>
    </div>
  );

  if (!session) return <ClientLoginScreen projectToken={token} onAuth={handleAuth} />;

  return <ClientDashboard session={session} projectToken={token} onLogout={handleLogout} />;
}
