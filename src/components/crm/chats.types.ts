export const AVITO_API = "https://functions.poehali.dev/976899aa-03a4-4f5c-9700-e57aa8f2113a";
export const POLL_INTERVAL = 30_000;
export const AUTOPILOT_INTERVAL = 40_000;

export interface AvitoUser {
  id: number;
  name: string;
  public_user_profile?: { avatar?: { default?: string } };
}

export interface AvitoChat {
  id: string;
  context?: { value?: { title?: string; url?: string; images?: { main?: Record<string, string> } } };
  users: AvitoUser[];
  last_message?: {
    content?: { text?: string | { text?: string } };
    created?: number;
    author_id?: number;
  };
  unread_messages_count?: number;
  updated?: number;
}

export interface AvitoMessage {
  id: string;
  author_id: number;
  content?: { text?: string | { text?: string }; image?: { sizes?: Record<string, string> } };
  created?: number;
  type?: string;
  isOptimistic?: boolean;
}

export interface AutopilotLogEntry {
  time: string;
  client: string;
  reply: string;
}

export interface InternalChat {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar_url?: string;
  lastMsg: string;
  messages: { from: string; text: string; time: string }[];
}

export const INTERNAL_CHATS: InternalChat[] = [
  {
    id: "int1", name: "Алексей Иванов", role: "Senior Designer", initials: "АИ",
    lastMsg: "Макет готов, проверь",
    messages: [
      { from: "them", text: "Макет готов, проверь пожалуйста", time: "09:00" },
      { from: "me", text: "Окей, смотрю сейчас", time: "09:05" },
    ]
  },
  {
    id: "int2", name: "Мария Соколова", role: "UI/UX Designer", initials: "МС",
    lastMsg: "Завтра встреча с клиентом",
    messages: [
      { from: "them", text: "Завтра встреча с клиентом в 12:00", time: "вчера" },
    ]
  },
];

export const extractText = (content?: { text?: string | { text?: string } }): string | undefined => {
  if (!content?.text) return undefined;
  if (typeof content.text === "string") return content.text;
  return content.text.text;
};

export const getChatName = (chat: AvitoChat, myUserId: number | null): string =>
  chat.users?.find(u => u.id !== myUserId)?.name ||
  chat.context?.value?.title ||
  "Чат";

export const getInitials = (name: string): string =>
  name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "АВ";

export const formatTime = (ts?: number): string => {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru", { day: "numeric", month: "short" });
};