import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AVITO_API = "https://functions.poehali.dev/976899aa-03a4-4f5c-9700-e57aa8f2113a";
const POLL_INTERVAL = 30_000;

interface AvitoUser {
  id: number;
  name: string;
  public_user_profile?: { avatar?: { default?: string } };
}

interface AvitoChat {
  id: string;
  context?: { value?: { title?: string; url?: string; images?: { main?: Record<string, string> } } };
  users: AvitoUser[];
  last_message?: {
    content?: { text?: { text?: string } };
    created?: number;
    author_id?: number;
  };
  unread_messages_count?: number;
  updated?: number;
}

interface AvitoMessage {
  id: string;
  author_id: number;
  content?: { text?: { text?: string }; image?: { sizes?: Record<string, string> } };
  created?: number;
  type?: string;
  isOptimistic?: boolean;
}

const INTERNAL_CHATS = [
  {
    id: "int1", name: "Алексей Иванов", role: "Senior Designer", initials: "АИ",
    lastMsg: "Макет готов, проверь",
    messages: [
      { from: "them", text: "Макет готов, проверь пожалуйста", time: "09:00" },
      { from: "me", text: "Окей, смотрю сейчас", time: "09:05" },
    ]
  },
  {
    id: "int2", name: "Мария Соколова", role: "UI/UX Designer", initials: "МС",
    lastMsg: "Завтра встреча с клиентом",
    messages: [
      { from: "them", text: "Завтра встреча с клиентом в 12:00", time: "вчера" },
    ]
  },
];

