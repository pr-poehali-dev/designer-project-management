import { useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  AvitoChat, AvitoMessage, AutopilotLogEntry,
  getChatName, getInitials, formatTime, extractText,
} from "./chats.types";

interface Props {
  activeChat: AvitoChat | null;
  myUserId: number | null;
  messages: AvitoMessage[];
  loadingMsgs: boolean;
  loadingChats: boolean;
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  sendMessage: () => void;
  loadMessages: (chatId: string) => void;
  autopilotLog: AutopilotLogEntry[];
}

export default function AvitoMessagePanel({
  activeChat, myUserId, messages, loadingMsgs, loadingChats,
  input, setInput, sending, sendMessage, loadMessages,
  autopilotLog,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Autopilot log panel */}
      {autopilotLog.length > 0 && (
        <div className="border-b border-snow-dark bg-green-50 px-5 py-3 shrink-0 max-h-32 overflow-y-auto">
          <p className="text-[10px] font-semibold text-green-700 mb-2 flex items-center gap-1">
            <Icon name="Bot" size={11} /> Автопилот — последние ответы
          </p>
          {autopilotLog.slice(0, 5).map((log, i) => (
            <div key={i} className="text-[10px] text-green-800 mb-1">
              <span className="text-green-500">{log.time}</span>
              {" · "}<span className="font-medium">{log.client || "клиент"}</span>
              {" — "}<span className="text-ink-muted">{log.reply.slice(0, 80)}…</span>
            </div>
          ))}
        </div>
      )}

      {/* Active chat */}
      {activeChat ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{getInitials(getChatName(activeChat, myUserId))}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{getChatName(activeChat, myUserId)}</p>
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
              const text = extractText(msg.content);
              const imgSizes = msg.content?.image?.sizes;
              const imgUrl = imgSizes ? Object.values(imgSizes).pop() : null;
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
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-ink-faint">
          <Icon name="MessageSquare" size={40} className="opacity-20" />
          <p className="text-sm">{loadingChats ? "Загрузка..." : "Выберите чат"}</p>
        </div>
      )}
    </>
  );
}