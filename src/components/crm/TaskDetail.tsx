import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, COLUMNS, PRIORITY_ICONS, TYPE_COLORS, TYPE_LABELS, parseBody } from "./tasks.types";
import type { Task, Comment, Status } from "./tasks.types";

export function TaskDetail({ task, onClose, onStatusChange, onDelete, onUpdated }: {
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
