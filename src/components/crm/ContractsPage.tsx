import Icon from "@/components/ui/icon";

const contracts = [
  { id: "ДГ-2024-001", name: "Rebrand Luxuria Hotels", client: "Luxuria Group", sum: "₽ 180,000", date: "01.04.2024", status: "Подписан" },
  { id: "ДГ-2024-002", name: "Fintech Dashboard UI", client: "PayNova", sum: "₽ 95,000", date: "08.04.2024", status: "Подписан" },
  { id: "ДГ-2024-003", name: "Atlas Brand Identity", client: "Atlas Ventures", sum: "₽ 240,000", date: "15.03.2024", status: "Выполнен" },
  { id: "ДГ-2024-004", name: "Nova Package Design", client: "Nova Foods", sum: "₽ 60,000", date: "10.04.2024", status: "На согласовании" },
  { id: "ДГ-2024-005", name: "Orbis Motion Kit", client: "Orbis Media", sum: "₽ 120,000", date: "20.03.2024", status: "Приостановлен" },
];

const statusStyle: Record<string, string> = {
  "Подписан": "bg-green-50 text-green-600",
  "Выполнен": "bg-gray-100 text-ink-faint",
  "На согласовании": "bg-amber-50 text-amber-600",
  "Приостановлен": "bg-orange-50 text-orange-500",
};

export default function ContractsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Всего: <span className="text-ink font-medium">{contracts.length}</span></p>
        <button className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2">
          <Icon name="Plus" size={14} />
          Новый договор
        </button>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-snow-dark">
              {["Номер", "Проект", "Клиент", "Сумма", "Дата", "Статус", ""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-faint font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-snow-dark">
            {contracts.map(c => (
              <tr key={c.id} className="hover:bg-snow/50 transition-colors cursor-pointer">
                <td className="px-5 py-4 text-xs text-ink-faint font-mono">{c.id}</td>
                <td className="px-5 py-4 text-sm font-medium">{c.name}</td>
                <td className="px-5 py-4 text-sm text-ink-muted">{c.client}</td>
                <td className="px-5 py-4 font-display font-semibold">{c.sum}</td>
                <td className="px-5 py-4 text-sm text-ink-muted">{c.date}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-ink-faint">
                    <button className="hover:text-ink transition-colors"><Icon name="Download" size={14} /></button>
                    <button className="hover:text-ink transition-colors"><Icon name="Eye" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
