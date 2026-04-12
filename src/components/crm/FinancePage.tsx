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
    <div className="space-y-5 animate-fade-in">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Выручка этого месяца", value: "₽ 284,000", change: "+18%", icon: "TrendingUp", color: "text-green-400" },
          { label: "Расходы", value: "₽ 48,400", change: "+5%", icon: "TrendingDown", color: "text-red-400" },
          { label: "Прибыль", value: "₽ 235,600", change: "+22%", icon: "Wallet", color: "text-gold" },
          { label: "Ожидается", value: "₽ 395,000", change: "2 платежа", icon: "Clock", color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <Icon name={s.icon} fallback="Circle" size={18} className={`${s.color} mb-3`} />
            <p className={`font-cormorant text-2xl font-light ${s.color}`}>{s.value}</p>
            <p className="text-xs text-foreground/40 mt-1">{s.label}</p>
            <p className="text-xs text-foreground/30 mt-0.5">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-sm p-6">
          <h3 className="font-cormorant text-lg mb-6">Выручка по месяцам</h3>
          <div className="flex items-end gap-3 h-32">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-sm progress-gold opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${(h / maxBar) * 100}%` }}
                />
                <span className="text-[10px] text-foreground/40">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="glass rounded-sm p-6">
          <h3 className="font-cormorant text-lg mb-5">Структура</h3>
          <div className="space-y-4">
            {[
              { label: "Брендинг", pct: 45, color: "bg-gold" },
              { label: "UI/UX", pct: 30, color: "bg-blue-400" },
              { label: "Графика", pct: 15, color: "bg-green-400" },
              { label: "Моушн", pct: 10, color: "bg-orange-400" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground/60">{label}</span>
                  <span className="text-foreground/40">{pct}%</span>
                </div>
                <div className="h-1 bg-onyx-border rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-onyx-border">
          <h3 className="font-cormorant text-lg">Последние операции</h3>
        </div>
        <div className="divide-y divide-onyx-border">
          {transactions.map((t, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-onyx-mid/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-400/10" : "bg-red-400/10"}`}>
                  <Icon name={t.type === "income" ? "ArrowDownLeft" : "ArrowUpRight"} size={14}
                    className={t.type === "income" ? "text-green-400" : "text-red-400"} />
                </div>
                <div>
                  <p className="text-sm">{t.name}</p>
                  <p className="text-xs text-foreground/40">{t.date}</p>
                </div>
              </div>
              <span className={`font-cormorant text-lg font-medium ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
