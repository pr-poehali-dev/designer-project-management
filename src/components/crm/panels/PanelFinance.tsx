import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API, Payment } from "../ProjectCardTypes";

interface Props {
  projectId: number;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  payTotal: number;
  payPaid: number;
  onReload: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("ru", { maximumFractionDigits: 0 });
}

export default function PanelFinance({ projectId, payments, setPayments, payTotal, payPaid, onReload }: Props) {
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const remaining = payTotal - payPaid;
  const pct = payTotal > 0 ? Math.round((payPaid / payTotal) * 100) : 0;

  const addPayment = async () => {
    if (!newAmount || !newLabel.trim()) return;
    setAdding(true);
    try {
      const r = await fetch(`${API}?action=payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          amount: parseFloat(newAmount),
          label: newLabel,
          due_date: newDueDate || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setPayments(p => [...p, data.payment]);
        setNewLabel(""); setNewAmount(""); setNewDueDate("");
        onReload();
      }
    } catch { /* ignore */ } finally { setAdding(false); }
  };

  const togglePaid = async (id: number, currentPaid: boolean) => {
    await fetch(`${API}?action=payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, action: "mark_paid", id, is_paid: !currentPaid }),
    });
    setPayments(p => p.map(pay => pay.id === id
      ? { ...pay, is_paid: !currentPaid, paid_at: !currentPaid ? new Date().toISOString() : null }
      : pay));
    onReload();
  };

  const deletePayment = async (id: number) => {
    await fetch(`${API}?action=payments&id=${id}&project_id=${projectId}`, { method: "DELETE" });
    setPayments(p => p.filter(pay => pay.id !== id));
    onReload();
  };

  return (
    <div className="space-y-6">
      {/* Итоги */}
      {payTotal > 0 && (
        <div className="p-4 rounded-2xl bg-snow border border-snow-dark space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-ink-faint mb-0.5">Всего</p>
              <p className="text-sm font-bold text-ink">{fmt(payTotal)} ₽</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint mb-0.5">Получено</p>
              <p className="text-sm font-bold text-green-600">{fmt(payPaid)} ₽</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint mb-0.5">Осталось</p>
              <p className="text-sm font-bold text-amber-600">{fmt(remaining)} ₽</p>
            </div>
          </div>
          <div className="w-full bg-snow-dark rounded-full h-2">
            <div className="bg-ink rounded-full h-2 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-center text-ink-faint">{pct}% оплачено</p>
        </div>
      )}

      {/* Список платежей */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">График платежей</p>
        {payments.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center">Платежи не добавлены</p>
        ) : (
          <div className="space-y-2">
            {payments.map(pay => (
              <div key={pay.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                pay.is_paid ? "bg-green-50/40 border-green-100" : "bg-white border-snow-dark"}`}>
                <button onClick={() => togglePaid(pay.id, pay.is_paid)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    pay.is_paid ? "bg-green-500 border-green-500" : "border-snow-dark hover:border-ink"}`}>
                  {pay.is_paid && <Icon name="Check" size={11} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${pay.is_paid ? "line-through text-ink-faint" : "text-ink"}`}>
                    {pay.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-bold text-ink">{fmt(pay.amount)} ₽</p>
                    {pay.due_date && (
                      <span className="text-xs text-ink-faint">
                        · {new Date(pay.due_date).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {pay.paid_at && (
                      <span className="text-xs text-green-600">
                        · Оплачено {new Date(pay.paid_at).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deletePayment(pay.id)} className="text-ink-faint hover:text-red-500 transition-colors mt-0.5 shrink-0">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Добавить платёж */}
      <div className="border border-snow-dark rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-ink-muted">Добавить платёж</p>
        <input
          className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white"
          placeholder="Название (напр: Аванс при подписании договора)"
          value={newLabel} onChange={e => setNewLabel(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white"
            type="number" placeholder="Сумма, ₽"
            value={newAmount} onChange={e => setNewAmount(e.target.value)}
          />
          <input
            className="border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white"
            type="date" title="Когда должна поступить оплата"
            value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
          />
        </div>
        <button onClick={addPayment} disabled={adding || !newLabel || !newAmount}
          className="w-full h-9 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={14} />}
          Добавить
        </button>
      </div>
    </div>
  );
}
