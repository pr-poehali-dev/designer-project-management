import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface ProjectData {
  id: number; name: string; status: string; deadline: string;
  discount_percent: number; vat_mode: string; vat_rate: number;
  client_name: string; contact_person: string;
}
interface WorkItem { id: number; name: string; quantity: number; unit: string; price: number; }
interface Estimate { id: number; name: string; discount_percent: number; vat_mode: string; vat_rate: number; items: WorkItem[]; }
interface ChatMessage { id: number; author_name: string; author_role: string; text: string; created_at: string; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:  { label: "Черновик",  color: "bg-gray-100 text-gray-600" },
  active: { label: "В работе",  color: "bg-blue-50 text-blue-600" },
  done:   { label: "Завершён",  color: "bg-green-50 text-green-600" },
  paused: { label: "Пауза",     color: "bg-amber-50 text-amber-600" },
};

function EstimateBlock({ items, discountPercent, vatMode, vatRate }: {
  items: WorkItem[]; discountPercent: number; vatMode: string; vatRate: number;
}) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = subtotal * (discountPercent || 0) / 100;
  const afterDiscount = subtotal - discount;
  const vatAmt = vatMode === "added" ? afterDiscount * (vatRate || 20) / 100
    : vatMode === "included" ? afterDiscount - afterDiscount / (1 + (vatRate || 20) / 100) : 0;
  const total = vatMode === "added" ? afterDiscount + vatAmt : afterDiscount;

  if (items.length === 0) return (
    <div className="text-center py-8 text-sm text-gray-400">Позиции не добавлены</div>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs text-gray-400 font-medium w-8">#</th>
              <th className="text-left py-3 px-4 text-xs text-gray-400 font-medium">Наименование</th>
              <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium w-20">Кол-во</th>
              <th className="text-center py-3 px-4 text-xs text-gray-400 font-medium w-14">Ед.</th>
              <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium w-28">Цена</th>
              <th className="text-right py-3 px-4 text-xs text-gray-400 font-medium w-28">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 text-xs text-gray-300">{i + 1}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                <td className="py-3 px-4 text-sm text-right text-gray-500 tabular-nums">{item.quantity % 1 === 0 ? item.quantity : item.quantity}</td>
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
        {discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Скидка {discountPercent}%:</span>
            <span className="text-red-500 tabular-nums">−{discount.toLocaleString("ru")} ₽</span>
          </div>
        )}
        {vatMode !== "none" && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>{vatMode === "included" ? `В т.ч. НДС ${vatRate}%` : `НДС ${vatRate}%`}:</span>
            <span className="tabular-nums">{Math.round(vatAmt).toLocaleString("ru")} ₽</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>{vatMode === "added" ? "Итого с НДС:" : "Итого к оплате:"}</span>
          <span className="tabular-nums">{Math.round(total).toLocaleString("ru")} ₽</span>
        </div>
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
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
  const [clientName, setClientName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API}?action=client_view&token=${token}`);
      const data = await r.json();
      if (!data.ok) { setError("Проект не найден или ссылка недействительна"); return; }
      setProject(data.project);
      setItems(data.items || []);
      setEstimates(data.estimates || []);
      setChatId(data.chat?.id || null);
      setMessages(data.messages || []);
      if (!clientName && data.project.contact_person) setClientName(data.project.contact_person);
    } catch { setError("Ошибка загрузки"); } finally { setLoading(false); }
  }, [token, clientName]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "chat") { const t = setInterval(() => load(true), 8000); return () => clearInterval(t); } }, [tab, load]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || sending) return;
    const text = input.trim();
    const name = clientName.trim() || "Клиент";
    setInput("");
    setSending(true);
    const optimistic: ChatMessage = {
      id: -Date.now(), author_name: name, author_role: "client",
      text, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await fetch(`${API}?action=client_view&token=${token}&sub=message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author_name: name }),
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
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="LinkOff" size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Ссылка недействительна</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  const st = STATUS_LABELS[project?.status || "draft"] || STATUS_LABELS.draft;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Проект</p>
              <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
              {project?.client_name && (
                <p className="text-sm text-gray-500 mt-1">{project.client_name}</p>
              )}
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${st.color}`}>
              {st.label}
            </span>
          </div>
          {project?.deadline && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
              <Icon name="Calendar" size={13} />
              Срок: {new Date(project.deadline).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4">
          <button onClick={() => setTab("estimate")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${tab === "estimate" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name="Calculator" size={15} /> Смета
          </button>
          <button onClick={() => setTab("chat")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${tab === "chat" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name="MessageSquare" size={15} /> Чат
          </button>
        </div>

        {/* Estimate tab */}
        {tab === "estimate" && (
          <div className="space-y-4">
            {/* Main estimate */}
            {items.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <Icon name="Calculator" size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">Основная смета</span>
                </div>
                <EstimateBlock
                  items={items}
                  discountPercent={project?.discount_percent || 0}
                  vatMode={project?.vat_mode || "none"}
                  vatRate={project?.vat_rate || 20}
                />
              </div>
            )}

            {/* Additional estimates */}
            {estimates.map(est => est.items.length > 0 && (
              <div key={est.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <Icon name="Calculator" size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">{est.name}</span>
                </div>
                <EstimateBlock
                  items={est.items}
                  discountPercent={est.discount_percent || 0}
                  vatMode={est.vat_mode || project?.vat_mode || "none"}
                  vatRate={est.vat_rate || project?.vat_rate || 20}
                />
              </div>
            ))}

            {items.length === 0 && estimates.every(e => e.items.length === 0) && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Icon name="Calculator" size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Смета ещё не сформирована</p>
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {tab === "chat" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {!chatId ? (
              <div className="p-12 text-center">
                <Icon name="MessageSquare" size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Чат ещё не открыт</p>
              </div>
            ) : (
              <>
                {/* Name input if not set */}
                {!clientName && (
                  <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                    <Icon name="User" size={14} className="text-amber-500 shrink-0" />
                    <input value={clientName} onChange={e => setClientName(e.target.value)}
                      placeholder="Введите ваше имя для чата..."
                      className="flex-1 bg-transparent text-sm text-amber-800 placeholder:text-amber-400 focus:outline-none" />
                  </div>
                )}

                {/* Messages */}
                <div className="p-4 space-y-3 min-h-64 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <Icon name="MessageSquare" size={28} className="text-gray-200" />
                      <p className="text-sm text-gray-400">Начните общение</p>
                    </div>
                  ) : messages.map(msg => {
                    const isClient = msg.author_role === "client";
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isClient ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 ${isClient ? "bg-gray-800" : "bg-blue-500"}`}>
                          {msg.author_name.split(" ").map(w => w[0]).slice(0, 1).join("").toUpperCase() || "?"}
                        </div>
                        <div className={`max-w-[75%] ${isClient ? "items-end" : "items-start"} flex flex-col`}>
                          <span className={`text-[10px] text-gray-400 mb-1 ${isClient ? "text-right" : ""}`}>{msg.author_name}</span>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isClient ? "bg-gray-900 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"} ${msg.id < 0 ? "opacity-60" : ""}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-gray-300 mt-1 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Написать сообщение..."
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder:text-gray-300" />
                  <button onClick={sendMessage} disabled={sending || !input.trim()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${input.trim() ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-300"}`}>
                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Send" size={16} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">Клиентский портал проекта</p>
      </div>
    </div>
  );
}
