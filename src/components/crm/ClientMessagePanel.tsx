import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface ClientMsg {
  id: number;
  client_id: number;
  from_me: boolean;
  text: string;
  is_read: boolean;
  created_at: string;
}

interface ClientItem {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  unread: number;
  last_message: string | null;
  last_message_at: string | null;
}

interface Props {
  activeClient: ClientItem;
}

export default function ClientMessagePanel({ activeClient }: Props) {
  const [messages, setMessages] = useState<ClientMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=client_messages&client_id=${id}`);
      const data = await r.json();
      if (data.ok) setMessages(data.messages || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setMessages([]);
    setInput("");
    load(activeClient.id);
  }, [activeClient.id, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const optimistic: ClientMsg = {
      id: -Date.now(),
      client_id: activeClient.id,
      from_me: true,
      text,
      is_read: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const r = await fetch(`${API}?action=client_messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: activeClient.id, text, from_me: true }),
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
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const initials = (name: string) =>
    name ? name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials(activeClient.contact_person || activeClient.name)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{activeClient.name}</p>
          {activeClient.contact_person && activeClient.contact_person !== activeClient.name && (
            <p className="text-xs text-ink-faint">{activeClient.contact_person} · {activeClient.phone}</p>
          )}
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
            <div>
              <p className="text-sm font-medium text-ink">{activeClient.name}</p>
              <p className="text-xs text-ink-faint mt-1">Напишите первым</p>
            </div>
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
          placeholder={`Написать ${activeClient.name}...`}
          className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
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
