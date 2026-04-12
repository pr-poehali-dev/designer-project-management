import Icon from "@/components/ui/icon";
import { InternalChat } from "./chats.types";

interface Props {
  activeInternal: InternalChat;
}

export default function InternalMessagePanel({ activeInternal }: Props) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark shrink-0 bg-white">
        <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{activeInternal.initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{activeInternal.name}</p>
          <p className="text-xs text-green-500">онлайн</p>
        </div>
      </div>

      {/* Messages */}
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

      {/* Input */}
      <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white shrink-0">
        <input placeholder="Написать коллеге..."
          className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors" />
        <button className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors shrink-0">
          <Icon name="Send" size={14} className="text-white" />
        </button>
      </div>
    </>
  );
}
