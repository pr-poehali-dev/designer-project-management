import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface Member {
  id: number; name: string; role: string; color: string;
}
interface Message {
  id: number; chat_id: number; member_id: number | null;
  author_name: string; author_role: string; text: string; created_at: string;
}
interface ChatData {
  id: number; project_id: number;
}

const MEMBER_COLORS = [
  "#6366F1", "#0EA5E9", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

const ROLE_LABELS: Record<string, string> = {
  manager: "Менеджер", client: "Клиент", designer: "Дизайнер",
  developer: "Разработчик", member: "Участник",
};

export default function ProjectChat({ projectId, projectName }: {
  projectId: number; projectName: string;
}) {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "manager" });
  const [addingMember, setAddingMember] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API}?action=project_chat&project_id=${projectId}`);
      const data = await r.json();
      if (data.ok) {
        setChat(data.chat);
        setMembers(data.members || []);
        setMessages(prev => {
          const newMsgs: Message[] = data.messages || [];
          if (JSON.stringify(prev.map(m => m.id)) === JSON.stringify(newMsgs.map(m => m.id))) return prev;
          return newMsgs;
        });
        if (data.members?.length > 0 && !activeMember) {
          const mgr = data.members.find((m: Member) => m.role === "manager") || data.members[0];
          setActiveMember(mgr);
        }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId, activeMember]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 10_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !chat || sending || !activeMember) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Message = {
      id: -Date.now(), chat_id: chat.id, member_id: activeMember.id,
      author_name: activeMember.name, author_role: activeMember.role,
      text, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const r = await fetch(`${API}?action=project_chat&sub=message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat.id, text,
          author_name: activeMember.name,
          author_role: activeMember.role,
          member_id: activeMember.id,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m));
      }
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const addMember = async () => {
    if (!chat || !newMember.name.trim() || addingMember) return;
    setAddingMember(true);
    try {
      const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
      const r = await fetch(`${API}?action=project_chat&sub=member`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat.id, name: newMember.name, role: newMember.role, color }),
      });
      const data = await r.json();
      if (data.ok) {
        setMembers(prev => [...prev, data.member]);
        setNewMember({ name: "", role: "manager" });
        setShowAddMember(false);
        if (!activeMember) setActiveMember(data.member);
      }
    } catch { /* ignore */ } finally { setAddingMember(false); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" }) + " " +
        d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const getMember = (msg: Message) =>
    members.find(m => m.id === msg.member_id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}>
      {/* Левая панель — участники */}
      <div className="w-56 shrink-0 flex flex-col gap-3">
        <div className="card-surface rounded-2xl p-4 flex flex-col gap-3 flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Участники</span>
            <button onClick={() => setShowAddMember(!showAddMember)}
              className="w-6 h-6 rounded-full bg-snow hover:bg-snow-dark flex items-center justify-center transition-colors">
              <Icon name="Plus" size={12} className="text-ink-muted" />
            </button>
          </div>

          {showAddMember && (
            <div className="space-y-2 pb-2 border-b border-snow-dark animate-fade-in">
              <input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addMember()}
                placeholder="Имя..." autoFocus
                className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
              <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-snow border border-snow-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={addMember} disabled={addingMember || !newMember.name.trim()}
                className="w-full py-1.5 bg-ink text-white text-xs font-medium rounded-lg hover:bg-ink-light transition-colors disabled:opacity-40">
                {addingMember ? "..." : "Добавить"}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {members.length === 0 ? (
              <p className="text-xs text-ink-faint text-center py-4">Нет участников</p>
            ) : members.map(m => (
              <button key={m.id} onClick={() => setActiveMember(m)}
                className={`w-full flex items-center gap-2 p-2 rounded-xl transition-all text-left ${activeMember?.id === m.id ? "bg-ink/5 ring-1 ring-ink/10" : "hover:bg-snow"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: m.color }}>
                  {getInitials(m.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-ink-faint">{ROLE_LABELS[m.role] || m.role}</p>
                </div>
                {activeMember?.id === m.id && (
                  <Icon name="Check" size={12} className="text-ink shrink-0 ml-auto" />
                )}
              </button>
            ))}
          </div>

          {activeMember && (
            <div className="pt-2 border-t border-snow-dark">
              <p className="text-[10px] text-ink-faint mb-1">Пишу от имени:</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: activeMember.color }}>
                  {getInitials(activeMember.name)}
                </div>
                <span className="text-xs font-medium truncate">{activeMember.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col card-surface rounded-2xl overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-snow-dark shrink-0">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <Icon name="MessageSquare" size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{projectName}</p>
            <p className="text-[10px] text-ink-faint">{members.length} участников</p>
          </div>
          <div className="flex -space-x-1.5">
            {members.slice(0, 4).map(m => (
              <div key={m.id} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold ring-2 ring-white"
                style={{ backgroundColor: m.color }}>
                {getInitials(m.name)}
              </div>
            ))}
          </div>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-snow flex items-center justify-center">
                <Icon name="MessageSquare" size={24} className="text-ink-faint" />
              </div>
              <div>
                <p className="text-sm font-medium">Начните общение по проекту</p>
                <p className="text-xs text-ink-faint mt-1">Все участники видят переписку в реальном времени</p>
              </div>
            </div>
          ) : messages.map((msg, i) => {
            const member = getMember(msg);
            const color = member?.color || "#999";
            const isManager = msg.author_role === "manager";
            const prevMsg = messages[i - 1];
            const sameAuthor = prevMsg && prevMsg.member_id === msg.member_id &&
              new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60000;

            return (
              <div key={msg.id} className={`flex gap-3 ${isManager ? "flex-row-reverse" : ""}`}>
                {!sameAuthor ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: color }}>
                    {getInitials(msg.author_name)}
                  </div>
                ) : <div className="w-8 shrink-0" />}

                <div className={`max-w-[72%] ${isManager ? "items-end" : "items-start"} flex flex-col`}>
                  {!sameAuthor && (
                    <div className={`flex items-center gap-2 mb-1 ${isManager ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-semibold" style={{ color }}>{msg.author_name}</span>
                      <span className="text-[10px] text-ink-faint">{ROLE_LABELS[msg.author_role] || msg.author_role}</span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isManager
                      ? "bg-ink text-white rounded-tr-sm"
                      : "bg-snow text-ink rounded-tl-sm"
                  } ${msg.id < 0 ? "opacity-60" : ""}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-ink-faint mt-1 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Инпут */}
        <div className="px-4 py-3 border-t border-snow-dark shrink-0">
          {!activeMember ? (
            <p className="text-xs text-ink-faint text-center py-2">Выберите участника слева чтобы написать</p>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1 flex items-center gap-2 bg-snow rounded-xl px-4 py-2.5 min-h-[44px]">
                <input value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Сообщение от ${activeMember.name}...`}
                  className="flex-1 bg-transparent text-sm placeholder:text-ink-faint focus:outline-none" />
              </div>
              <button onClick={send} disabled={sending || !input.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${input.trim() ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint"}`}>
                {sending
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Icon name="Send" size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
