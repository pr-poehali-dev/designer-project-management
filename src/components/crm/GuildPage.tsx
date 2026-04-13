import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

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

interface Props {
  onHire?: (member: Member) => void;
}

export default function GuildPage({ onHire }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-14 h-14 rounded-2xl object-cover"
                        />
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
                          {member.position && (
                            <p className="text-sm text-ink-muted">{member.position}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                            <Icon name="CheckCircle" size={12} />
                            Берёт заказы
                          </span>
                        </div>
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

                    {onHire && (
                      <button
                        onClick={() => onHire(member)}
                        className="flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors"
                      >
                        <Icon name="UserPlus" size={15} />
                        Пригласить в команду
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
