import { useState } from "react";
import Icon from "@/components/ui/icon";

const projects = [
  { id: 1, name: "Rebrand Luxuria Hotels", client: "Luxuria Group", status: "В работе", progress: 75, deadline: "20.04.2024", budget: "₽ 180,000", team: ["АИ", "МС"], tasks: { done: 15, total: 20 } },
  { id: 2, name: "Fintech Dashboard UI", client: "PayNova", status: "В работе", progress: 40, deadline: "28.04.2024", budget: "₽ 95,000", team: ["МС", "ЕВ"], tasks: { done: 8, total: 20 } },
  { id: 3, name: "Atlas Brand Identity", client: "Atlas Ventures", status: "Финал", progress: 90, deadline: "05.05.2024", budget: "₽ 240,000", team: ["АИ"], tasks: { done: 18, total: 20 } },
  { id: 4, name: "Nova Package Design", client: "Nova Foods", status: "Старт", progress: 20, deadline: "15.05.2024", budget: "₽ 60,000", team: ["ЕВ"], tasks: { done: 4, total: 20 } },
  { id: 5, name: "Orbis Motion Kit", client: "Orbis Media", status: "Пауза", progress: 55, deadline: "30.05.2024", budget: "₽ 120,000", team: ["МС"], tasks: { done: 11, total: 20 } },
];

const statusStyle: Record<string, string> = {
  "В работе": "bg-blue-50 text-blue-600",
  "Финал": "bg-green-50 text-green-600",
  "Старт": "bg-amber-50 text-amber-600",
  "Пауза": "bg-gray-100 text-ink-faint",
};

export default function ProjectsPage() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [filter, setFilter] = useState("Все");

  const filters = ["Все", "В работе", "Финал", "Старт", "Пауза"];
  const filtered = filter === "Все" ? projects : projects.filter(p => p.status === filter);
  const kanbanCols = ["Старт", "В работе", "Финал"];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-white rounded-full p-1 border border-snow-dark">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs rounded-full transition-all font-medium ${filter === f ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-snow-dark">
          <button onClick={() => setView("table")} className={`p-2 rounded-full transition-colors ${view === "table" ? "bg-ink text-white" : "text-ink-faint"}`}>
            <Icon name="List" size={14} />
          </button>
          <button onClick={() => setView("kanban")} className={`p-2 rounded-full transition-colors ${view === "kanban" ? "bg-ink text-white" : "text-ink-faint"}`}>
            <Icon name="Columns" size={14} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="card-surface rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-snow-dark">
                {["Проект", "Клиент", "Прогресс", "Команда", "Дедлайн", "Бюджет", "Статус"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-ink-faint font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-snow-dark">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-snow/50 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-ink-faint">{p.tasks.done}/{p.tasks.total} задач</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-muted">{p.client}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-snow-dark rounded-full overflow-hidden">
                        <div className="h-full progress-bar" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-ink-faint tabular-nums">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex -space-x-1.5">
                      {p.team.map(t => (
                        <div key={t} className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white">
                          {t}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-muted">{p.deadline}</td>
                  <td className="px-5 py-4 text-sm text-ink-muted">{p.budget}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[p.status]}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {kanbanCols.map(col => (
            <div key={col}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-medium">{col}</span>
                <span className="text-xs text-ink-faint bg-snow-mid px-2 py-0.5 rounded-full">
                  {projects.filter(p => p.status === col).length}
                </span>
              </div>
              <div className="space-y-3">
                {projects.filter(p => p.status === col).map(p => (
                  <div key={p.id} className="card-surface rounded-xl p-4 cursor-pointer">
                    <p className="text-sm font-medium mb-1">{p.name}</p>
                    <p className="text-xs text-ink-faint mb-3">{p.client}</p>
                    <div className="w-full h-1 bg-snow-dark rounded-full overflow-hidden">
                      <div className="h-full progress-bar" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-1.5">
                        {p.team.map(t => (
                          <div key={t} className="w-5 h-5 rounded-full bg-ink flex items-center justify-center text-white text-[8px] font-bold ring-2 ring-white">
                            {t}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-ink-faint">{p.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
