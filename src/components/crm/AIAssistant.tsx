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

// Воспроизведение по URL — браузер никогда не блокирует внешние ссылки
function playUrl(url: string): Promise<void> {
  return new Promise(res => {
    const audio = new Audio(url);
    audio.onended = () => res();
    audio.onerror = () => res();
    audio.play().catch(() => res());
  });
}

// Состояния микрофона
type MicState = "idle" | "listening" | "processing" | "speaking";

export default function AIAssistant({ currentPage, currentProjectName, onNavigate, onOpenProject, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [micState, setMicState] = useState<MicState>("idle");
  const [assistantName, setAssistantName] = useState("Жарвис");
  const [voiceMode, setVoiceMode] = useState(false); // режим голоса включён постоянно
  const [micLocked, setMicLocked] = useState(false); // кнопка залочена (нажали один раз)

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const silenceDurationRef = useRef(0);

  useEffect(() => {
    fetch(`${AI_API}?action=info`)
      .then(r => r.json())
      .then(d => { if (d.ok) setAssistantName(d.assistant_name || "Жарвис"); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Привет! Я ${assistantName}. Нажми и держи кнопку микрофона пока говоришь, или включи режим «всегда слушаю». Говори или пиши!`
      }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, assistantName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClientAction = useCallback((action: Record<string, unknown> | null) => {
    if (!action) return;
    if (action.action === "navigate" && action.page && onNavigate) onNavigate(action.page as string);
    if (action.action === "open_project" && action.project_id && onOpenProject) onOpenProject(action.project_id as number);
  }, [onNavigate, onOpenProject]);

  const voiceModeRef = useRef(voiceMode);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const micLockedRef = useRef(micLocked);
  useEffect(() => { micLockedRef.current = micLocked; }, [micLocked]);

  const sendMessage = useCallback(async (text: string, withVoice = false) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const speak = withVoice || voiceModeRef.current;
    if (speak) setMicState("processing");

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
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          isAction: !!data.action || !!data.executed,
        }]);
        if (data.action) handleClientAction(data.action);
        if (data.executed?.ok && onRefresh) setTimeout(() => onRefresh(), 500);

        // TTS — отдельный запрос после показа текста
        if (speak && data.reply) {
          setLoading(false);
          setMicState("speaking");
          try {
            const ttsR = await fetch(`${AI_API}?action=tts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: data.reply }),
            });
            const ttsData = await ttsR.json();
            if (ttsData.ok && ttsData.url) {
              await playUrl(ttsData.url);
            }
          } catch { /* ignore tts errors */ }
          setMicState("idle");
          return; // loading уже false
        } else {
          setMicState("idle");
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Не удалось связаться с сервером." }]);
      setMicState("idle");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, currentPage, currentProjectName, handleClientAction, onRefresh]);

  // ── VAD: определяем тишину после речи ──
  const startVAD = (stream: MediaStream) => {
    audioCtxRef.current = new AudioContext();
    const src = audioCtxRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 512;
    src.connect(analyserRef.current);
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
    isSpeakingRef.current = false;
    silenceDurationRef.current = 0;

    const check = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      if (avg > 15) {
        isSpeakingRef.current = true;
        silenceDurationRef.current = 0;
      } else if (isSpeakingRef.current) {
        silenceDurationRef.current += 20;
        if (silenceDurationRef.current >= 1500) {
          // 1.5 сек тишины после речи → останавливаем
          stopListening(true);
          return;
        }
      }
      vadFrameRef.current = window.setTimeout(check, 20);
    };
    vadFrameRef.current = window.setTimeout(check, 20);
  };

  const stopVAD = () => {
    if (vadFrameRef.current) { clearTimeout(vadFrameRef.current); vadFrameRef.current = null; }
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const startListening = useCallback(async (withVAD = false) => {
    if (micState === "speaking" || micState === "processing") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        stopVAD();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = async ev => {
          const b64 = (ev.target?.result as string).split(",")[1];
          setMicState("processing");
          try {
            const r = await fetch(`${AI_API}?action=transcribe`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: b64, mime: mimeType }),
            });
            const data = await r.json();
            if (data.ok && data.text?.trim()) {
              await sendMessage(data.text, voiceMode || micLocked);
            } else {
              setMicState("idle");
              if (micLocked) startListening(true);
            }
          } catch { setMicState("idle"); }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setMicState("listening");
      if (withVAD) startVAD(stream);
    } catch {
      alert("Нет доступа к микрофону. Разреши доступ в настройках браузера.");
    }
  }, [micState, voiceMode, micLocked, sendMessage]);

  const stopListening = useCallback((withVoice = false) => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
    mediaRef.current = null;
    // voiceMode передаётся через замыкание в sendMessage
    if (!withVoice) setMicState("idle");
  }, []);

  // ── Кнопка микрофона ──
  const handleMicClick = () => {
    if (micState === "speaking" || micState === "processing") return;

    if (micLocked) {
      // Выключаем залоченный режим
      setMicLocked(false);
      stopListening();
      stopVAD();
      setMicState("idle");
      return;
    }

    if (micState === "listening") {
      // Hold-режим: отпустили → отправляем
      stopListening(voiceMode);
    } else {
      // Залочить микрофон = нажал → включился и слушает постоянно
      setMicLocked(true);
      startListening(true);
    }
  };

  // Hold: зажал → слушает, отпустил → отправляет
  const handleMicPointerDown = (e: React.PointerEvent) => {
    if (micLocked) return; // в залоченном режиме игнорируем pointer
    e.preventDefault();
    startListening(false);
  };

  const handleMicPointerUp = () => {
    if (micLocked) return;
    if (micState === "listening") stopListening(voiceMode);
  };

  const MIC_COLORS: Record<MicState, string> = {
    idle:       "bg-snow text-ink-muted hover:bg-snow-dark",
    listening:  "bg-red-500 text-white animate-pulse",
    processing: "bg-amber-400 text-white",
    speaking:   "bg-blue-500 text-white",
  };

  const MIC_ICONS: Record<MicState, string> = {
    idle:       "Mic",
    listening:  "Mic",
    processing: "Loader",
    speaking:   "Volume2",
  };

  return (
    <>
      {/* ── Кнопка открытия ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 ${
          open ? "bg-ink text-white scale-95 shadow-md" : "bg-ink text-white hover:scale-105 hover:shadow-2xl"
        } ${micLocked ? "ring-4 ring-red-400" : ""}`}
        title={assistantName}
      >
        {micState === "listening"
          ? <Icon name="Mic" size={22} className="text-red-300 animate-pulse" />
          : micState === "speaking"
            ? <Icon name="Volume2" size={22} className="text-blue-300" />
            : <span className="text-xl leading-none">✦</span>
        }
      </button>

      {/* ── Панель ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-snow-dark flex flex-col overflow-hidden animate-fade-in"
          style={{ width: 360, maxHeight: 560 }}>

          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 bg-ink text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <div>
                <p className="font-semibold text-sm leading-none">{assistantName}</p>
                <p className="text-[10px] text-white/50 mt-0.5">AI-помощник</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Переключатель голоса */}
              <button
                onClick={() => setVoiceMode(v => !v)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                  voiceMode ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"
                }`}
                title="Отвечать голосом"
              >
                <Icon name="Volume2" size={12} />
                Голос
              </button>
              <button onClick={() => setMessages([])} className="text-white/50 hover:text-white transition-colors" title="Новый диалог">
                <Icon name="RotateCcw" size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          {/* Статус микрофона */}
          {(micState !== "idle" || micLocked) && (
            <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 shrink-0 ${
              micState === "listening" ? "bg-red-50 text-red-600"
              : micState === "processing" ? "bg-amber-50 text-amber-600"
              : micState === "speaking" ? "bg-blue-50 text-blue-600"
              : "bg-snow text-ink-muted"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                micState === "listening" ? "bg-red-500 animate-pulse"
                : micState === "processing" ? "bg-amber-400"
                : micState === "speaking" ? "bg-blue-500"
                : "bg-ink-faint"
              }`} />
              {micState === "listening" && (micLocked ? "Слушаю... (нажми ✦ чтобы остановить)" : "Слушаю... (отпусти чтобы отправить)")}
              {micState === "processing" && "Обрабатываю..."}
              {micState === "speaking" && `${assistantName} говорит...`}
              {micState === "idle" && micLocked && "Режим всегда слушаю включён"}
            </div>
          )}

          {/* Подсказки */}
          {messages.length <= 1 && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
              {["Какие дедлайны?", "Создай задачу", "Открой клиентов", "Покажи проекты"].map(hint => (
                <button key={hint} onClick={() => sendMessage(hint, voiceMode)}
                  className="text-[11px] px-2.5 py-1 bg-snow hover:bg-snow-dark rounded-full text-ink-muted transition-colors">
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
                  m.role === "user" ? "bg-ink text-white rounded-br-sm"
                  : m.isAction ? "bg-green-50 text-green-800 border border-green-200 rounded-bl-sm"
                  : "bg-snow text-ink rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-snow rounded-xl px-3 py-2 flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Ввод */}
          <div className="px-3 py-3 border-t border-snow-dark flex gap-2 items-center shrink-0">
            {/* Кнопка микрофона */}
            <button
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={handleMicPointerUp}
              onClick={micLocked ? handleMicClick : undefined}
              disabled={micState === "processing" || micState === "speaking"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all select-none shrink-0 ${MIC_COLORS[micLocked && micState === "idle" ? "listening" : micState]} disabled:opacity-40`}
              title={micLocked ? "Нажми чтобы остановить" : "Зажми и говори · Нажми для постоянного режима"}
            >
              <Icon name={MIC_ICONS[micState]} size={16} />
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input, voiceMode))}
              placeholder="Напиши или зажми микрофон..."
              disabled={loading}
              className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink-faint disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input, voiceMode)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink-light disabled:opacity-30 transition-colors shrink-0"
            >
              <Icon name="Send" size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}