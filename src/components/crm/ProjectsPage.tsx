import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import ProjectCard from "./ProjectCard";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface Project {
  id: number; name: string; client_name: string; status: string;
  deadline: string; total: number; team: { member_name: string }[];
}

const statusStyle: Record<string, string> = {
  draft: "bg-gray-100 text-ink-faint",
  active: "bg-blue-50 text-blue-600",
  done: "bg-green-50 text-green-600",
  paused: "bg-amber-50 text-amber-600",
};
const statusLabel: Record<string, string> = {
  draft: "Черновик", active: "В работе", done: "Завершён", paused: "Пауза",
};

export default function ProjectsPage({ openProjectId, onClearProject }: {
  openProjectId?: number | null;
  onClearProject?: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(openProjectId || null);

  useEffect(() => {
    if (openProjectId) setSelectedId(openProjectId);
  }, [openProjectId]);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=projects`);
      const data = await r.json();
      if (data.ok) setProjects(data.projects || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedId) {
    return <ProjectCard projectId={selectedId} onBack={() => { setSelectedId(null); onClearProject?.(); load(); }} />;
  }

  const filters = ["all", "active", "draft", "done", "paused"];
  const filterLabels: Record<string, string> = { all: "Все", active: "В работе", draft: "Черновик", done: "Завершён", paused: "Пауза" };
  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  const initials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-white rounded-full p-1 border border-snow-dark">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs rounded-full transition-all font-medium ${filter === f ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="FolderKanban" size={32} className="text-ink-faint mx-auto mb-3" />
          <p className="text-sm text-ink-faint">{projects.length === 0 ? "Проектов пока нет" : "Ничего не найдено"}</p>
        </div>
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-snow-dark">
                {["Проект", "Клиент", "Команда", "Дедлайн", "Бюджет", "Статус"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-ink-faint font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-snow-dark">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelectedId(p.id)} className="hover:bg-snow/50 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium">{p.name}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-muted">{p.client_name || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex -space-x-1.5">
                      {(p.team || []).slice(0, 3).map((t, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white">
                          {initials(t.member_name)}
                        </div>
                      ))}
                      {!p.team?.length && <span className="text-xs text-ink-faint">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-muted">
                    {p.deadline ? new Date(p.deadline).toLocaleDateString("ru") : "—"}
                  </td>
                  <td className="px-5 py-4 tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-muted">{p.total ? `${p.total.toLocaleString("ru")} ₽` : "—"}</span>
                      {p.main_estimate_approved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 font-medium whitespace-nowrap">✓ Утверждена</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[p.status] || statusStyle.draft}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}