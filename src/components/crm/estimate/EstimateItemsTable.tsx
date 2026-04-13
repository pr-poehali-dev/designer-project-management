import Icon from "@/components/ui/icon";
import { WorkItem } from "./EstimateTypes";

interface EstimateItemsTableProps {
  items: WorkItem[];
  newName: string;
  setNewName: (name: string) => void;
  updateItemLocal: (id: number, field: string, value: string) => void;
  removeItem: (id: number) => void;
  addItem: () => void;
  handleDragStart: (index: number) => void;
  handleDragEnter: (index: number) => void;
  handleDragEnd: () => void;
  subtotal: number;
  discountPercent: number;
  discount: number;
  vatMode: string;
  vatRate: number;
  vatAmt: number;
  total: number;
  onDiscountChange?: (v: number) => void;
  onVatModeChange?: (v: string) => void;
  onVatRateChange?: (v: number) => void;
  onDiscountVatBlur?: (d: number, m: string, r: number) => void;
}

export default function EstimateItemsTable({
  items,
  newName,
  setNewName,
  updateItemLocal,
  removeItem,
  addItem,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
  subtotal,
  discountPercent,
  discount,
  vatMode,
  vatRate,
  vatAmt,
  total,
  onDiscountChange,
  onVatModeChange,
  onVatRateChange,
  onDiscountVatBlur,
}: EstimateItemsTableProps) {
  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-snow-dark bg-snow/50">
            <th className="w-8 px-2"></th>
            <th className="text-left px-3 py-3 text-xs text-ink-faint font-medium w-8">#</th>
            <th className="text-left px-3 py-3 text-xs text-ink-faint font-medium">Наименование</th>
            <th className="text-right px-3 py-3 text-xs text-ink-faint font-medium w-20">Кол-во</th>
            <th className="text-center px-3 py-3 text-xs text-ink-faint font-medium w-16">Ед.</th>
            <th className="text-right px-3 py-3 text-xs text-ink-faint font-medium w-28">Цена</th>
            <th className="text-right px-3 py-3 text-xs text-ink-faint font-medium w-28">Сумма</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-snow-dark">
          {items.map((item, i) => (
            <tr key={item.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="hover:bg-snow/30 transition-colors group">
              <td className="px-2 py-2 cursor-grab active:cursor-grabbing">
                <Icon name="GripVertical" size={14} className="text-ink-faint/40 group-hover:text-ink-faint transition-colors" />
              </td>
              <td className="px-3 py-2 text-xs text-ink-faint">{i + 1}</td>
              <td className="px-3 py-2">
                <input value={item.name} onChange={e => updateItemLocal(item.id, "name", e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none focus:bg-snow rounded px-1 py-0.5 -ml-1 transition-colors hover:bg-snow/50" />
              </td>
              <td className="px-3 py-2">
                <input type="number" value={item.quantity} onChange={e => updateItemLocal(item.id, "quantity", e.target.value)}
                  className="w-full bg-transparent text-sm text-right focus:outline-none focus:bg-snow rounded px-1 py-0.5 transition-colors hover:bg-snow/50 tabular-nums" />
              </td>
              <td className="px-3 py-2">
                <input value={item.unit} onChange={e => updateItemLocal(item.id, "unit", e.target.value)}
                  className="w-full bg-transparent text-sm text-center focus:outline-none focus:bg-snow rounded px-1 py-0.5 transition-colors hover:bg-snow/50" />
              </td>
              <td className="px-3 py-2">
                <input type="number" value={item.price} onChange={e => updateItemLocal(item.id, "price", e.target.value)}
                  className="w-full bg-transparent text-sm text-right focus:outline-none focus:bg-snow rounded px-1 py-0.5 transition-colors hover:bg-snow/50 tabular-nums" />
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium tabular-nums select-none">
                {(item.quantity * item.price).toLocaleString("ru")} &#8381;
              </td>
              <td className="px-2 py-2">
                <button onClick={() => removeItem(item.id)}
                  className="text-ink-faint/0 group-hover:text-ink-faint hover:!text-red-500 transition-colors">
                  <Icon name="Trash2" size={13} />
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-snow/30">
            <td className="px-2 py-2"></td>
            <td className="px-3 py-2 text-xs text-ink-faint">+</td>
            <td className="px-3 py-2" colSpan={5}>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="Введите название и нажмите Enter..."
                className="w-full bg-transparent text-sm placeholder:text-ink-faint/50 focus:outline-none px-1 py-0.5" />
            </td>
            <td className="px-2 py-2">
              <button onClick={addItem} disabled={!newName.trim()} className="text-ink-faint hover:text-ink disabled:opacity-30 transition-colors">
                <Icon name="Plus" size={15} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {/* Скидка и НДС — между позициями и итогами */}
      {onDiscountChange && (
        <div className="border-t border-snow-dark px-4 py-3 flex flex-wrap items-end gap-4 bg-snow/50">
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1 block">Скидка, %</label>
            <input type="number" min={0} max={100} value={discountPercent}
              onChange={e => onDiscountChange(Number(e.target.value))}
              onBlur={() => onDiscountVatBlur?.(discountPercent, vatMode, vatRate)}
              className="w-20 bg-white border border-snow-dark rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          </div>
          <div>
            <label className="text-xs text-ink-muted font-medium mb-1 block">НДС</label>
            <select value={vatMode}
              onChange={e => { onVatModeChange?.(e.target.value); onDiscountVatBlur?.(discountPercent, e.target.value, vatRate); }}
              className="bg-white border border-snow-dark rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10">
              <option value="none">Без НДС</option>
              <option value="included">В т.ч. НДС</option>
              <option value="added">Сверх суммы</option>
            </select>
          </div>
          {vatMode !== "none" && (
            <div>
              <label className="text-xs text-ink-muted font-medium mb-1 block">Ставка, %</label>
              <input type="number" min={0} max={100} value={vatRate}
                onChange={e => onVatRateChange?.(Number(e.target.value))}
                onBlur={() => onDiscountVatBlur?.(discountPercent, vatMode, vatRate)}
                className="w-20 bg-white border border-snow-dark rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            </div>
          )}
        </div>
      )}

      <div className="border-t border-snow-dark p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Итого:</span>
          <span className="tabular-nums">{subtotal.toLocaleString("ru")} &#8381;</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Скидка {discountPercent}%:</span>
            <span className="text-red-500 tabular-nums">&minus;{discount.toLocaleString("ru")} &#8381;</span>
          </div>
        )}
        {vatMode !== "none" && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">
              {vatMode === "included" ? `В т.ч. НДС ${vatRate}%` : `НДС ${vatRate}%`}:
            </span>
            <span className="tabular-nums">{Math.round(vatAmt).toLocaleString("ru")} &#8381;</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-snow-dark">
          <span>{vatMode === "added" ? "Итого с НДС:" : "Итого:"}</span>
          <span className="tabular-nums">{Math.round(total).toLocaleString("ru")} &#8381;</span>
        </div>
      </div>
    </div>
  );
}