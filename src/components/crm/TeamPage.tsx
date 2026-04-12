import Icon from "@/components/ui/icon";

const team = [
  { name: "Алексей Иванов", role: "Senior Designer", avatar: "АИ", projects: 5, load: 85, skills: ["Брендинг", "UI/UX", "Моушн"] },
  { name: "Мария Соколова", role: "UI/UX Designer", avatar: "МС", projects: 3, load: 60, skills: ["UI/UX", "Figma", "Прототипирование"] },
  { name: "Егор Васильев", role: "Junior Designer", avatar: "ЕВ", projects: 2, load: 40, skills: ["Графика", "Иллюстрация"] },
  { name: "Ольга Новикова", role: "Art Director", avatar: "ОН", projects: 4, load: 75, skills: ["Арт-дирекция", "Брендинг"] },
];

const loadColor = (v: number) => v >= 80 ? "text-red-400" : v >= 60 ? "text-orange-400" : "text-green-400";
const loadBg = (v: number) => v >= 80 ? "bg-red-400" : v >= 60 ? "bg-orange-400" : "bg-green-400";

export default function TeamPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Дизайнеров", value: "4", icon: "Users" },
          { label: "Проектов всего", value: "14", icon: "FolderKanban" },
          { label: "Средняя нагрузка", value: "65%", icon: "Activity" },
          { label: "Выполнено задач", value: "47", icon: "CheckCircle" },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-4 flex items-center gap-3">
            <Icon name={s.icon} fallback="Circle" size={18} className="text-gold shrink-0" />
            <div>
              <p className="font-cormorant text-2xl font-light text-gold">{s.value}</p>
              <p className="text-xs text-foreground/40">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {team.map(m => (
          <div key={m.name} className="glass glass-hover rounded-sm p-6 cursor-pointer">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gold/15 border-2 border-gold/30 flex items-center justify-center shrink-0">
                <span className="text-gold font-cormorant font-semibold text-lg">{m.avatar}</span>
              </div>
              <div>
                <h3 className="font-medium">{m.name}</h3>
                <p className="text-sm text-foreground/50">{m.role}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {m.skills.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-onyx-mid rounded-sm text-foreground/50">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/50">Нагрузка</span>
                <span className={loadColor(m.load)}>{m.load}%</span>
              </div>
              <div className="h-1.5 bg-onyx-border rounded-full overflow-hidden">
                <div className={`h-full ${loadBg(m.load)} rounded-full transition-all duration-700`} style={{ width: `${m.load}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-foreground/40">
                <span>{m.projects} активных проектов</span>
                <button className="text-gold hover:text-gold-light transition-colors">Распределить →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
