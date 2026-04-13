export const API = "https://functions.poehali.dev/bb906e76-a34b-4cb8-9312-650654427354";
export const CRM_API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

export type Priority = "high" | "medium" | "low";
export type Status = "new" | "in_progress" | "review" | "approval" | "done" | "rejected";
export type TaskType = "project" | "personal" | "client_request";

export interface Task {
  id: number;
  title: string;
  description: string;
  type: TaskType;
  project_id: number | null;
  project_name: string | null;
  assignee: string;
  priority: Priority;
  status: Status;
  deadline: string | null;
  tags: string[];
  created_by: string;
  comments_count: number;
  created_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
}

export const COLUMNS: { id: Status; label: string; color: string; bg: string }[] = [
  { id: "new", label: "Новая", color: "text-ink-faint", bg: "bg-snow-mid" },
  { id: "in_progress", label: "В работе", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "review", label: "На проверке", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "approval", label: "Согласование", color: "text-purple-600", bg: "bg-purple-50" },
  { id: "done", label: "Готово", color: "text-green-600", bg: "bg-green-50" },
];

export const PRIORITY_ICONS: Record<Priority, { icon: string; color: string; label: string }> = {
  high: { icon: "ArrowUp", color: "text-red-500", label: "Высокий" },
  medium: { icon: "Minus", color: "text-amber-500", label: "Средний" },
  low: { icon: "ArrowDown", color: "text-green-500", label: "Низкий" },
};

export const TYPE_LABELS: Record<TaskType, string> = {
  project: "Проектная",
  personal: "Личная",
  client_request: "Запрос клиента",
};

export const TYPE_COLORS: Record<TaskType, string> = {
  project: "bg-blue-50 text-blue-600",
  personal: "bg-snow-mid text-ink-muted",
  client_request: "bg-purple-50 text-purple-600",
};

export function parseBody(raw: unknown): unknown {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}
