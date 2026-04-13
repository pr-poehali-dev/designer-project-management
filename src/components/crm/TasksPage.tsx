import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { API, CRM_API, COLUMNS, parseBody } from "./tasks.types";
import type { Task, Status, Project } from "./tasks.types";
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
