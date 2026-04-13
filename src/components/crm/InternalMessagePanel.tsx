import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { InternalChat } from "./chats.types";

interface Props {
  activeInternal: InternalChat;
  onSendMessage?: (chatId: string, msg: { from: string; text: string; time: string }) => void;
}

export default function InternalMessagePanel({ activeInternal, onSendMessage }: Props) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(activeInternal.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(activeInternal.messages);
    setInput("");
  }, [activeInternal.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    const msg = { from: "me", text, time };
    setLocalMessages(prev => [...prev, msg]);
    setInput("");
    onSendMessage?.(activeInternal.id, msg);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
        {activeInternal.avatar_url ? (
          <img src={activeInternal.avatar_url} alt={activeInternal.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{activeInternal.initials}</span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{activeInternal.name}</p>
          {activeInternal.role && <p className="text-xs text-ink-faint">{activeInternal.role}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-snow/40">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-snow flex items-center justify-center">
              <Icon name="MessageSquare" size={20} className="text-ink-faint" />
            </div>
            <p className="text-sm text-ink-faint">Начните переписку с {activeInternal.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from === "me" ? "bg-ink text-white" : "bg-white border border-snow-dark"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.from === "me" ? "text-white/50" : "text-ink-faint"}`}>{msg.time}</p>
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
          placeholder={`Написать ${activeInternal.name}...`}
          className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors shrink-0 disabled:opacity-40"
        >
          <Icon name="Send" size={14} className="text-white" />
        </button>
      </div>
    </>
  );
}
