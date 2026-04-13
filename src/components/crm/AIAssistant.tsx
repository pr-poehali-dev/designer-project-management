import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_API = "https://functions.poehali.dev/3a0beff5-f58c-449f-a5dd-ae109409103b";

interface Message {
  role: "user" | "assistant";
  content: string;
  isAction?: boolean;
}

interface Props {
  currentPage: string;
  currentProjectName?: string;
  onNavigate?: (page: string) => void;
  onOpenProject?: (id: number) => void;
  onRefresh?: () => void;
}

export default function AIAssistant({ currentPage, currentProjectName, onNavigate, onOpenProject, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [assistantName, setAssistantName] = useState("Давинчи");

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
      setMessages([{
        role: "assistant",
        content: `Привет! Я ${assistantName}. Могу открыть любой раздел, создать задачу или клиента, показать дедлайны и многое другое. Говори или пиши!`
      }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, assistantName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClientAction = useCallback((action: Record<string, unknown> | null) => {
    if (!action) return;
    if (action.action === "navigate" && action.page && onNavigate) {
      onNavigate(action.page as string);
    }
    if (action.action === "open_project" && action.project_id && onOpenProject) {
      onOpenProject(action.project_id as number);
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
        const replyMsg: Message = {
          role: "assistant",
          content: data.reply,
          isAction: !!data.action || !!data.executed,
        };
        setMessages(prev => [...prev, replyMsg]);

        if (data.action) handleClientAction(data.action);

        // Если что-то создано/изменено — обновляем страницу
        if (data.executed?.ok && onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Не удалось связаться с сервером. Попробуй ещё раз." }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = async ev => {
          const b64 = (ev.target?.result as string).split(",")[1];
          setLoading(true);
          try {
            const r = await fetch(`${AI_API}?action=transcribe`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: b64, mime: mimeType }),
            });
            const data = await r.json();
            if (data.ok && data.text?.trim()) {
              await sendMessage(data.text);
            } else {
              setLoading(false);
            }
          } catch { setLoading(false); }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Нет доступа к микрофону. Разреши доступ в настройках браузера.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
    mediaRef.current = null;
    setRecording(false);
  };

  return (
    <>
      {/* Кнопка активации */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 ${
          open ? "bg-ink text-white scale-95 shadow-md" : "bg-ink text-white hover:scale-105 hover:shadow-2xl"
        } ${recording ? "animate-pulse ring-4 ring-red-400" : ""}`}
        title={assistantName}
      >
        {recording
          ? <Icon name="Mic" size={22} className="text-red-300" />
          : <span className="text-xl leading-none">✦</span>
        }
      </button>

      {/* Панель */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-84 bg-white rounded-2xl shadow-2xl border border-snow-dark flex flex-col overflow-hidden animate-fade-in"
          style={{ width: 340, maxHeight: 520 }}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 bg-ink text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <div>
                <p className="font-semibold text-sm leading-none">{assistantName}</p>
                <p className="text-[10px] text-white/50 mt-0.5">AI-помощник</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessages([])}
                className="text-white/50 hover:text-white transition-colors"
                title="Новый диалог"
              >
                <Icon name="RotateCcw" size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          {/* Подсказки */}
          {messages.length <= 1 && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
              {[
                "Какие дедлайны на этой неделе?",
                "Создай задачу",
                "Открой клиентов",
                "Покажи проекты",
              ].map(hint => (
                <button
                  key={hint}
                  onClick={() => sendMessage(hint)}
                  className="text-[11px] px-2.5 py-1 bg-snow hover:bg-snow-dark rounded-full text-ink-muted transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink text-white rounded-br-sm"
                    : m.isAction
                      ? "bg-green-50 text-green-800 border border-green-200 rounded-bl-sm"
                      : "bg-snow text-ink rounded-bl-sm"
                }`}>
                  {m.isAction && <span className="text-green-600 mr-1">✓</span>}
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
          <div className="px-3 py-2.5 border-t border-snow-dark flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              className="flex-1 text-sm outline-none bg-snow rounded-xl px-3 py-2 placeholder:text-ink-faint"
              placeholder={recording ? "Говори..." : "Напиши или нажми микрофон..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              disabled={loading || recording}
            />
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={e => { e.preventDefault(); startRecording(); }}
              onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                recording
                  ? "bg-red-500 text-white scale-110"
                  : "bg-snow text-ink-muted hover:bg-snow-dark"
              }`}
              title="Держи для записи голоса"
              disabled={loading && !recording}
            >
              <Icon name="Mic" size={15} />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || recording}
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
