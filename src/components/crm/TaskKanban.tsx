import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COLUMNS, PRIORITY_ICONS, TYPE_COLORS, TYPE_LABELS } from "./tasks.types";
import type { Task, Status } from "./tasks.types";

function formatDeadline(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const isOverdue = d < now;
  const label = d.toLocaleDateString("ru", { day: "numeric", month: "short" });
  return { label, isOverdue };
}

function TaskCard({
  task,
  onSelect,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  onSelect: (t: Task) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
}) {
  const prio = PRIORITY_ICONS[task.priority];
  const deadline = formatDeadline(task.deadline);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(task)}
      className={`bg-white rounded-xl border border-snow-dark p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 ${
        isDragging ? "opacity-40 scale-95 rotate-1 shadow-lg" : "opacity-100"
      }`}
    >
      {/* Тип + приоритет */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[task.type]}`}>
          {TYPE_LABELS[task.type]}
        </span>
        <span className={`flex items-center gap-0.5 text-[11px] font-medium ${prio.color}`}>
          <Icon name={prio.icon} size={11} />
        </span>
      </div>

      {/* Заголовок */}
      <p className="text-sm font-medium text-ink leading-snug mb-2">{task.title}</p>

      {/* Проект */}
      {task.project_name && (
        <p className="text-[11px] text-ink-faint mb-2 truncate flex items-center gap-1">
          <Icon name="FolderKanban" size={10} />
          {task.project_name}
        </p>
      )}

      {/* Теги */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-snow px-1.5 py-0.5 rounded text-ink-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Футер */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-snow">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-ink flex items-center justify-center text-white text-[9px] font-bold shrink-0" title={task.assignee}>
              {task.assignee.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}
          {task.comments_count > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-ink-faint">
              <Icon name="MessageSquare" size={11} /> {task.comments_count}
            </span>
          )}
        </div>
        {deadline && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${deadline.isOverdue ? "text-red-500" : "text-ink-faint"}`}>
            <Icon name="Calendar" size={11} />
            {deadline.label}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  tasks,
  onSelect,
  draggingId,
  draggingTask,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  col: typeof COLUMNS[0];
  tasks: Task[];
  onSelect: (t: Task) => void;
  draggingId: number | null;
  draggingTask: Task | null;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onDrop: (status: Status) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(col.id);
  };

  const isDraggingHere = draggingTask?.status === col.id;

  return (
    <div className="flex flex-col min-w-0" style={{ minWidth: 220, flex: 1 }}>
      {/* Заголовок колонки */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${col.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60 ${col.color}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Дроп-зона */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 rounded-xl transition-all duration-150 min-h-[120px] p-1.5 space-y-2 ${
          isOver && !isDraggingHere
            ? "bg-ink/5 ring-2 ring-ink/20 ring-dashed"
            : "bg-transparent"
        }`}
      >
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={onSelect}
            isDragging={draggingId === task.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Плейсхолдер при перетаскивании */}
        {isOver && draggingTask && !isDraggingHere && (
          <div className="rounded-xl border-2 border-dashed border-ink/20 bg-ink/5 h-16 flex items-center justify-center">
            <span className="text-xs text-ink-faint">Переместить сюда</span>
          </div>
        )}

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-8 text-xs text-ink-faint">Пусто</div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  columns,
  tasksByStatus,
  onStatusChange,
  onSelect,
}: {
  columns: typeof COLUMNS;
  tasksByStatus: (s: Status) => Task[];
  onStatusChange: (id: number, status: Status) => void;
  onSelect: (t: Task) => void;
}) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
    setDraggingTask(task);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggingTask(null);
  };

  const handleDrop = (status: Status) => {
    if (!draggingTask || draggingTask.status === status) return;
    onStatusChange(draggingTask.id, status);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
      {columns.map(col => (
        <KanbanColumn
          key={col.id}
          col={col}
          tasks={tasksByStatus(col.id)}
          onSelect={onSelect}
          draggingId={draggingId}
          draggingTask={draggingTask}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

export function ListView({
  tasks,
  onStatusChange,
  onSelect,
}: {
  tasks: Task[];
  onStatusChange: (id: number, status: Status) => void;
  onSelect: (t: Task) => void;
}) {
  const COL_MAP = Object.fromEntries(COLUMNS.map(c => [c.id, c]));

  return (
    <div className="space-y-2">
      {tasks.length === 0 && (
        <div className="text-center py-16 text-sm text-ink-faint">Задач пока нет</div>
      )}
      {tasks.map(task => {
        const prio = PRIORITY_ICONS[task.priority];
        const col = COL_MAP[task.status];
        const deadline = formatDeadline(task.deadline);
        return (
          <div
            key={task.id}
            onClick={() => onSelect(task)}
            className="flex items-center gap-4 bg-white border border-snow-dark rounded-xl px-4 py-3 hover:shadow-sm cursor-pointer transition-all group"
          >
            <span className={`flex items-center gap-0.5 text-xs font-medium ${prio.color} shrink-0`}>
              <Icon name={prio.icon} size={13} />
            </span>

            <p className="flex-1 text-sm font-medium text-ink truncate">{task.title}</p>

            {task.project_name && (
              <span className="text-xs text-ink-faint hidden md:block truncate max-w-[120px]">{task.project_name}</span>
            )}

            {task.assignee && (
              <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-white text-[9px] font-bold shrink-0" title={task.assignee}>
                {task.assignee.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )}

            {deadline && (
              <span className={`text-xs shrink-0 hidden md:block ${deadline.isOverdue ? "text-red-500 font-medium" : "text-ink-faint"}`}>
                {deadline.label}
              </span>
            )}

            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${col?.bg} ${col?.color}`}>
              {col?.label}
            </span>

            <select
              value={task.status}
              onChange={e => { e.stopPropagation(); onStatusChange(task.id, e.target.value as Status); }}
              onClick={e => e.stopPropagation()}
              className="text-xs border border-snow-dark rounded-lg px-2 py-1 bg-white outline-none opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}
