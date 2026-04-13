import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API } from "./tasks.types";
import type { Priority, TaskType, Project } from "./tasks.types";

export function TaskForm({ projects, onClose, onCreated }: {
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