export default function ChatsPage() {
  const [tab, setTab] = useState<"avito" | "internal">("avito");

  // Avito state
  const [chats, setChats] = useState<AvitoChat[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState("");
  const [activeChat, setActiveChat] = useState<AvitoChat | null>(null);
  const [messages, setMessages] = useState<AvitoMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Internal state
  const [activeInternal, setActiveInternal] = useState(INTERNAL_CHATS[0]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load chats ───────────────────────────────────────────────
  const loadChats = useCallback(async (silent = false) => {
    if (!silent) setLoadingChats(true);
    setErrorChats("");
    try {
      const r = await fetch(`${AVITO_API}?action=chats`);
      const data = await r.json();
      if (data.ok) {
        setChats(data.chats || []);
        setMyUserId(data.user_id);
        setLastRefresh(new Date());
        setActiveChat(prev => {
          if (!prev && data.chats?.length > 0) return data.chats[0];
          // обновить activeChat новыми данными
          if (prev) return data.chats.find((c: AvitoChat) => c.id === prev.id) || prev;
          return prev;
        });
      } else {
        setErrorChats(data.error || "Ошибка загрузки");
      }
    } catch {
      setErrorChats("Нет связи с Авито");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "avito") return;
    loadChats();
    pollRef.current = setInterval(() => loadChats(true), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tab, loadChats]);

  // ─── Load messages ────────────────────────────────────────────
  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const r = await fetch(`${AVITO_API}?action=messages&chat_id=${chatId}`);
      const data = await r.json();
      if (data.ok) {
        setMessages(data.messages || []);
      }
    } catch { /* ignore */ } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    loadMessages(activeChat.id);
  }, [activeChat, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Оптимистичное добавление
    const optimistic: AvitoMessage = {
      id: `opt-${Date.now()}`,
      author_id: myUserId ?? 0,
      content: { text: { text } },
      created: Math.floor(Date.now() / 1000),
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`${AVITO_API}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: activeChat.id, message: text }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadMessages(activeChat.id, true);
        loadChats(true);
      } else {
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        setInput(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => !m.isOptimistic));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────
  const getChatName = (chat: AvitoChat) =>
    chat.users?.find(u => u.id !== myUserId)?.name ||
    chat.context?.value?.title ||
    "Чат";

  const getInitials = (name: string) =>
    name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "АВ";

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  };

  const totalUnread = chats.reduce((s, c) => s + (c.unread_messages_count ?? 0), 0);

  return (
    <div className="card-surface rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex h-full">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="w-80 border-r border-snow-dark flex flex-col shrink-0">

          {/* Tabs */}
          <div className="flex border-b border-snow-dark">
            <button onClick={() => setTab("avito")}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === "avito" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
              Авито
              {totalUnread > 0 && (
                <span className="w-4 h-4 rounded-full bg-ink text-white text-[9px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
            <button onClick={() => setTab("internal")}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === "internal" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
              Команда
            </button>
          </div>

          {/* Search + refresh */}
          <div className="p-3 border-b border-snow-dark flex gap-2">
            <div className="flex items-center gap-2 bg-snow rounded-full px-3 py-2 flex-1">
              <Icon name="Search" size={13} className="text-ink-faint" />
              <input placeholder="Поиск..." className="bg-transparent text-xs placeholder:text-ink-faint focus:outline-none w-full" />
            </div>
            {tab === "avito" && (
              <button onClick={() => loadChats()}
                title="Обновить"
                className="w-8 h-8 rounded-full bg-snow flex items-center justify-center text-ink-faint hover:text-ink transition-colors shrink-0">
                <Icon name="RefreshCw" size={13} />
              </button>
            )}
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {tab === "avito" && (
              <>
                {loadingChats && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                    <p className="text-xs text-ink-faint">Загружаю чаты с Авито...</p>
                  </div>
                )}
                {!loadingChats && errorChats && (
                  <div className="p-5 text-center">
                    <Icon name="WifiOff" size={24} className="text-ink-faint mx-auto mb-2" />
                    <p className="text-xs text-red-500 mb-3">{errorChats}</p>
                    <button onClick={() => loadChats()}
                      className="text-xs text-ink font-medium hover:underline">Повторить</button>
                  </div>
                )}
                {!loadingChats && !errorChats && chats.length === 0 && (
                  <div className="p-5 text-center">
                    <Icon name="MessageSquare" size={24} className="text-ink-faint mx-auto mb-2" />
                    <p className="text-xs text-ink-faint">Чатов пока нет</p>
                  </div>
                )}
                {chats.map(chat => {
                  const name = getChatName(chat);
                  const unread = chat.unread_messages_count ?? 0;
                  const isActive = activeChat?.id === chat.id;
                  const lastText = chat.last_message?.content?.text?.text;
                  const itemImg = chat.context?.value?.images?.main;
                  const imgUrl = itemImg ? Object.values(itemImg)[0] : null;

                  return (
                    <button key={chat.id} onClick={() => setActiveChat(chat)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${isActive ? "bg-snow border-l-2 border-l-ink" : ""}`}>
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(name)}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>{name}</span>
                          <span className="text-[10px] text-ink-faint shrink-0 ml-1">{formatTime(chat.updated)}</span>
                        </div>
                        {/* Объявление */}
                        {chat.context?.value?.title && (
                          <p className="text-[10px] text-ink-faint truncate mb-0.5 flex items-center gap-1">
                            <Icon name="Tag" size={9} />
                            {chat.context.value.title}
                          </p>
                        )}
                        {/* Последнее сообщение */}
                        <p className={`text-xs truncate ${unread > 0 ? "text-ink-light font-medium" : "text-ink-faint"}`}>
                          {lastText || "Нет сообщений"}
                        </p>
                      </div>

                      {/* Превью объявления */}
                      {imgUrl && (
                        <img src={imgUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 opacity-60" />
                      )}
                    </button>
                  );
                })}

                {/* Время последнего обновления */}
                {lastRefresh && !loadingChats && (
                  <p className="text-center text-[10px] text-ink-faint py-3">
                    Обновлено в {lastRefresh.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </>
            )}

            {tab === "internal" && INTERNAL_CHATS.map(chat => (
              <button key={chat.id} onClick={() => setActiveInternal(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-snow/80 border-b border-snow-dark/50 transition-colors text-left ${activeInternal.id === chat.id ? "bg-snow border-l-2 border-l-ink" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0 text-white text-xs font-bold">{chat.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.name}</p>
                  <p className="text-[10px] text-ink-faint">{chat.role}</p>
                  <p className="text-xs text-ink-faint truncate mt-0.5">{chat.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages panel ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Avito chat open */}
          {tab === "avito" && activeChat && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{getInitials(getChatName(activeChat))}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{getChatName(activeChat)}</p>
                    {activeChat.context?.value?.title && (
                      <p className="text-[10px] text-ink-faint truncate">{activeChat.context.value.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeChat.context?.value?.url && (
                    <a href={activeChat.context.value.url} target="_blank" rel="noreferrer"
                      className="h-7 px-3 rounded-full border border-snow-dark text-xs text-ink-muted hover:text-ink hover:border-ink-faint flex items-center gap-1 transition-colors">
                      Объявление <Icon name="ExternalLink" size={11} />
                    </a>
                  )}
                  <button onClick={() => loadMessages(activeChat.id)}
                    className="w-7 h-7 rounded-full bg-snow flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
                    <Icon name="RefreshCw" size={12} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2 bg-snow/40">
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  </div>
                )}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-ink-faint">
                    <Icon name="MessageCircle" size={32} className="mb-2 opacity-30" />
                    <p className="text-xs">Нет сообщений</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.author_id === myUserId;
                  const text = msg.content?.text?.text;
                  const imgSizes = msg.content?.image?.sizes;
                  const imgUrl = imgSizes ? Object.values(imgSizes).pop() : null;

                  // Группировка: показывать время только если прошло >5 мин
                  const prevMsg = messages[i - 1];
                  const showTime = !prevMsg || Math.abs((msg.created ?? 0) - (prevMsg.created ?? 0)) > 300;

                  return (
                    <div key={msg.id}>
                      {showTime && msg.created && (
                        <p className="text-center text-[10px] text-ink-faint my-2">
                          {formatTime(msg.created)}
                        </p>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? `bg-ink text-white ${msg.isOptimistic ? "opacity-60" : ""}`
                            : "bg-white border border-snow-dark"
                        }`}>
                          {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
                          {imgUrl && <img src={imgUrl} alt="фото" className="rounded-xl max-w-[240px] mt-1" />}
                          {!text && !imgUrl && (
                            <p className="text-xs text-ink-faint italic">[вложение]</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Написать покупателю..."
                  className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors"
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors disabled:opacity-40 shrink-0">
                  {sending
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <Icon name="Send" size={14} className="text-white" />}
                </button>
              </div>
            </>
          )}

          {/* Avito empty state */}
          {tab === "avito" && !activeChat && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-ink-faint">
              <Icon name="MessageSquare" size={40} className="opacity-20" />
              <p className="text-sm">{loadingChats ? "Загрузка..." : "Выберите чат"}</p>
            </div>
          )}

          {/* Internal chat */}
          {tab === "internal" && (
            <>
              <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{activeInternal.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{activeInternal.name}</p>
                  <p className="text-xs text-green-500">онлайн</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-2 bg-snow/40">
                {activeInternal.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from === "me" ? "bg-ink text-white" : "bg-white border border-snow-dark"}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.from === "me" ? "text-white/50" : "text-ink-faint"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
                <input placeholder="Написать коллеге..."
                  className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors" />
                <button className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors shrink-0">
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
