import Icon from "@/components/ui/icon";

const clients = [
  { name: "Luxuria Group", contact: "Мария Андреева", email: "m.andreeva@luxuria.ru", projects: 3, revenue: "₽ 540K", status: "VIP", initials: "LG" },
  { name: "PayNova", contact: "Дмитрий Козлов", email: "d.kozlov@paynova.com", projects: 2, revenue: "₽ 215K", status: "Активный", initials: "PN" },
  { name: "Atlas Ventures", contact: "Сергей Петров", email: "s.petrov@atlas.vc", projects: 4, revenue: "₽ 780K", status: "VIP", initials: "AV" },
  { name: "Nova Foods", contact: "Анна Смирнова", email: "a.smirnova@nova.ru", projects: 1, revenue: "₽ 60K", status: "Новый", initials: "NF" },
  { name: "Orbis Media", contact: "Иван Волков", email: "i.volkov@orbis.media", projects: 2, revenue: "₽ 240K", status: "Активный", initials: "OM" },
];

const statusStyle: Record<string, string> = {
  "VIP": "bg-amber-50 text-amber-700",
  "Активный": "bg-green-50 text-green-600",
  "Новый": "bg-blue-50 text-blue-600",
};

export default function ClientsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white border border-snow-dark rounded-full px-4 py-2 w-64">
          <Icon name="Search" size={14} className="text-ink-faint" />
          <input placeholder="Поиск клиентов..." className="bg-transparent text-sm placeholder:text-ink-faint focus:outline-none w-full" />
        </div>
        <button className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="UserPlus" size={14} />
          Добавить
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map(c => (
          <div key={c.name} className="card-surface rounded-2xl p-6 cursor-pointer">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-full bg-ink flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{c.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{c.contact}</p>
              </div>
            </div>
            <p className="text-xs text-ink-faint mb-4">{c.email}</p>
            <div className="flex items-center justify-between pt-4 border-t border-snow-dark">
              <div>
                <p className="font-display text-xl font-semibold">{c.projects}</p>
                <p className="text-xs text-ink-faint">проектов</p>
              </div>
              <div className="w-px h-8 bg-snow-dark" />
              <div>
                <p className="font-display text-xl font-semibold">{c.revenue}</p>
                <p className="text-xs text-ink-faint">выручка</p>
              </div>
              <button className="text-ink-faint hover:text-ink transition-colors">
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
