import Icon from "@/components/ui/icon";

const transactions = [
  { name: "Rebrand Luxuria — предоплата", date: "10 апр", amount: "+₽ 90,000", type: "income" },
  { name: "Подписка Figma Pro", date: "8 апр", amount: "-₽ 3,400", type: "expense" },
  { name: "PayNova — этап 1", date: "5 апр", amount: "+₽ 47,500", type: "income" },
  { name: "Аренда студии", date: "1 апр", amount: "-₽ 25,000", type: "expense" },
  { name: "Atlas — финальная оплата", date: "28 мар", amount: "+₽ 120,000", type: "income" },
  { name: "Nova Foods — аванс", date: "25 мар", amount: "+₽ 30,000", type: "income" },
];

const months = ["Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр"];
const bars = [180, 220, 195, 260, 290, 310, 284];
const maxBar = Math.max(...bars);

export default function FinancePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Выручка", value: "₽ 284K", change: "+18%", icon: "TrendingUp", positive: true },
          { label: "Расходы", value: "₽ 48K", change: "+5%", icon: "TrendingDown", positive: false },
          { label: "Прибыль", value: "₽ 236K", change: "+22%", icon: "Wallet", positive: true },
          { label: "Ожидается", value: "₽ 395K", change: "2 платежа", icon: "Clock", positive: true },
        ].map(s => (
          <div key={s.label} className="card-surface rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-snow flex items-center justify-center mb-4">
              <Icon name={s.icon} fallback="Circle" size={16} className="text-ink-muted" />
            </div>
            <p className="font-display text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-ink-faint mt-1">{s.label}</p>
            <span className={`text-xs font-medium mt-1 inline-block ${s.positive ? "text-green-600" : "text-red-500"}`}>{s.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-surface rounded-2xl p-6">
          <h3 className="font-display font-semibold mb-6">Выручка по месяцам</h3>
          <div className="flex items-end gap-3 h-36">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-ink rounded-md hover:bg-ink-light transition-colors cursor-pointer"
                  style={{ height: `${(h / maxBar) * 100}%` }}
                />
                <span className="text-[10px] text-ink-faint">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h3 className="font-display font-semibold mb-5">Структура</h3>
          <div className="space-y-4">
            {[
              { label: "Брендинг", pct: 45, color: "bg-ink" },
              { label: "UI/UX", pct: 30, color: "bg-blue-500" },
              { label: "Графика", pct: 15, color: "bg-green-500" },
              { label: "Моушн", pct: 10, color: "bg-amber-500" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-ink-muted">{label}</span>
                  <span className="text-ink-faint">{pct}%</span>
                </div>
                <div className="h-1 bg-snow-dark rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-snow-dark">
          <h3 className="font-display font-semibold">Последние операции</h3>
        </div>
        <div className="divide-y divide-snow-dark">
          {transactions.map((t, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-snow/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-50" : "bg-red-50"}`}>
                  <Icon name={t.type === "income" ? "ArrowDownLeft" : "ArrowUpRight"} size={14}
                    className={t.type === "income" ? "text-green-600" : "text-red-500"} />
                </div>
                <div>
                  <p className="text-sm">{t.name}</p>
                  <p className="text-xs text-ink-faint">{t.date}</p>
                </div>
              </div>
              <span className={`font-display text-base font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
