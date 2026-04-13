import Icon from "@/components/ui/icon";
import { COLUMNS, PRIORITY_ICONS, TYPE_COLORS, TYPE_LABELS } from "./tasks.types";
import type { Task, Status } from "./tasks.types";

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

export function KanbanBoard({ columns, tasksByStatus, onStatusChange, onSelect }: {
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

export function ListView({ tasks, onStatusChange, onSelect }: {
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
