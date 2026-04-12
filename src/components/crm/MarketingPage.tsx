import Icon from "@/components/ui/icon";

const campaigns = [
  { name: "Кейс: Luxuria Hotels", channel: "Behance", reach: "12,400", leads: 8, status: "Активна" },
  { name: "Рилс для Instagram", channel: "Instagram", reach: "34,000", leads: 15, status: "Активна" },
  { name: "Статья на VC.ru", channel: "VC.ru", reach: "8,700", leads: 5, status: "Завершена" },
  { name: "Таргет ВКонтакте", channel: "ВКонтакте", reach: "22,000", leads: 11, status: "Пауза" },
];

const ideas = [
  "Публикация кейса Atlas на Behance",
  "YouTube: тайм-лапс рабочего процесса",
  "Telegram-канал: закулисье студии",
];

const statusStyle: Record<string, string> = {
  "Активна": "bg-green-50 text-green-600",
  "Завершена": "bg-gray-100 text-ink-faint",
  "Пауза": "bg-amber-50 text-amber-600",
};

export default function MarketingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Охват за месяц", value: "77K", icon: "Eye" },
          { label: "Новых лидов", value: "39", icon: "UserPlus" },
          { label: "Конверсия", value: "2.4%", icon: "TrendingUp" },
          { label: "Кампаний", value: "4", icon: "Megaphone" },
        ].map(s => (
          <div key={s.label} className="card-surface rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center mb-4">
              <Icon name={s.icon} fallback="Circle" size={16} className="text-ink-muted" />
            </div>
            <p className="font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-xs text-ink-faint mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-surface rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark">
            <h3 className="font-display font-semibold">Кампании</h3>
            <button className="text-xs text-ink-muted hover:text-ink font-medium">+ Новая</button>
          </div>
          <div className="divide-y divide-snow-dark">
            {campaigns.map(c => (
              <div key={c.name} className="px-6 py-4 flex items-center justify-between hover:bg-snow/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-ink-faint">{c.channel}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{c.reach}</p>
                    <p className="text-xs text-ink-faint">охват</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{c.leads}</p>
                    <p className="text-xs text-ink-faint">лидов</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[c.status]}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h3 className="font-display font-semibold mb-5">Идеи контента</h3>
          <div className="space-y-3">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-snow rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-ink mt-2 shrink-0" />
                <p className="text-sm text-ink-light">{idea}</p>
              </div>
            ))}
            <button className="w-full text-xs text-ink-faint hover:text-ink transition-colors py-3 border border-dashed border-snow-dark rounded-xl mt-1 font-medium">
              + Добавить идею
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
