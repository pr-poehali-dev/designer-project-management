import Icon from "@/components/ui/icon";

const clients = [
  { name: "Luxuria Group", contact: "Мария Андреева", email: "m.andreeva@luxuria.ru", projects: 3, revenue: "₽ 540K", status: "VIP", avatar: "LA" },
  { name: "PayNova", contact: "Дмитрий Козлов", email: "d.kozlov@paynova.com", projects: 2, revenue: "₽ 215K", status: "Активный", avatar: "PN" },
  { name: "Atlas Ventures", contact: "Сергей Петров", email: "s.petrov@atlas.vc", projects: 4, revenue: "₽ 780K", status: "VIP", avatar: "AV" },
  { name: "Nova Foods", contact: "Анна Смирнова", email: "a.smirnova@nova.ru", projects: 1, revenue: "₽ 60K", status: "Новый", avatar: "NF" },
  { name: "Orbis Media", contact: "Иван Волков", email: "i.volkov@orbis.media", projects: 2, revenue: "₽ 240K", status: "Активный", avatar: "OM" },
];

const statusConf: Record<string, string> = {
  "VIP": "text-gold bg-gold/10",
  "Активный": "text-green-400 bg-green-400/10",
  "Новый": "text-blue-400 bg-blue-400/10",
};

export default function ClientsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-onyx-mid rounded-sm px-3 py-2 w-64">
          <Icon name="Search" size={14} className="text-foreground/30" />
          <input placeholder="Поиск клиентов..." className="bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none w-full" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 text-gold text-sm rounded-sm hover:bg-gold hover:text-onyx transition-all">
          <Icon name="UserPlus" size={14} />
          Добавить клиента
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map(c => (
          <div key={c.name} className="glass glass-hover rounded-sm p-6 cursor-pointer">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                <span className="text-gold font-cormorant font-semibold text-sm">{c.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-sm shrink-0 ${statusConf[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-xs text-foreground/50 mt-0.5">{c.contact}</p>
              </div>
            </div>
            <div className="flex gap-1 mb-3">
              <Icon name="Mail" size={12} className="text-foreground/30 mt-0.5 shrink-0" />
              <span className="text-xs text-foreground/40 truncate">{c.email}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-onyx-border">
              <div className="text-center">
                <p className="font-cormorant text-xl text-gold">{c.projects}</p>
                <p className="text-xs text-foreground/40">проектов</p>
              </div>
              <div className="w-[1px] h-8 bg-onyx-border" />
              <div className="text-center">
                <p className="font-cormorant text-xl text-foreground">{c.revenue}</p>
                <p className="text-xs text-foreground/40">выручка</p>
              </div>
              <button className="text-foreground/30 hover:text-gold transition-colors">
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
