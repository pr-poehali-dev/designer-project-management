import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API, Act, Invoice } from "../ProjectCardTypes";

interface Props {
  projectId: number;
  acts: Act[];
  invoices: Invoice[];
  setActs: React.Dispatch<React.SetStateAction<Act[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

function fmt(n: number) {
  return n.toLocaleString("ru", { maximumFractionDigits: 0 });
}

const ACT_STATUS: Record<string, string> = {
  draft: "Черновик", sent: "Отправлен", signed: "Подписан",
};
const ACT_STATUS_COLOR: Record<string, string> = {
  draft: "bg-snow-mid text-ink-faint",
  sent: "bg-blue-50 text-blue-600",
  signed: "bg-green-50 text-green-600",
};

function ActRow({ item, kind, onChange }: {
  item: Act | Invoice;
  kind: "act" | "invoice";
  onChange: (id: number, field: string, val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.amount));

  const save = () => {
    onChange(item.id, "name", name);
    onChange(item.id, "amount", amount);
    setEditing(false);
  };

  return (
    <div className="p-4 rounded-2xl border border-snow-dark bg-white space-y-3">
      {editing ? (
        <div className="space-y-2">
          <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink"
            value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink"
            type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={save} className="h-8 px-4 bg-ink text-white text-xs font-medium rounded-lg">Сохранить</button>
            <button onClick={() => setEditing(false)} className="h-8 px-4 border border-snow-dark text-xs rounded-lg">Отмена</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{item.name}</p>
            <p className="text-base font-bold text-ink mt-0.5">{fmt(item.amount)} ₽</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-ink-faint hover:text-ink transition-colors shrink-0 mt-0.5">
            <Icon name="Pencil" size={13} />
          </button>
        </div>
      )}

      {/* Статус */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(ACT_STATUS).map(([s, label]) => (
          <button key={s} onClick={() => onChange(item.id, "status", s)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              item.status === s
                ? `${ACT_STATUS_COLOR[s]} border-current`
                : "border-transparent bg-snow text-ink-faint hover:border-snow-dark"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-ink-faint">
        {new Date(item.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

export default function PanelActs({ projectId, acts, invoices, setActs, setInvoices }: Props) {
  const [addingAct, setAddingAct] = useState(false);
  const [addingInvoice, setAddingInvoice] = useState(false);

  const addItem = async (kind: "act" | "invoice") => {
    if (kind === "act") setAddingAct(true); else setAddingInvoice(true);
    try {
      const r = await fetch(`${API}?action=acts&project_id=${projectId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, project_id: projectId }),
      });
      const data = await r.json();
      if (data.ok) {
        if (kind === "act") setActs(p => [...p, data.item]);
        else setInvoices(p => [...p, data.item]);
      }
    } catch { /* ignore */ } finally {
      if (kind === "act") setAddingAct(false); else setAddingInvoice(false);
    }
  };

  const updateItem = async (id: number, kind: "act" | "invoice", field: string, val: string) => {
    await fetch(`${API}?action=acts&project_id=${projectId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind, [field]: field === "amount" ? parseFloat(val) : val }),
    });
    if (kind === "act") {
      setActs(p => p.map(a => a.id === id ? { ...a, [field]: field === "amount" ? parseFloat(val) : val } : a));
    } else {
      setInvoices(p => p.map(i => i.id === id ? { ...i, [field]: field === "amount" ? parseFloat(val) : val } : i));
    }
  };

  return (
    <div className="space-y-6">
      {/* Акты */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Акты выполненных работ</p>
          <button onClick={() => addItem("act")} disabled={addingAct}
            className="h-7 px-3 bg-ink text-white text-xs font-medium rounded-lg hover:bg-ink-light transition-colors flex items-center gap-1.5 disabled:opacity-40">
            {addingAct ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={12} />}
            Выставить акт
          </button>
        </div>
        {acts.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6 border border-dashed border-snow-dark rounded-2xl">Актов нет</p>
        ) : (
          <div className="space-y-3">
            {acts.map(a => (
              <ActRow key={a.id} item={a} kind="act" onChange={(id, f, v) => updateItem(id, "act", f, v)} />
            ))}
          </div>
        )}
      </div>

      {/* Счета */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Счета</p>
          <button onClick={() => addItem("invoice")} disabled={addingInvoice}
            className="h-7 px-3 bg-ink text-white text-xs font-medium rounded-lg hover:bg-ink-light transition-colors flex items-center gap-1.5 disabled:opacity-40">
            {addingInvoice ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={12} />}
            Выставить счёт
          </button>
        </div>
        {invoices.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6 border border-dashed border-snow-dark rounded-2xl">Счетов нет</p>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <ActRow key={inv.id} item={inv} kind="invoice" onChange={(id, f, v) => updateItem(id, "invoice", f, v)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
