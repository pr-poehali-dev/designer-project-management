import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_API = "https://functions.poehali.dev/3a0beff5-f58c-449f-a5dd-ae109409103b";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  currentPage: string;
  currentProjectName?: string;
  onNavigate?: (page: string) => void;
  onOpenProject?: (id: number) => void;
}

export default function AIAssistant({ currentPage, currentProjectName, onNavigate, onOpenProject }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [assistantName, setAssistantName] = useState("Давинчи");
  const [pulse, setPulse] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${AI_API}?action=info`)
      .then(r => r.json())
      .then(d => { if (d.ok) setAssistantName(d.assistant_name || "Давинчи"); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: `Привет! Я ${assistantName} — твой помощник. Могу ответить на вопросы, создать задачу, открыть нужный раздел. Говори или пиши!` }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, assistantName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAction = useCallback((action: { action: string; page?: string; project_id?: number } | null) => {
    if (!action) return;
    if (action.action === "navigate" && action.page && onNavigate) {
      onNavigate(action.page);
    }
    if (action.action === "open_project" && action.project_id && onOpenProject) {
      onOpenProject(action.project_id);
    }
  }, [onNavigate, onOpenProject]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(`${AI_API}?action=chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: { page: currentPage, project_name: currentProjectName },
        }),
      });
      const data = await r.json();
      if (data.ok) {
        let replyText = data.reply;
        if (data.action) {
          const labels: Record<string, string> = {
            navigate: `Открываю раздел...`,
            create_task: `Создаю задачу...`,
            open_project: `Открываю проект...`,
          };
          replyText = labels[data.action.action] || replyText;
          handleAction(data.action);
        }
        setMessages(prev => [...prev, { role: "assistant", content: replyText }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Упс, не удалось связаться с сервером. Попробуй ещё раз." }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async ev => {
          const b64 = (ev.target?.result as string).split(",")[1];
          setLoading(true);
          try {
            const r = await fetch(`${AI_API}?action=transcribe`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: b64, mime: "audio/webm" }),
            });
            const data = await r.json();
            if (data.ok && data.text.trim()) {
              await sendMessage(data.text);
            }
          } catch { /* ignore */ } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setPulse(true);
    } catch {
      alert("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
    setPulse(false);
  };

  return (
    <>
      {/* Кнопка активации */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          open ? "bg-ink text-white scale-95" : "bg-ink text-white hover:scale-105"
        } ${pulse ? "animate-pulse" : ""}`}
        title={assistantName}
      >
        <span className="text-xl">✦</span>
      </button>

      {/* Панель */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-snow-dark flex flex-col overflow-hidden animate-fade-in" style={{ maxHeight: "480px" }}>
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-snow-dark bg-ink text-white">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <span className="font-semibold text-sm">{assistantName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages([])}
                className="text-white/60 hover:text-white transition-colors text-xs"
                title="Очистить чат"
              >
                <Icon name="RotateCcw" size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink text-white rounded-br-sm"
                    : "bg-snow text-ink rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-snow px-3 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Ввод */}
          <div className="px-3 py-2.5 border-t border-snow-dark flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 text-sm outline-none bg-snow rounded-xl px-3 py-2 placeholder:text-ink-faint"
              placeholder="Спроси что-нибудь..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              disabled={loading || recording}
            />
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                recording ? "bg-red-500 text-white animate-pulse" : "bg-snow text-ink-muted hover:bg-snow-dark"
              }`}
              title="Держи для записи голоса"
              disabled={loading}
            >
              <Icon name="Mic" size={15} />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink-light transition-colors disabled:opacity-40 shrink-0"
            >
              <Icon name="Send" size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
