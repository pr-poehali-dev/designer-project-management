import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { API, CRM_API, COLUMNS, PRIORITY_ICONS, parseBody } from "./tasks.types";
import type { Task, Status, Project, Priority } from "./tasks.types";
import { KanbanBoard, ListView } from "./TaskKanban";
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

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

  const assignees = useMemo(() => {
    const set = new Set(tasks.map(t => t.assignee).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (filterProject && String(t.project_id) !== filterProject) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterAssignee, filterProject, filterPriority]);

  const hasFilters = filterAssignee || filterProject || filterPriority;
  const tasksByStatus = (status: Status) => filteredTasks.filter(t => t.status === status);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Шапка */}
      <div className="flex items-center justify-between">
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
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-9 px-4 bg-ink text-white text-sm rounded-full hover:bg-ink-light transition-colors"
        >
          <Icon name="Plus" size={14} />
          Новая задача
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Исполнитель */}
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className={`h-8 text-xs rounded-lg border px-2.5 outline-none transition-colors bg-white ${
            filterAssignee ? "border-ink text-ink font-medium" : "border-snow-dark text-ink-muted"
          }`}
        >
          <option value="">Все исполнители</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Проект */}
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className={`h-8 text-xs rounded-lg border px-2.5 outline-none transition-colors bg-white ${
            filterProject ? "border-ink text-ink font-medium" : "border-snow-dark text-ink-muted"
          }`}
        >
          <option value="">Все проекты</option>
          {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>

        {/* Приоритет */}
        <div className="flex items-center gap-1">
          {(["high", "medium", "low"] as Priority[]).map(p => {
            const pr = PRIORITY_ICONS[p];
            const active = filterPriority === p;
            return (
              <button
                key={p}
                onClick={() => setFilterPriority(active ? "" : p)}
                className={`h-8 px-2.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  active
                    ? `border-current ${pr.color} bg-white font-medium shadow-sm`
                    : "border-snow-dark text-ink-muted hover:border-ink-faint"
                }`}
              >
                <Icon name={pr.icon} size={12} className={active ? pr.color : ""} />
                {pr.label}
              </button>
            );
          })}
        </div>

        {/* Сброс */}
        {hasFilters && (
          <button
            onClick={() => { setFilterAssignee(""); setFilterProject(""); setFilterPriority(""); }}
            className="h-8 px-2.5 rounded-lg border border-snow-dark text-xs text-ink-muted hover:text-ink hover:border-ink-faint transition-colors flex items-center gap-1"
          >
            <Icon name="X" size={12} /> Сбросить
          </button>
        )}

        {hasFilters && (
          <span className="text-xs text-ink-faint">
            {filteredTasks.length} из {tasks.length}
          </span>
        )}
      </div>

      {/* Доска */}
      {loading ? (
        <div className="text-center py-16 text-ink-faint text-sm">Загрузка...</div>
      ) : view === "kanban" ? (
        <KanbanBoard columns={COLUMNS} tasksByStatus={tasksByStatus} onStatusChange={updateStatus} onSelect={setSelectedTask} />
      ) : (
        <ListView tasks={filteredTasks} onStatusChange={updateStatus} onSelect={setSelectedTask} />
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
