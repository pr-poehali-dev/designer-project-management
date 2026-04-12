import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface WorkItem {
  id: number; name: string; quantity: number; unit: string; price: number; sort_order: number;
}
interface Template { id: number; name: string; item_count: number; }

export default function EstimateTable({ projectId, discountPercent }: {
  projectId: number; discountPercent: number;
}) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "1", unit: "шт", price: "0" });
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=projects&id=${projectId}`);
      const data = await r.json();
      if (data.ok) {
        setItems((data.work_items || []).filter((i: WorkItem) => i.sort_order >= 0));
      }
    } catch { /* ignore */ }
  }, [projectId]);

  const loadTemplates = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=templates`);
      const data = await r.json();
      if (data.ok) setTemplates(data.templates || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateItemLocal = (id: number, field: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item };
      if (field === "name") updated.name = value;
      else if (field === "quantity") updated.quantity = parseFloat(value) || 0;
      else if (field === "unit") updated.unit = value;
      else if (field === "price") updated.price = parseFloat(value) || 0;
      return updated;
    }));

    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => saveItem(id, field, value), 600);
  };

  const saveItem = async (id: number, field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    if (field === "name") payload.name = value;
    else if (field === "quantity") payload.quantity = parseFloat(value) || 0;
    else if (field === "unit") payload.unit = value;
    else if (field === "price") payload.price = parseFloat(value) || 0;
    try {
      await fetch(`${API}?action=work_items&id=${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch { /* ignore */ }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      const maxSort = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      await fetch(`${API}?action=work_items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId, name: newItem.name,
          quantity: parseFloat(newItem.quantity) || 1,
          unit: newItem.unit || "ш��",
          price: parseFloat(newItem.price) || 0,
          sort_order: maxSort,
        }),
      });
      setNewItem({ name: "", quantity: "1", unit: "шт", price: "0" });
      load();
    } catch { /* ignore */ }
  };

  const removeItem = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`${API}?action=work_items&id=${id}&delete=true`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
    } catch { /* ignore */ }
  };

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOver.current = index; };
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    setItems(reordered);
    dragItem.current = null;
    dragOver.current = null;

    try {
      await fetch(`${API}?action=reorder`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map(i => i.id) }),
      });
    } catch { /* ignore */ }
  };

  const applyTemplate = async (templateId: number) => {
    try {
      await fetch(`${API}?action=templates&id=${templateId}&apply=true`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      setShowTemplates(false);
      load();
    } catch { /* ignore */ }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim() || items.length === 0) return;
    setSavingTemplate(true);
    try {
      await fetch(`${API}?action=templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          items: items.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.price })),
        }),
      });
      setTemplateName("");
      setShowSaveAs(false);
      loadTemplates();
    } catch { /* ignore */ } finally { setSavingTemplate(false); }
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = subtotal * (discountPercent || 0) / 100;
  const total = subtotal - discount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => { setShowTemplates(!showTemplates); if (!showTemplates) loadTemplates(); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${showTemplates ? "bg-ink text-white border-ink" : "bg-white border-snow-dark text-ink-muted hover:text-ink hover:border-ink-faint"}`}>
          <Icon name="FileStack" size={13} /> Шаблоны
        </button>
        {items.length > 0 && (
          <button onClick={() => setShowSaveAs(!showSaveAs)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-white border border-snow-dark text-ink-muted hover:text-ink hover:border-ink-faint transition-all">
            <Icon name="BookmarkPlus" size={13} /> Сохранить как шаблон
          </button>
        )}
      </div>

      {showSaveAs && (
        <div className="card-surface rounded-xl p-4 flex gap-3 animate-fade-in">
          <input value={templateName} onChange={e => setTemplateName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveAsTemplate()}
            placeholder="Название шаблона..." autoFocus
            className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
          <button onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()}
            className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
            {savingTemplate ? "..." : "Сохранить"}
          </button>
          <button onClick={() => setShowSaveAs(false)} className="text-ink-faint hover:text-ink"><Icon name="X" size={16} /></button>
        </div>
      )}

      {showTemplates && (
        <div className="card-surface rounded-xl p-4 animate-fade-in">
          <p className="text-xs text-ink-muted font-medium mb-3">Выберите шаблон для добавления позиций:</p>
          {templates.length === 0 ? (
            <p className="text-xs text-ink-faint py-2">Шаблонов пока нет. Создайте смету и сохраните как шаблон.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-snow-dark hover:border-ink-faint hover:bg-snow/50 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg bg-snow flex items-center justify-center shrink-0">
                    <Icon name="FileStack" size={14} className="text-ink-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[10px] text-ink-faint">{t.item_count} позиций</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
                  {(item.quantity * item.price).toLocaleString("ru")} ₽
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
              <td className="px-3 py-2">
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  placeholder="Новый вид работ..." className="w-full bg-transparent text-sm placeholder:text-ink-faint/50 focus:outline-none px-1 py-0.5" />
              </td>
              <td className="px-3 py-2">
                <input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  className="w-full bg-transparent text-sm text-right focus:outline-none px-1 py-0.5 tabular-nums" />
              </td>
              <td className="px-3 py-2">
                <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  className="w-full bg-transparent text-sm text-center focus:outline-none px-1 py-0.5" />
              </td>
              <td className="px-3 py-2">
                <input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  className="w-full bg-transparent text-sm text-right focus:outline-none px-1 py-0.5 tabular-nums" />
              </td>
              <td className="px-3 py-2"></td>
              <td className="px-2 py-2">
                <button onClick={addItem} disabled={!newItem.name.trim()} className="text-ink-faint hover:text-ink disabled:opacity-30 transition-colors">
                  <Icon name="Plus" size={15} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="border-t border-snow-dark p-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Подитого:</span>
            <span className="tabular-nums">{subtotal.toLocaleString("ru")} ₽</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Скидка {discountPercent}%:</span>
              <span className="text-red-500 tabular-nums">−{discount.toLocaleString("ru")} ₽</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-snow-dark">
            <span>Итого:</span>
            <span className="tabular-nums">{total.toLocaleString("ru")} ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}
