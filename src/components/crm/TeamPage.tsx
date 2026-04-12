import Icon from "@/components/ui/icon";

const team = [
  { name: "Алексей Иванов", role: "Senior Designer", initials: "АИ", projects: 5, load: 85, skills: ["Брендинг", "UI/UX", "Моушн"] },
  { name: "Мария Соколова", role: "UI/UX Designer", initials: "МС", projects: 3, load: 60, skills: ["UI/UX", "Figma", "Прототипирование"] },
  { name: "Егор Васильев", role: "Junior Designer", initials: "ЕВ", projects: 2, load: 40, skills: ["Графика", "Иллюстрация"] },
  { name: "Ольга Новикова", role: "Art Director", initials: "ОН", projects: 4, load: 75, skills: ["Арт-дирекция", "Брендинг"] },
];

const loadColor = (v: number) => v >= 80 ? "text-red-500" : v >= 60 ? "text-amber-500" : "text-green-500";
const loadBg = (v: number) => v >= 80 ? "bg-red-500" : v >= 60 ? "bg-amber-500" : "bg-green-500";

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Дизайнеров", value: "4", icon: "Users" },
          { label: "Проектов всего", value: "14", icon: "FolderKanban" },
          { label: "Ср. нагрузка", value: "65%", icon: "Activity" },
          { label: "Выполнено задач", value: "47", icon: "CheckCircle" },
        ].map(s => (
          <div key={s.label} className="card-surface rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-snow flex items-center justify-center shrink-0">
              <Icon name={s.icon} fallback="Circle" size={16} className="text-ink-muted" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-ink-faint">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {team.map(m => (
          <div key={m.name} className="card-surface rounded-2xl p-6 cursor-pointer">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-ink flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{m.initials}</span>
              </div>
              <div>
                <h3 className="font-medium">{m.name}</h3>
                <p className="text-sm text-ink-muted">{m.role}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {m.skills.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-snow rounded-full text-ink-muted font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Нагрузка</span>
                <span className={`font-medium ${loadColor(m.load)}`}>{m.load}%</span>
              </div>
              <div className="h-1.5 bg-snow-dark rounded-full overflow-hidden">
                <div className={`h-full ${loadBg(m.load)} rounded-full transition-all duration-700`} style={{ width: `${m.load}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-faint pt-1">
                <span>{m.projects} активных проектов</span>
                <button className="text-ink hover:underline font-medium">Распределить →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
