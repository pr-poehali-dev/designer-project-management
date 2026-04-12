import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const AVITO_API = "https://functions.poehali.dev/976899aa-03a4-4f5c-9700-e57aa8f2113a";

interface AvitoUser {
  id: number;
  name: string;
}

interface AvitoChat {
  id: string;
  context?: { value?: { title?: string; url?: string } };
  users: AvitoUser[];
  last_message?: { content?: { text?: { text?: string } }; created?: number };
  unread_messages_count?: number;
  updated?: number;
}

interface AvitoMessage {
  id: string;
  author_id: number;
  content?: { text?: { text?: string } };
  created?: number;
}

const INTERNAL_CHATS = [
  { id: "int1", name: "Алексей Иванов", role: "Senior Designer", initials: "АИ", lastMsg: "Макет готов, проверь", messages: [{ from: "them", text: "Макет готов, проверь", time: "09:00" }, { from: "me", text: "Окей, смотрю", time: "09:05" }] },
  { id: "int2", name: "Мария Соколова", role: "UI/UX", initials: "МС", lastMsg: "Завтра встреча с клиентом", messages: [{ from: "them", text: "Завтра встреча с клиентом в 12:00", time: "вчера" }] },
];

export default function ChatsPage() {
  const [tab, setTab] = useState<"avito" | "internal">("avito");
  const [avitoChats, setAvitoChats] = useState<AvitoChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState("");
  const [activeAvito, setActiveAvito] = useState<AvitoChat | null>(null);
  const [activeInternal, setActiveInternal] = useState(INTERNAL_CHATS[0]);
  const [messages, setMessages] = useState<AvitoMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== "avito") return;
    setLoadingChats(true);
    setErrorChats("");
    fetch(`${AVITO_API}?action=chats`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setAvitoChats(data.chats || []);
          setMyUserId(data.user_id);
          if (data.chats?.length > 0) setActiveAvito(data.chats[0]);
        } else {
          setErrorChats(data.error || "Ошибка загрузки чатов");
        }
      })
      .catch(() => setErrorChats("Нет связи с Авито"))
      .finally(() => setLoadingChats(false));
  }, [tab]);

  useEffect(() => {
    if (!activeAvito) return;
    setLoadingMsgs(true);
    setMessages([]);
    fetch(`${AVITO_API}?action=messages&chat_id=${activeAvito.id}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setMessages(data.messages || []); })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeAvito]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeAvito || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${AVITO_API}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: activeAvito.id, message: input.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setInput("");
        const r2 = await fetch(`${AVITO_API}?action=messages&chat_id=${activeAvito.id}`);
        const d2 = await r2.json();
        if (d2.ok) setMessages(d2.messages || []);
      }
    } finally {
      setSending(false);
    }
  };

  const getChatName = (chat: AvitoChat) =>
    chat.users?.find(u => u.id !== myUserId)?.name || chat.context?.value?.title || "Чат";

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="card-surface rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-72 border-r border-snow-dark flex flex-col shrink-0">
          <div className="flex border-b border-snow-dark">
            <button onClick={() => setTab("avito")}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${tab === "avito" ? "text-ink border-b-2 border-ink" : "text-ink-faint"}`}>
              Авито
            </button>
            <button onClick={() => setTab("internal")}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${tab === "internal" ? "text-ink border-b-2 border-ink" : "text-ink-faint"}`}>
              Команда
            </button>
          </div>

          <div className="p-3 border-b border-snow-dark">
            <div className="flex items-center gap-2 bg-snow rounded-full px-3 py-2">
              <Icon name="Search" size={13} className="text-ink-faint" />
              <input placeholder="Поиск..." className="bg-transparent text-xs placeholder:text-ink-faint focus:outline-none w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "avito" && (
              <>
                {loadingChats && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                    <p className="text-xs text-ink-faint">Загружаю чаты...</p>
                  </div>
                )}
                {errorChats && <p className="p-4 text-xs text-red-500 text-center">{errorChats}</p>}
                {!loadingChats && !errorChats && avitoChats.length === 0 && (
                  <p className="p-4 text-xs text-ink-faint text-center">Чатов нет</p>
                )}
                {avitoChats.map(chat => (
                  <button key={chat.id} onClick={() => setActiveAvito(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${activeAvito?.id === chat.id ? "bg-snow" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center shrink-0 text-white text-xs font-bold">
                      {getInitials(getChatName(chat))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{getChatName(chat)}</span>
                        <span className="text-[10px] text-ink-faint shrink-0 ml-1">{formatTime(chat.updated)}</span>
                      </div>
                      <p className="text-xs text-ink-faint truncate mt-0.5">
                        {chat.last_message?.content?.text?.text || "Нет сообщений"}
                      </p>
                    </div>
                    {(chat.unread_messages_count ?? 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {chat.unread_messages_count}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
            {tab === "internal" && INTERNAL_CHATS.map(chat => (
              <button key={chat.id} onClick={() => setActiveInternal(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-snow/80 border-b border-snow-dark/50 transition-colors text-left ${activeInternal.id === chat.id ? "bg-snow" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center shrink-0 text-white text-xs font-bold">{chat.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.name}</p>
                  <p className="text-xs text-ink-faint truncate">{chat.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {tab === "avito" && activeAvito ? (
            <>
              <div className="flex items-center justify-between px-5 h-14 border-b border-snow-dark shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{getInitials(getChatName(activeAvito))}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getChatName(activeAvito)}</p>
                    {activeAvito.context?.value?.title && (
                      <p className="text-[10px] text-ink-faint truncate max-w-[220px]">{activeAvito.context.value.title}</p>
                    )}
                  </div>
                </div>
                {activeAvito.context?.value?.url && (
                  <a href={activeAvito.context.value.url} target="_blank" rel="noreferrer"
                    className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 transition-colors">
                    Объявление <Icon name="ExternalLink" size={12} />
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-snow/30">
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  </div>
                )}
                {!loadingMsgs && messages.map(msg => {
                  const isMe = msg.author_id === myUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe ? "bg-ink text-white" : "bg-white border border-snow-dark"}`}>
                        <p className="text-sm leading-relaxed">{msg.content?.text?.text || "[вложение]"}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/50" : "text-ink-faint"}`}>{formatTime(msg.created)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Написать в Авито..."
                  className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors" />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors disabled:opacity-40">
                  {sending
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <Icon name="Send" size={14} className="text-white" />}
                </button>
              </div>
            </>
          ) : tab === "avito" ? (
            <div className="flex-1 flex items-center justify-center text-ink-faint text-sm">
              {loadingChats ? "" : "Выберите чат"}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0">
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{activeInternal.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{activeInternal.name}</p>
                  <p className="text-xs text-ink-faint">{activeInternal.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-snow/30">
                {activeInternal.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.from === "me" ? "bg-ink text-white" : "bg-white border border-snow-dark"}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.from === "me" ? "text-white/50" : "text-ink-faint"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
                <input placeholder="Написать коллеге..."
                  className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors" />
                <button className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors">
                  <Icon name="Send" size={14} className="text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
