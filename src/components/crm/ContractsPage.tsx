import Icon from "@/components/ui/icon";

const contracts = [
  { id: "ДГ-2024-001", name: "Rebrand Luxuria Hotels", client: "Luxuria Group", sum: "₽ 180,000", date: "01.04.2024", status: "Подписан" },
  { id: "ДГ-2024-002", name: "Fintech Dashboard UI", client: "PayNova", sum: "₽ 95,000", date: "08.04.2024", status: "Подписан" },
  { id: "ДГ-2024-003", name: "Atlas Brand Identity", client: "Atlas Ventures", sum: "₽ 240,000", date: "15.03.2024", status: "Выполнен" },
  { id: "ДГ-2024-004", name: "Nova Package Design", client: "Nova Foods", sum: "₽ 60,000", date: "10.04.2024", status: "На согласовании" },
  { id: "ДГ-2024-005", name: "Orbis Motion Kit", client: "Orbis Media", sum: "₽ 120,000", date: "20.03.2024", status: "Приостановлен" },
];

const statusConf: Record<string, string> = {
  "Подписан": "text-green-400 bg-green-400/10",
  "Выполнен": "text-foreground/50 bg-foreground/5",
  "На согласовании": "text-gold bg-gold/10",
  "Приостановлен": "text-orange-400 bg-orange-400/10",
};

export default function ContractsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/50">Всего договоров: <span className="text-foreground">{contracts.length}</span></div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 text-gold text-sm rounded-sm hover:bg-gold hover:text-onyx transition-all">
          <Icon name="Plus" size={14} />
          Новый договор
        </button>
      </div>

      <div className="glass rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-onyx-border">
              {["Номер", "Проект", "Клиент", "Сумма", "Дата", "Статус", ""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-foreground/40 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-onyx-border">
            {contracts.map(c => (
              <tr key={c.id} className="hover:bg-onyx-mid/40 transition-colors cursor-pointer">
                <td className="px-5 py-4 text-xs text-foreground/50 font-mono">{c.id}</td>
                <td className="px-5 py-4 text-sm">{c.name}</td>
                <td className="px-5 py-4 text-sm text-foreground/60">{c.client}</td>
                <td className="px-5 py-4 font-cormorant text-base text-gold">{c.sum}</td>
                <td className="px-5 py-4 text-sm text-foreground/50">{c.date}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-sm ${statusConf[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-foreground/30">
                    <button className="hover:text-foreground transition-colors"><Icon name="Download" size={14} /></button>
                    <button className="hover:text-gold transition-colors"><Icon name="Eye" size={14} /></button>
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
