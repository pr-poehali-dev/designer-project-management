import { useState } from "react";
import Icon from "@/components/ui/icon";

const chats = [
  {
    id: 1, name: "Luxuria Group", avatar: "LA", lastMsg: "Отлично! Жду финальный вариант",
    time: "10:42", unread: 2, messages: [
      { from: "them", text: "Добрый день! Когда будет готов финальный макет?", time: "10:30" },
      { from: "me", text: "Здравствуйте! Пришлю сегодня до 18:00", time: "10:35" },
      { from: "them", text: "Отлично! Жду финальный вариант", time: "10:42" },
    ]
  },
  {
    id: 2, name: "PayNova", avatar: "PN", lastMsg: "Можно посмотреть прогресс?",
    time: "вчера", unread: 0, messages: [
      { from: "them", text: "Привет! Можно посмотреть прогресс?", time: "16:00" },
      { from: "me", text: "Конечно, отправляю ссылку на Figma", time: "16:05" },
    ]
  },
  {
    id: 3, name: "Atlas Ventures", avatar: "AV", lastMsg: "Договор подписали, спасибо!", time: "вчера", unread: 0, messages: [
      { from: "them", text: "Договор подписали, спасибо!", time: "12:00" },
    ]
  },
];

export default function ChatsPage() {
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [input, setInput] = useState("");

  return (
    <div className="glass rounded-sm overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex h-full">
        {/* Chat list */}
        <div className="w-64 border-r border-onyx-border flex flex-col shrink-0">
          <div className="p-3 border-b border-onyx-border">
            <div className="flex items-center gap-2 bg-onyx-mid rounded-sm px-3 py-2">
              <Icon name="Search" size={13} className="text-foreground/30" />
              <input placeholder="Поиск..." className="bg-transparent text-xs text-foreground placeholder:text-foreground/30 focus:outline-none w-full" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-onyx-mid/50 transition-colors border-b border-onyx-border/50 ${activeChat.id === chat.id ? "bg-gold/5 border-l-2 border-l-gold" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                  <span className="text-gold text-xs font-bold">{chat.avatar}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-[10px] text-foreground/30 shrink-0 ml-1">{chat.time}</span>
                  </div>
                  <p className="text-xs text-foreground/40 truncate mt-0.5">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-gold text-onyx text-[9px] font-bold flex items-center justify-center shrink-0">
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-onyx-border">
            <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
              <span className="text-gold text-xs font-bold">{activeChat.avatar}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{activeChat.name}</p>
              <p className="text-xs text-green-400">онлайн</p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-sm px-4 py-3 ${
                  msg.from === "me"
                    ? "bg-gold/15 border border-gold/20 text-foreground"
                    : "bg-onyx-mid border border-onyx-border text-foreground/80"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-foreground/30 mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-onyx-border flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-onyx-mid border border-onyx-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/40 transition-colors"
            />
            <button className="w-9 h-9 rounded-sm bg-gold flex items-center justify-center hover:bg-gold-light transition-colors">
              <Icon name="Send" size={14} className="text-onyx" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
