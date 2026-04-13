import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/bb906e76-a34b-4cb8-9312-650654427354";
const CRM_API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

type Priority = "high" | "medium" | "low";
type Status = "new" | "in_progress" | "review" | "approval" | "done" | "rejected";
type TaskType = "project" | "personal" | "client_request";

interface Task {
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

interface Comment {
  id: number;
  task_id: number;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
}

const COLUMNS: { id: Status; label: string; color: string; bg: string }[] = [
  { id: "new", label: "Новая", color: "text-ink-faint", bg: "bg-snow-mid" },
  { id: "in_progress", label: "В работе", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "review", label: "На проверке", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "approval", label: "Согласование", color: "text-purple-600", bg: "bg-purple-50" },
  { id: "done", label: "Готово", color: "text-green-600", bg: "bg-green-50" },
];

const PRIORITY_ICONS: Record<Priority, { icon: string; color: string; label: string }> = {
  high: { icon: "ArrowUp", color: "text-red-500", label: "Высокий" },
  medium: { icon: "Minus", color: "text-amber-500", label: "Средний" },
  low: { icon: "ArrowDown", color: "text-green-500", label: "Низкий" },
};

const TYPE_LABELS: Record<TaskType, string> = {
  project: "Проектная",
  personal: "Личная",
  client_request: "Запрос клиента",
};

const TYPE_COLORS: Record<TaskType, string> = {
  project: "bg-blue-50 text-blue-600",
  personal: "bg-snow-mid text-ink-muted",
  client_request: "bg-purple-50 text-purple-600",
};

function parseBody(raw: unknown): unknown {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/`);
    const raw = await r.json();
    const data = parseBody(raw) as { ok: boolean; tasks: Task[] };
    if (data.ok) setTasks(data.tasks || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch(`${CRM_API}?action=projects`)
      .then(r => r.json())
      .then(raw => {
        const d = parseBody(raw) as { ok: boolean; projects: Project[] };
        if (d.ok) setProjects(d.projects || []);
      });
  }, [load]);

  const updateStatus = async (taskId: number, status: Status) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    await fetch(`${API}/?id=${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const deleteTask = async (taskId: number) => {
    await fetch(`${API}/?id=${taskId}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  const tasksByStatus = (status: Status) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex bg-snow-mid rounded-lg p-1 gap-1">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${view === "kanban" ? "bg-white shadow-sm text-ink font-medium" : "text-ink-muted"}`}
            >
              <span className="flex items-center gap-1.5"><Icon name="LayoutDashboard" size={14} />Kanban</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${view === "list" ? "bg-white shadow-sm text-ink font-medium" : "text-ink-muted"}`}
            >
              <span className="flex items-center gap-1.5"><Icon name="List" size={14} />Список</span>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-9 px-4 bg-ink text-white text-sm rounded-full hover:bg-ink-light transition-colors"
        >
          <Icon name="Plus" size={14} />
          Новая задача
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-faint text-sm">Загрузка...</div>
      ) : view === "kanban" ? (
        <KanbanBoard columns={COLUMNS} tasksByStatus={tasksByStatus} onStatusChange={updateStatus} onSelect={setSelectedTask} />
      ) : (
        <ListView tasks={tasks} onStatusChange={updateStatus} onSelect={setSelectedTask} />
      )}

      {showForm && (
        <TaskForm
          projects={projects}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(s) => { updateStatus(selectedTask.id, s); setSelectedTask({ ...selectedTask, status: s }); }}
          onDelete={deleteTask}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function KanbanBoard({ columns, tasksByStatus, onStatusChange, onSelect }: {
  columns: typeof COLUMNS;
  tasksByStatus: (s: Status) => Task[];
  onStatusChange: (id: number, s: Status) => void;
  onSelect: (t: Task) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => {
        const colTasks = tasksByStatus(col.id);
        return (
          <div key={col.id} className="flex-none w-64">
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${col.bg}`}>
              <span className={`text-sm font-medium ${col.color}`}>{col.label}</span>
              <span className={`text-xs font-medium ${col.color} opacity-70`}>{colTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onSelect={onSelect} onStatusChange={onStatusChange} columns={columns} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-8 text-ink-faint text-xs border-2 border-dashed border-snow-dark rounded-xl">
                  Нет задач
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onSelect, onStatusChange, columns }: {
  task: Task;
  onSelect: (t: Task) => void;
  onStatusChange: (id: number, s: Status) => void;
  columns: typeof COLUMNS;
}) {
  const pr = PRIORITY_ICONS[task.priority];
  return (
    <div
      className="bg-white border border-snow-dark rounded-xl p-3 cursor-pointer hover:shadow-md transition-all group"
      onClick={() => onSelect(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-ink leading-snug line-clamp-2">{task.title}</span>
        <Icon name={pr.icon as never} size={14} className={`${pr.color} flex-none mt-0.5`} />
      </div>

      {task.project_name && (
        <div className="text-xs text-ink-faint mb-2 flex items-center gap-1">
          <Icon name="FolderKanban" size={11} />
          {task.project_name}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${TYPE_COLORS[task.type]}`}>
          {TYPE_LABELS[task.type]}
        </span>
        <div className="flex items-center gap-2">
          {task.deadline && (
            <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
              <Icon name="Calendar" size={10} />
              {new Date(task.deadline).toLocaleDateString("ru", { day: "numeric", month: "short" })}
            </span>
          )}
          {task.comments_count > 0 && (
            <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
              <Icon name="MessageSquare" size={10} />
              {task.comments_count}
            </span>
          )}
        </div>
      </div>

      {task.assignee && (
        <div className="mt-2 pt-2 border-t border-snow-mid text-[10px] text-ink-muted flex items-center gap-1">
          <Icon name="User" size={10} />
          {task.assignee}
        </div>
      )}
    </div>
  );
}

function ListView({ tasks, onStatusChange, onSelect }: {
  tasks: Task[];
  onStatusChange: (id: number, s: Status) => void;
  onSelect: (t: Task) => void;
}) {
  const colMap = Object.fromEntries(COLUMNS.map(c => [c.id, c]));
  return (
    <div className="bg-white border border-snow-dark rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-snow-dark bg-snow">
            <th className="text-left px-5 py-3 text-ink-muted font-medium">Задача</th>
            <th className="text-left px-4 py-3 text-ink-muted font-medium">Проект</th>
            <th className="text-left px-4 py-3 text-ink-muted font-medium">Исполнитель</th>
            <th className="text-left px-4 py-3 text-ink-muted font-medium">Приоритет</th>
            <th className="text-left px-4 py-3 text-ink-muted font-medium">Статус</th>
            <th className="text-left px-4 py-3 text-ink-muted font-medium">Дедлайн</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={6} className="text-center py-12 text-ink-faint">Задач пока нет</td></tr>
          )}
          {tasks.map(task => {
            const pr = PRIORITY_ICONS[task.priority];
            const col = colMap[task.status];
            return (
              <tr
                key={task.id}
                className="border-b border-snow-mid last:border-0 hover:bg-snow cursor-pointer transition-colors"
                onClick={() => onSelect(task)}
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-ink">{task.title}</div>
                  <div className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded-md ${TYPE_COLORS[task.type]}`}>
                    {TYPE_LABELS[task.type]}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{task.project_name || "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{task.assignee || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 ${pr.color}`}>
                    <Icon name={pr.icon as never} size={13} />
                    <span className="text-xs">{pr.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col?.bg} ${col?.color}`}>
                    {col?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted text-xs">
                  {task.deadline ? new Date(task.deadline).toLocaleDateString("ru") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaskForm({ projects, onClose, onCreated }: {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "project" as TaskType,
    project_id: "",
    assignee: "",
    priority: "medium" as Priority,
    deadline: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      assignee: form.assignee,
      priority: form.priority,
      status: "new",
    };
    if (form.project_id) payload.project_id = Number(form.project_id);
    if (form.deadline) payload.deadline = form.deadline;
    if (form.tags.trim()) payload.tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

    await fetch(`${API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark">
          <h2 className="font-semibold text-ink">Новая задача</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Название *</label>
            <input
              className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
              placeholder="Что нужно сделать?"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Описание</label>
            <textarea
              className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors resize-none"
              rows={3}
              placeholder="Подробности..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Тип</label>
              <select
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as TaskType })}
              >
                <option value="project">Проектная</option>
                <option value="personal">Личная</option>
                <option value="client_request">Запрос клиента</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Приоритет</label>
              <select
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Проект</label>
              <select
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors bg-white"
                value={form.project_id}
                onChange={e => setForm({ ...form, project_id: e.target.value })}
              >
                <option value="">— не выбран —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Дедлайн</label>
              <input
                type="date"
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Исполнитель</label>
            <input
              className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
              placeholder="Имя исполнителя"
              value={form.assignee}
              onChange={e => setForm({ ...form, assignee: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Теги (через запятую)</label>
            <input
              className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
              placeholder="дизайн, правка, контент"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-snow-dark">
          <button onClick={onClose} className="flex-1 h-10 border border-snow-dark rounded-xl text-sm text-ink-muted hover:bg-snow transition-colors">
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!form.title.trim() || saving}
            className="flex-1 h-10 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-40"
          >
            {saving ? "Создаю..." : "Создать задачу"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetail({ task, onClose, onStatusChange, onDelete, onUpdated }: {
  task: Task;
  onClose: () => void;
  onStatusChange: (s: Status) => void;
  onDelete: (id: number) => void;
  onUpdated: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API}/?sub=comments&task_id=${task.id}`)
      .then(r => r.json())
      .then(raw => {
        const d = parseBody(raw) as { ok: boolean; comments: Comment[] };
        if (d.ok) setComments(d.comments || []);
      });
  }, [task.id]);

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    const r = await fetch(`${API}/?sub=comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, author: "Дизайнер", body: newComment.trim(), is_internal: isInternal }),
    });
    const raw = await r.json();
    const d = parseBody(raw) as { ok: boolean; id: number };
    if (d.ok) {
      setComments(prev => [...prev, {
        id: d.id, task_id: task.id, author: "Дизайнер",
        body: newComment.trim(), is_internal: isInternal, created_at: new Date().toISOString(),
      }]);
      setNewComment("");
    }
    setSending(false);
  };

  const pr = PRIORITY_ICONS[task.priority];
  const nextStatuses = COLUMNS.filter(c => c.id !== task.status);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-snow-dark">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${TYPE_COLORS[task.type]}`}>
                {TYPE_LABELS[task.type]}
              </span>
              {task.project_name && (
                <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
                  <Icon name="FolderKanban" size={10} />
                  {task.project_name}
                </span>
              )}
            </div>
            <h2 className="font-semibold text-ink text-base leading-snug">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={() => { if (confirm("Удалить задачу?")) onDelete(task.id); }}
              className="text-ink-faint hover:text-red-500 transition-colors"
            >
              <Icon name="Trash2" size={16} />
            </button>
            <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-ink-muted mb-1">Приоритет</div>
              <span className={`flex items-center gap-1.5 ${pr.color}`}>
                <Icon name={pr.icon as never} size={14} />
                {pr.label}
              </span>
            </div>
            <div>
              <div className="text-xs text-ink-muted mb-1">Исполнитель</div>
              <span className="text-ink">{task.assignee || "—"}</span>
            </div>
            {task.deadline && (
              <div>
                <div className="text-xs text-ink-muted mb-1">Дедлайн</div>
                <span className="text-ink flex items-center gap-1">
                  <Icon name="Calendar" size={13} />
                  {new Date(task.deadline).toLocaleDateString("ru")}
                </span>
              </div>
            )}
            <div>
              <div className="text-xs text-ink-muted mb-1">Статус</div>
              <select
                className="border border-snow-dark rounded-lg px-2 py-1 text-sm bg-white outline-none"
                value={task.status}
                onChange={e => onStatusChange(e.target.value as Status)}
              >
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {task.description && (
            <div>
              <div className="text-xs font-medium text-ink-muted mb-2">Описание</div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-snow-mid text-ink-muted rounded-full">{tag}</span>
              ))}
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-ink-muted mb-3">
              Комментарии {comments.length > 0 && <span className="text-ink-faint">({comments.length})</span>}
            </div>

            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className={`rounded-xl p-3 text-sm ${c.is_internal ? "bg-amber-50 border border-amber-100" : "bg-snow-mid"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ink text-xs">{c.author}</span>
                    <div className="flex items-center gap-2">
                      {c.is_internal && <span className="text-[9px] text-amber-600 font-medium">Внутренний</span>}
                      <span className="text-[10px] text-ink-faint">
                        {new Date(c.created_at).toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-ink leading-relaxed">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-6 text-ink-faint text-xs">Комментариев пока нет</div>
              )}
            </div>

            <div className="border border-snow-dark rounded-xl overflow-hidden">
              <textarea
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                rows={2}
                placeholder="Написать комментарий..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) sendComment(); }}
              />
              <div className="flex items-center justify-between px-3 py-2 bg-snow border-t border-snow-dark">
                <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={e => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  Внутренний (только команда)
                </label>
                <button
                  onClick={sendComment}
                  disabled={!newComment.trim() || sending}
                  className="h-7 px-3 bg-ink text-white text-xs rounded-lg disabled:opacity-40 hover:bg-ink-light transition-colors"
                >
                  {sending ? "..." : "Отправить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
