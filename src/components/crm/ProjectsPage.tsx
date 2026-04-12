import { useState } from "react";
import Icon from "@/components/ui/icon";

const projects = [
  {
    id: 1, name: "Rebrand Luxuria Hotels", client: "Luxuria Group", status: "В работе",
    progress: 75, deadline: "20.04.2024", budget: "₽ 180,000", team: ["АИ", "МС"],
    tasks: { done: 15, total: 20 }
  },
  {
    id: 2, name: "Fintech Dashboard UI", client: "PayNova", status: "В работе",
    progress: 40, deadline: "28.04.2024", budget: "₽ 95,000", team: ["МС", "ЕВ"],
    tasks: { done: 8, total: 20 }
  },
  {
    id: 3, name: "Atlas Brand Identity", client: "Atlas Ventures", status: "Финал",
    progress: 90, deadline: "05.05.2024", budget: "₽ 240,000", team: ["АИ"],
    tasks: { done: 18, total: 20 }
  },
  {
    id: 4, name: "Nova Package Design", client: "Nova Foods", status: "Старт",
    progress: 20, deadline: "15.05.2024", budget: "₽ 60,000", team: ["ЕВ"],
    tasks: { done: 4, total: 20 }
  },
  {
    id: 5, name: "Orbis Motion Kit", client: "Orbis Media", status: "Пауза",
    progress: 55, deadline: "30.05.2024", budget: "₽ 120,000", team: ["МС"],
    tasks: { done: 11, total: 20 }
  },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  "В работе": { color: "text-blue-400", bg: "bg-blue-400/10" },
  "Финал": { color: "text-green-400", bg: "bg-green-400/10" },
  "Старт": { color: "text-gold", bg: "bg-gold/10" },
  "Пауза": { color: "text-foreground/50", bg: "bg-foreground/5" },
};

export default function ProjectsPage() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [filter, setFilter] = useState("Все");

  const filters = ["Все", "В работе", "Финал", "Старт", "Пауза"];
  const filtered = filter === "Все" ? projects : projects.filter(p => p.status === filter);

  const kanbanCols = ["Старт", "В работе", "Финал"];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-onyx-mid rounded-sm p-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-sm transition-all ${filter === f ? "bg-gold text-onyx font-medium" : "text-foreground/50 hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("table")} className={`p-2 rounded-sm transition-colors ${view === "table" ? "text-gold" : "text-foreground/40 hover:text-foreground"}`}>
            <Icon name="List" size={16} />
          </button>
          <button onClick={() => setView("kanban")} className={`p-2 rounded-sm transition-colors ${view === "kanban" ? "text-gold" : "text-foreground/40 hover:text-foreground"}`}>
            <Icon name="Columns" size={16} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="glass rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-onyx-border">
                {["Проект", "Клиент", "Прогресс", "Команда", "Дедлайн", "Бюджет", "Статус"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-foreground/40 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border">
              {filtered.map(p => {
                const sc = statusConfig[p.status];
                return (
                  <tr key={p.id} className="hover:bg-onyx-mid/40 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-foreground/30">{p.tasks.done}/{p.tasks.total} задач</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/60">{p.client}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-onyx-border rounded-full overflow-hidden">
                          <div className="h-full progress-gold" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-foreground/40">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex -space-x-1">
                        {p.team.map(t => (
                          <div key={t} className="w-6 h-6 rounded-full bg-gold/20 border border-onyx flex items-center justify-center text-gold text-[10px] font-bold">
                            {t}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/60">{p.deadline}</td>
                    <td className="px-5 py-4 text-sm text-foreground/60">{p.budget}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-sm ${sc.color} ${sc.bg}`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {kanbanCols.map(col => (
            <div key={col} className="glass rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-onyx-border flex items-center justify-between">
                <span className={`text-sm font-medium ${statusConfig[col]?.color}`}>{col}</span>
                <span className="text-xs text-foreground/30">
                  {projects.filter(p => p.status === col).length}
                </span>
              </div>
              <div className="p-3 space-y-3">
                {projects.filter(p => p.status === col).map(p => (
                  <div key={p.id} className="bg-onyx-mid rounded-sm p-4 cursor-pointer hover:border-gold/20 border border-transparent transition-all">
                    <p className="text-sm font-medium mb-1">{p.name}</p>
                    <p className="text-xs text-foreground/40 mb-3">{p.client}</p>
                    <div className="w-full h-1 bg-onyx-border rounded-full overflow-hidden">
                      <div className="h-full progress-gold" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-1">
                        {p.team.map(t => (
                          <div key={t} className="w-5 h-5 rounded-full bg-gold/20 border border-onyx flex items-center justify-center text-gold text-[9px] font-bold">
                            {t}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-foreground/30">{p.deadline}</span>
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
