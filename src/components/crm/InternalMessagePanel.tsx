import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { InternalChat } from "./chats.types";
import { getAuthHeaders } from "@/lib/designerAuth";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

interface DbMessage {
  id: number;
  chat_id: number;
  from_me: boolean;
  text: string;
  created_at: string;
}

interface Props {
  activeInternal: InternalChat;
}

export default function InternalMessagePanel({ activeInternal }: Props) {
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getOrCreateChat = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=internal_chat_get_or_create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          participant_name: activeInternal.name,
          participant_initials: activeInternal.initials,
          participant_avatar: activeInternal.avatar_url || "",
        }),
      });
      const data = await r.json();
      if (data.ok) return data.chat.id as number;
    } catch { /* ignore */ }
    return null;
  }, [activeInternal.name, activeInternal.initials, activeInternal.avatar_url]);

  const loadMessages = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=internal_messages&chat_id=${id}`, { headers: { ...getAuthHeaders() } });
      const data = await r.json();
      if (data.ok) setMessages(data.messages || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setChatId(null);
    let active = true;
    (async () => {
      const id = await getOrCreateChat();
      if (!active || !id) return;
      setChatId(id);
      await loadMessages(id);
    })();
    return () => { active = false; };
  }, [activeInternal.name, getOrCreateChat, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId || sending) return;
    setInput("");
    setSending(true);

    const optimistic: DbMessage = {
      id: -Date.now(),
      chat_id: chatId,
      from_me: true,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const r = await fetch(`${API}?action=internal_message_send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ chat_id: chatId, text, from_me: true }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInput(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  };

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
        {activeInternal.avatar_url ? (
          <img src={activeInternal.avatar_url} alt={activeInternal.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{activeInternal.initials}</span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{activeInternal.name}</p>
          {activeInternal.role && <p className="text-xs text-ink-faint">{activeInternal.role}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-snow/40">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-snow flex items-center justify-center">
              <Icon name="MessageSquare" size={20} className="text-ink-faint" />
            </div>
            <p className="text-sm text-ink-faint">Начните переписку с {activeInternal.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from_me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from_me ? "bg-ink text-white" : "bg-white border border-snow-dark"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.from_me ? "text-white/50" : "text-ink-faint"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Написать ${activeInternal.name}...`}
          className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending || !chatId}
          className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors shrink-0 disabled:opacity-40"
        >
          {sending
            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icon name="Send" size={14} className="text-white" />
          }
        </button>
      </div>
    </>
  );
}