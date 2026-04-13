import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";
const CRM_API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

const SPECIALIZATIONS = [
  { id: "", label: "Все", icon: "Users" },
  { id: "designer", label: "Дизайнер", icon: "Palette" },
  { id: "draftsman", label: "Чертежник", icon: "PenTool" },
  { id: "visualizer", label: "Визуализатор", icon: "Monitor" },
  { id: "estimator", label: "Сметчик", icon: "Calculator" },
];

const SPEC_LABELS: Record<string, string> = {
  designer: "Дизайнер",
  draftsman: "Чертежник",
  visualizer: "Визуализатор",
  estimator: "Сметчик",
};

interface Member {
  id: number;
  full_name: string;
  position: string;
  avatar_url: string;
  specializations: string[];
  guild_description: string;
  guild_price_info: string;
  guild_photos: string[];
  taking_orders: boolean;
}

interface Project {
  id: number;
  name: string;
}

interface Props {
  onChat?: (member: Member) => void;
}

export default function GuildPage({ onChat }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [hireModal, setHireModal] = useState<Member | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [hireRole, setHireRole] = useState("");
  const [hiring, setHiring] = useState(false);
  const [hireStatus, setHireStatus] = useState<"idle" | "done" | "error">("idle");

  const load = useCallback(async (spec: string) => {
    setLoading(true);
    try {
      const url = spec
        ? `${API}?action=guild&specialization=${encodeURIComponent(spec)}`
        : `${API}?action=guild`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.ok) setMembers(data.members || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const openHireModal = async (member: Member) => {
    setHireModal(member);
    setSelectedProjectId(null);
    setHireRole("");
    setHireStatus("idle");
    setLoadingProjects(true);
    try {
      const r = await fetch(`${CRM_API}?action=projects`);
      const data = await r.json();
      if (data.ok) setProjects(data.projects || []);
    } catch { /* ignore */ } finally { setLoadingProjects(false); }
  };

  const confirmHire = async () => {
    if (!hireModal || !selectedProjectId) return;
    setHiring(true);
    try {
      const r = await fetch(`${CRM_API}?action=team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProjectId,
          member_name: hireModal.full_name,
          role: hireRole || (hireModal.specializations?.[0] ? SPEC_LABELS[hireModal.specializations[0]] : ""),
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setHireStatus("done");
        setTimeout(() => setHireModal(null), 1500);
      } else { setHireStatus("error"); }
    } catch { setHireStatus("error"); } finally { setHiring(false); }
  };

  const initials = (name: string) =>
    name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2">
        {SPECIALIZATIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s.id
                ? "bg-ink text-white"
                : "bg-white border border-snow-dark text-ink-muted hover:text-ink hover:border-ink/30"
            }`}
          >
            <Icon name={s.icon} size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="card-surface rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-snow flex items-center justify-center">
            <Icon name="Users" size={28} className="text-ink-faint" />
          </div>
          <div>
            <p className="font-semibold text-ink">Пока никого нет</p>
            <p className="text-sm text-ink-faint mt-1">
              {filter
                ? "Дизайнеры с этой специализацией не берут заказы"
                : "Никто ещё не отметил, что берёт заказы"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map(member => {
            const expanded = expandedId === member.id;
            return (
              <div key={member.id} className="card-surface rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-14 h-14 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{initials(member.full_name)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-base">{member.full_name || "Без имени"}</h3>
                          {member.position && <p className="text-sm text-ink-muted">{member.position}</p>}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg shrink-0">
                          <Icon name="CheckCircle" size={12} />
                          Берёт заказы
                        </span>
                      </div>

                      {member.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {member.specializations.map(s => (
                            <span key={s} className="text-xs bg-snow border border-snow-dark px-2.5 py-1 rounded-lg text-ink-muted">
                              {SPEC_LABELS[s] || s}
                            </span>
                          ))}
                        </div>
                      )}

                      {member.guild_description && (
                        <p className={`text-sm text-ink-muted mt-3 ${!expanded ? "line-clamp-2" : ""}`}>
                          {member.guild_description}
                        </p>
                      )}

                      {member.guild_price_info && expanded && (
                        <div className="mt-3 p-3 bg-snow rounded-xl">
                          <p className="text-xs text-ink-muted font-medium mb-1">Цены и условия</p>
                          <p className="text-sm text-ink-muted">{member.guild_price_info}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {expanded && member.guild_photos?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-ink-muted font-medium mb-2">Портфолио</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {member.guild_photos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <div className="aspect-square rounded-xl overflow-hidden border border-snow-dark hover:opacity-80 transition-opacity">
                              <img src={url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-snow-dark">
                    <button
                      onClick={() => setExpandedId(expanded ? null : member.id)}
                      className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
                    >
                      <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} />
                      {expanded ? "Свернуть" : "Подробнее"}
                    </button>

                    <div className="flex items-center gap-2">
                      {onChat && (
                        <button
                          onClick={() => onChat(member)}
                          className="flex items-center gap-2 px-4 py-2 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors text-ink-muted hover:text-ink"
                        >
                          <Icon name="MessageSquare" size={15} />
                          Написать
                        </button>
                      )}
                      <button
                        onClick={() => openHireModal(member)}
                        className="flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors"
                      >
                        <Icon name="UserPlus" size={15} />
                        В команду
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHireModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">{initials(hireModal.full_name)}</span>
              </div>
              <div>
                <h3 className="font-semibold">Пригласить в команду</h3>
                <p className="text-sm text-ink-muted">{hireModal.full_name}</p>
              </div>
              <button onClick={() => setHireModal(null)} className="ml-auto text-ink-faint hover:text-ink">
                <Icon name="X" size={18} />
              </button>
            </div>

            {hireStatus === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-green-600" />
                </div>
                <p className="font-medium text-green-700">Добавлен в команду проекта!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-ink-muted font-medium mb-1.5 block">Выберите проект</label>
                    {loadingProjects ? (
                      <div className="flex items-center gap-2 text-sm text-ink-faint py-2">
                        <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                        Загружаю проекты...
                      </div>
                    ) : projects.length === 0 ? (
                      <p className="text-sm text-ink-faint">Нет активных проектов</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProjectId(p.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                              selectedProjectId === p.id
                                ? "bg-ink text-white"
                                : "bg-snow border border-snow-dark hover:border-ink/30"
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-ink-muted font-medium mb-1.5 block">Роль в проекте (необязательно)</label>
                    <input
                      value={hireRole}
                      onChange={e => setHireRole(e.target.value)}
                      placeholder={hireModal.specializations?.[0] ? SPEC_LABELS[hireModal.specializations[0]] : "Исполнитель"}
                      className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm placeholder:text-ink-faint/50 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all"
                    />
                  </div>

                  {hireStatus === "error" && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Icon name="AlertCircle" size={13} /> Ошибка. Попробуй ещё раз.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setHireModal(null)}
                    className="flex-1 px-4 py-2.5 border border-snow-dark rounded-xl text-sm font-medium text-ink-muted hover:bg-snow transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmHire}
                    disabled={!selectedProjectId || hiring}
                    className="flex-1 px-4 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink-light transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {hiring
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Icon name="UserPlus" size={15} />
                    }
                    {hiring ? "Добавляю..." : "Добавить"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
