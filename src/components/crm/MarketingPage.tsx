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

const statusConf: Record<string, string> = {
  "Активна": "text-green-400 bg-green-400/10",
  "Завершена": "text-foreground/50 bg-foreground/5",
  "Пауза": "text-orange-400 bg-orange-400/10",
};

const channelIcon: Record<string, string> = {
  "Behance": "Globe",
  "Instagram": "Camera",
  "VC.ru": "FileText",
  "ВКонтакте": "Share2",
};

export default function MarketingPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Охват за месяц", value: "77K", icon: "Eye" },
          { label: "Новых лидов", value: "39", icon: "UserPlus" },
          { label: "Конверсия", value: "2.4%", icon: "TrendingUp" },
          { label: "Кампаний", value: "4", icon: "Megaphone" },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <Icon name={s.icon} fallback="Circle" size={18} className="text-gold mb-3" />
            <p className="font-cormorant text-3xl text-gold">{s.value}</p>
            <p className="text-xs text-foreground/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Campaigns */}
        <div className="lg:col-span-2 glass rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border">
            <h3 className="font-cormorant text-lg">Кампании</h3>
            <button className="text-xs text-gold hover:text-gold-light">+ Новая</button>
          </div>
          <div className="divide-y divide-onyx-border">
            {campaigns.map(c => (
              <div key={c.name} className="px-6 py-4 flex items-center justify-between hover:bg-onyx-mid/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-onyx-mid border border-onyx-border flex items-center justify-center">
                    <Icon name={channelIcon[c.channel] || "Globe"} fallback="Globe" size={14} className="text-gold/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-foreground/40">{c.channel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-foreground/70">{c.reach}</p>
                    <p className="text-xs text-foreground/30">охват</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold">{c.leads}</p>
                    <p className="text-xs text-foreground/30">лидов</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${statusConf[c.status]}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ideas */}
        <div className="glass rounded-sm p-6">
          <h3 className="font-cormorant text-lg mb-5">Идеи контента</h3>
          <div className="space-y-3">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-onyx-mid rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                <p className="text-sm text-foreground/70">{idea}</p>
              </div>
            ))}
            <button className="w-full text-xs text-foreground/30 hover:text-gold transition-colors py-2 border border-dashed border-onyx-border rounded-sm mt-2">
              + Добавить идею
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
