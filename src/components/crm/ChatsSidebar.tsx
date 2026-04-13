import Icon from "@/components/ui/icon";
import {
  AvitoChat, InternalChat, ClientChatItem,
  getChatName, getInitials, formatTime, extractText,
} from "./chats.types";

interface Props {
  tab: "avito" | "internal" | "clients" | "training";
  setTab: (t: "avito" | "internal" | "clients" | "training") => void;
  totalUnread: number;
  totalClientUnread: number;

  // Autopilot
  autopilot: boolean;
  setAutopilot: (v: (prev: boolean) => boolean) => void;
  autopilotRunning: boolean;

  // Avito chats
  chats: AvitoChat[];
  myUserId: number | null;
  loadingChats: boolean;
  errorChats: string;
  activeChat: AvitoChat | null;
  setActiveChat: (c: AvitoChat) => void;
  lastRefresh: Date | null;
  loadChats: () => void;

  // Internal chats
  internalChats: InternalChat[];
  activeInternal: InternalChat;
  setActiveInternal: (c: InternalChat) => void;

  // Client chats
  clientChats: ClientChatItem[];
  loadingClientChats: boolean;
  activeClientChat: ClientChatItem | null;
  setActiveClientChat: (c: ClientChatItem) => void;
}

export default function ChatsSidebar({
  tab, setTab, totalUnread, totalClientUnread,
  autopilot, setAutopilot, autopilotRunning,
  chats, myUserId, loadingChats, errorChats, activeChat, setActiveChat, lastRefresh, loadChats,
  internalChats, activeInternal, setActiveInternal,
  clientChats, loadingClientChats, activeClientChat, setActiveClientChat,
}: Props) {

  const initials = (name: string) =>
    name ? name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  const fmtTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  };

  return (
    <div className="w-72 border-r border-snow-dark flex flex-col shrink-0">

      {/* Tabs */}
      <div className="flex border-b border-snow-dark overflow-x-auto">
        <button onClick={() => setTab("avito")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap px-2 ${tab === "avito" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
          Авито
          {totalUnread > 0 && (
            <span className="w-4 h-4 rounded-full bg-ink text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
        <button onClick={() => setTab("clients")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap px-2 ${tab === "clients" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
          Клиенты
          {totalClientUnread > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {totalClientUnread > 9 ? "9+" : totalClientUnread}
            </span>
          )}
        </button>
        <button onClick={() => setTab("internal")}
          className={`flex-1 py-3 text-xs font-semibold transition-colors whitespace-nowrap px-2 ${tab === "internal" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
          Команда
        </button>
        <button onClick={() => setTab("training")}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap px-2 ${tab === "training" ? "text-ink border-b-2 border-ink" : "text-ink-faint hover:text-ink"}`}>
          <Icon name="GraduationCap" size={12} />
        </button>
      </div>

      {/* Autopilot toggle */}
      {tab === "avito" && (
        <div className={`flex items-center justify-between px-4 py-2.5 border-b border-snow-dark transition-colors ${autopilot ? "bg-ink" : "bg-white"}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${autopilot ? "bg-green-400 animate-pulse" : "bg-ink-faint"}`} />
            <span className={`text-xs font-semibold ${autopilot ? "text-white" : "text-ink-muted"}`}>
              {autopilot ? "Автопилот вкл." : "Автопилот выкл."}
            </span>
            {autopilotRunning && (
              <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={() => setAutopilot(p => !p)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autopilot ? "bg-green-400" : "bg-snow-dark"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autopilot ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      )}

      {/* Search + refresh */}
      {tab !== "training" && (
        <div className="p-3 border-b border-snow-dark flex gap-2">
          <div className="flex items-center gap-2 bg-snow rounded-full px-3 py-2 flex-1">
            <Icon name="Search" size={13} className="text-ink-faint" />
            <input placeholder="Поиск..." className="bg-transparent text-xs placeholder:text-ink-faint focus:outline-none w-full" />
          </div>
          {tab === "avito" && (
            <button onClick={loadChats} title="Обновить"
              className="w-8 h-8 rounded-full bg-snow flex items-center justify-center text-ink-faint hover:text-ink transition-colors shrink-0">
              <Icon name="RefreshCw" size={13} />
            </button>
          )}
        </div>
      )}

      {tab === "training" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ink/5 flex items-center justify-center mb-3">
            <Icon name="GraduationCap" size={28} className="text-ink-muted" />
          </div>
          <p className="text-sm font-medium mb-1">Настройка автоответа</p>
          <p className="text-xs text-ink-faint leading-relaxed">
            Заполните инструкцию справа — автопилот будет использовать её при ответах клиентам
          </p>
        </div>
      )}

      {/* Chat list */}
      {tab !== "training" && (
        <div className="flex-1 overflow-y-auto">

          {/* AVITO */}
          {tab === "avito" && (
            <>
              {loadingChats && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  <p className="text-xs text-ink-faint">Загружаю чаты...</p>
                </div>
              )}
              {!loadingChats && errorChats && (
                <div className="p-5 text-center">
                  <Icon name="WifiOff" size={24} className="text-ink-faint mx-auto mb-2" />
                  <p className="text-xs text-red-500 mb-3">{errorChats}</p>
                  <button onClick={loadChats} className="text-xs text-ink font-medium hover:underline">Повторить</button>
                </div>
              )}
              {!loadingChats && !errorChats && chats.length === 0 && (
                <div className="p-5 text-center">
                  <Icon name="MessageSquare" size={24} className="text-ink-faint mx-auto mb-2" />
                  <p className="text-xs text-ink-faint">Чатов пока нет</p>
                </div>
              )}
              {chats.map(chat => {
                const name = getChatName(chat, myUserId);
                const unread = chat.unread_messages_count ?? 0;
                const isActive = activeChat?.id === chat.id;
                const lastText = extractText(chat.last_message?.content);
                const itemImg = chat.context?.value?.images?.main;
                const imgUrl = itemImg ? Object.values(itemImg)[0] : null;
                return (
                  <button key={chat.id} onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${isActive ? "bg-snow border-l-2 border-l-ink" : ""}`}>
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
                      {chat.context?.value?.title && (
                        <p className="text-[10px] text-ink-faint truncate mb-0.5 flex items-center gap-1">
                          <Icon name="Tag" size={9} />
                          {chat.context.value.title}
                        </p>
                      )}
                      <p className={`text-xs truncate ${unread > 0 ? "text-ink-light font-medium" : "text-ink-faint"}`}>
                        {lastText || "Нет сообщений"}
                      </p>
                    </div>
                    {imgUrl && (
                      <img src={imgUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 opacity-60" />
                    )}
                  </button>
                );
              })}
              {lastRefresh && !loadingChats && (
                <p className="text-center text-[10px] text-ink-faint py-3">
                  Обновлено в {lastRefresh.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </>
          )}

          {/* CLIENTS */}
          {tab === "clients" && (
            <>
              {loadingClientChats && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  <p className="text-xs text-ink-faint">Загружаю клиентов...</p>
                </div>
              )}
              {!loadingClientChats && clientChats.length === 0 && (
                <div className="p-5 text-center">
                  <Icon name="Users" size={24} className="text-ink-faint mx-auto mb-2" />
                  <p className="text-xs text-ink-faint">Клиентов пока нет</p>
                </div>
              )}
              {clientChats.map(client => {
                const isActive = activeClientChat?.id === client.id;
                const unread = Number(client.unread) || 0;
                return (
                  <button key={client.id} onClick={() => setActiveClientChat(client)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${isActive ? "bg-snow border-l-2 border-l-amber-500" : ""}`}>
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                        {initials(client.contact_person || client.name)}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>{client.name}</span>
                        <span className="text-[10px] text-ink-faint shrink-0 ml-1">{fmtTime(client.last_message_at)}</span>
                      </div>
                      <p className={`text-xs truncate ${unread > 0 ? "text-ink font-medium" : "text-ink-faint"}`}>
                        {client.last_message || "Нет сообщений"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* INTERNAL / TEAM */}
          {tab === "internal" && (
            <>
              {internalChats.map(chat => (
                <button key={chat.id} onClick={() => setActiveInternal(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${activeInternal?.id === chat.id ? "bg-snow border-l-2 border-l-ink" : ""}`}>
                  {chat.avatar_url ? (
                    <img src={chat.avatar_url} alt={chat.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {chat.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.name}</p>
                    <p className="text-xs text-ink-faint truncate">{chat.role || chat.lastMsg || "Нет сообщений"}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
