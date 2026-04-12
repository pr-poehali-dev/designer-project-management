import { useState, useEffect, useRef, useCallback } from "react";
import {
  AVITO_API, POLL_INTERVAL, AUTOPILOT_INTERVAL,
  AvitoChat, AvitoMessage, AutopilotLogEntry,
  INTERNAL_CHATS,
} from "./chats.types";
import ChatsSidebar from "./ChatsSidebar";
import AvitoMessagePanel from "./AvitoMessagePanel";
import InternalMessagePanel from "./InternalMessagePanel";

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

  // Autopilot
  const [autopilot, setAutopilot] = useState(false);
  const [autopilotLog, setAutopilotLog] = useState<AutopilotLogEntry[]>([]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);

  // Internal state
  const [activeInternal, setActiveInternal] = useState(INTERNAL_CHATS[0]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autopilotRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ─── Autopilot ────────────────────────────────────────────────
  const runAutopilot = useCallback(async () => {
    if (autopilotRunning) return;
    setAutopilotRunning(true);
    try {
      const res = await fetch(`${AVITO_API}?action=autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok && data.replies?.length > 0) {
        const time = new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
        setAutopilotLog(prev => [
          ...data.replies.map((r: { client: string; reply: string }) => ({ time, client: r.client, reply: r.reply })),
          ...prev,
        ].slice(0, 20));
        loadChats(true);
      }
    } catch { /* ignore */ } finally {
      setAutopilotRunning(false);
    }
  }, [autopilotRunning, loadChats]);

  useEffect(() => {
    if (autopilot) {
      runAutopilot();
      autopilotRef.current = setInterval(runAutopilot, AUTOPILOT_INTERVAL);
    } else {
      if (autopilotRef.current) clearInterval(autopilotRef.current);
    }
    return () => { if (autopilotRef.current) clearInterval(autopilotRef.current); };
  }, [autopilot]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Send message ─────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

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

  const totalUnread = chats.reduce((s, c) => s + (c.unread_messages_count ?? 0), 0);

  return (
    <div className="card-surface rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex h-full">

        <ChatsSidebar
          tab={tab}
          setTab={setTab}
          totalUnread={totalUnread}
          autopilot={autopilot}
          setAutopilot={setAutopilot}
          autopilotRunning={autopilotRunning}
          chats={chats}
          myUserId={myUserId}
          loadingChats={loadingChats}
          errorChats={errorChats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          lastRefresh={lastRefresh}
          loadChats={() => loadChats()}
          internalChats={INTERNAL_CHATS}
          activeInternal={activeInternal}
          setActiveInternal={setActiveInternal}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {tab === "avito" && (
            <AvitoMessagePanel
              activeChat={activeChat}
              myUserId={myUserId}
              messages={messages}
              loadingMsgs={loadingMsgs}
              loadingChats={loadingChats}
              input={input}
              setInput={setInput}
              sending={sending}
              sendMessage={sendMessage}
              loadMessages={loadMessages}
              autopilotLog={autopilotLog}
            />
          )}
          {tab === "internal" && (
            <InternalMessagePanel activeInternal={activeInternal} />
          )}
        </div>

      </div>
    </div>
  );
}