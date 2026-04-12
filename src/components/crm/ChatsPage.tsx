import { useState } from "react";
import Icon from "@/components/ui/icon";

const chats = [
  {
    id: 1, name: "Luxuria Group", initials: "LG", lastMsg: "Отлично! Жду финальный вариант",
    time: "10:42", unread: 2, messages: [
      { from: "them", text: "Добрый день! Когда будет готов финальный макет?", time: "10:30" },
      { from: "me", text: "Здравствуйте! Пришлю сегодня до 18:00", time: "10:35" },
      { from: "them", text: "Отлично! Жду финальный вариант", time: "10:42" },
    ]
  },
  {
    id: 2, name: "PayNova", initials: "PN", lastMsg: "Можно посмотреть прогресс?",
    time: "вчера", unread: 0, messages: [
      { from: "them", text: "Привет! Можно посмотреть прогресс?", time: "16:00" },
      { from: "me", text: "Конечно, отправляю ссылку на Figma", time: "16:05" },
    ]
  },
  {
    id: 3, name: "Atlas Ventures", initials: "AV", lastMsg: "Договор подписали, спасибо!", time: "вчера", unread: 0, messages: [
      { from: "them", text: "Договор подписали, спасибо!", time: "12:00" },
    ]
  },
];

export default function ChatsPage() {
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [input, setInput] = useState("");

  return (
    <div className="card-surface rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      <div className="flex h-full">
        <div className="w-72 border-r border-snow-dark flex flex-col shrink-0">
          <div className="p-3 border-b border-snow-dark">
            <div className="flex items-center gap-2 bg-snow rounded-full px-3 py-2">
              <Icon name="Search" size={13} className="text-ink-faint" />
              <input placeholder="Поиск..." className="bg-transparent text-xs placeholder:text-ink-faint focus:outline-none w-full" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-snow/80 transition-colors border-b border-snow-dark/50 text-left ${activeChat.id === chat.id ? "bg-snow" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{chat.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-[10px] text-ink-faint shrink-0 ml-1">{chat.time}</span>
                  </div>
                  <p className="text-xs text-ink-faint truncate mt-0.5">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-5 h-14 border-b border-snow-dark">
            <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
              <span className="text-white text-xs font-bold">{activeChat.initials}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{activeChat.name}</p>
              <p className="text-xs text-green-500">онлайн</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-snow/30">
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.from === "me"
                    ? "bg-ink text-white"
                    : "bg-white border border-snow-dark"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.from === "me" ? "text-white/50" : "text-ink-faint"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-snow-dark flex items-center gap-3 bg-white">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-snow border border-snow-dark rounded-full px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition-colors"
            />
            <button className="w-9 h-9 rounded-full bg-ink flex items-center justify-center hover:bg-ink-light transition-colors">
              <Icon name="Send" size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
