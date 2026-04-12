import Icon from "@/components/ui/icon";

const stats = [
  { label: "Активных проектов", value: "12", change: "+3", icon: "FolderKanban", color: "text-gold" },
  { label: "Клиентов", value: "34", change: "+5", icon: "Users", color: "text-blue-400" },
  { label: "Выручка (мес.)", value: "₽ 284K", change: "+18%", icon: "TrendingUp", color: "text-green-400" },
  { label: "Задач на неделе", value: "28", change: "7 просрочено", icon: "CheckSquare", color: "text-orange-400" },
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

const statusColor: Record<string, string> = {
  "В работе": "text-blue-400 bg-blue-400/10",
  "Финал": "text-green-400 bg-green-400/10",
  "Старт": "text-gold bg-gold/10",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <Icon name={s.icon} fallback="Circle" size={18} className={s.color} />
              <span className="text-xs text-green-400/70">{s.change}</span>
            </div>
            <div className={`font-cormorant text-3xl font-light ${s.color}`}>{s.value}</div>
            <p className="text-foreground/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects table */}
        <div className="lg:col-span-2 glass rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border">
            <h3 className="font-cormorant text-lg">Активные проекты</h3>
            <span className="text-xs text-gold cursor-pointer hover:text-gold-light">Все →</span>
          </div>
          <div className="divide-y divide-onyx-border">
            {recentProjects.map(p => (
              <div key={p.name} className="px-6 py-4 hover:bg-onyx-mid/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-foreground/40">{p.client}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold">
                      {p.assignee}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${statusColor[p.status]}`}>{p.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-onyx-border rounded-full overflow-hidden">
                    <div className="h-full progress-gold rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs text-foreground/40 shrink-0">{p.progress}%</span>
                  <span className="text-xs text-foreground/30 shrink-0">до {p.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="glass rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-onyx-border">
            <h3 className="font-cormorant text-lg">Активность</h3>
          </div>
          <div className="p-6 space-y-4">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-onyx-mid border border-onyx-border flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name={a.icon} fallback="Circle" size={12} className="text-gold/60" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70 leading-snug">{a.text}</p>
                  <p className="text-xs text-foreground/30 mt-1">{a.time} назад</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
