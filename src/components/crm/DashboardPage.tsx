import Icon from "@/components/ui/icon";

const stats = [
  { label: "Активных проектов", value: "12", change: "+3", icon: "FolderKanban" },
  { label: "Клиентов", value: "34", change: "+5", icon: "Users" },
  { label: "Выручка (мес.)", value: "₽ 284K", change: "+18%", icon: "TrendingUp" },
  { label: "Задач на неделе", value: "28", change: "7 срочных", icon: "CheckSquare" },
];

const recentProjects = [
  { name: "Rebrand Luxuria Hotels", client: "Luxuria Group", deadline: "20 апр", progress: 75, status: "В работе", assignee: "АИ" },
  { name: "Fintech Dashboard UI", client: "PayNova", deadline: "28 апр", progress: 40, status: "В работе", assignee: "МС" },
  { name: "Atlas Brand Identity", client: "Atlas Ventures", deadline: "5 мая", progress: 90, status: "Финал", assignee: "АИ" },
  { name: "Nova Package Design", client: "Nova Foods", deadline: "15 мая", progress: 20, status: "Старт", assignee: "ЕВ" },
];

const activities = [
  { text: "Загружен финальный макет для Luxuria", time: "10 мин", icon: "Upload" },
  { text: "Новый комментарий от PayNova", time: "1 час", icon: "MessageSquare" },
  { text: "Договор с Atlas Ventures подписан", time: "3 часа", icon: "FileCheck" },
  { text: "Новый клиент: Nova Foods", time: "вчера", icon: "UserPlus" },
];

const statusStyle: Record<string, string> = {
  "В работе": "bg-blue-50 text-blue-600",
  "Финал": "bg-green-50 text-green-600",
  "Старт": "bg-amber-50 text-amber-600",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card-surface rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center">
                <Icon name={s.icon} fallback="Circle" size={16} className="text-ink-muted" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.change}</span>
            </div>
            <div className="font-display text-3xl font-semibold tracking-tight">{s.value}</div>
            <p className="text-sm text-ink-faint mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-surface rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark">
            <h3 className="font-display font-semibold">Активные проекты</h3>
            <button className="text-xs text-ink-muted hover:text-ink transition-colors">Все →</button>
          </div>
          <div className="divide-y divide-snow-dark">
            {recentProjects.map(p => (
              <div key={p.name} className="px-6 py-4 hover:bg-snow/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-ink-faint">{p.client}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">
                      {p.assignee}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[p.status]}`}>{p.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-snow-dark rounded-full overflow-hidden">
                    <div className="h-full progress-bar" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs text-ink-muted tabular-nums">{p.progress}%</span>
                  <span className="text-xs text-ink-faint">до {p.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-snow-dark">
            <h3 className="font-display font-semibold">Активность</h3>
          </div>
          <div className="p-5 space-y-4">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-snow flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name={a.icon} fallback="Circle" size={12} className="text-ink-muted" />
                </div>
                <div>
                  <p className="text-sm text-ink-light leading-snug">{a.text}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{a.time} назад</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
