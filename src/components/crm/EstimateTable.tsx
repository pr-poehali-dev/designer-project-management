import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/21fcd16a-d247-4b03-8505-0be9497f8386";

interface WorkItem {
  id: number; name: string; quantity: number; unit: string; price: number; sort_order: number; estimate_id?: number;
}
interface Template { id: number; name: string; item_count: number; }
interface TemplateItem { name: string; quantity: number; unit: string; price: number; }

export default function EstimateTable({ projectId, estimateId, discountPercent, vatMode = "none", vatRate = 20, title = "Смета", onUpdateTitle }: {
  projectId: number; estimateId?: number; discountPercent: number;
  vatMode?: string; vatRate?: number; title?: string; onUpdateTitle?: (name: string) => void;
}) {
  const [estTitle, setEstTitle] = useState(title);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [savedItems, setSavedItems] = useState<string>("[]");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; name: string; items: TemplateItem[] } | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      if (estimateId) {
        const r = await fetch(`${API}?action=estimates&project_id=${projectId}`);
        const data = await r.json();
        if (data.ok) {
          const est = (data.estimates || []).find((e: { id: number }) => e.id === estimateId);
          const loaded = est?.items || [];
          setItems(loaded);
          setSavedItems(JSON.stringify(loaded.map((i: WorkItem) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price }))));
        }
      } else {
        const r = await fetch(`${API}?action=projects&id=${projectId}`);
        const data = await r.json();
        if (data.ok) {
          const loaded = (data.work_items || []).filter((i: WorkItem) => !i.estimate_id);
          setItems(loaded);
          setSavedItems(JSON.stringify(loaded.map((i: WorkItem) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price }))));
        }
      }
    } catch { /* ignore */ }
  }, [projectId, estimateId]);

  const loadTemplates = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=templates`);
      const data = await r.json();
      if (data.ok) setTemplates(data.templates || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Проверяем есть ли несохранённые изменения (только для существующих строк с реальными id)
  const hasUnsaved = (() => {
    const current = JSON.stringify(items.filter(i => i.id > 0).map(i => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price })));
    return current !== savedItems;
  })();

  const updateItemLocal = (id: number, field: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const u = { ...item };
      if (field === "name") u.name = value;
      else if (field === "quantity") u.quantity = parseFloat(value) || 0;
      else if (field === "unit") u.unit = value;
      else if (field === "price") u.price = parseFloat(value) || 0;
      return u;
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const realItems = items.filter(i => i.id > 0);
      await Promise.all(realItems.map(item =>
        fetch(`${API}?action=work_items&id=${item.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, quantity: item.quantity, unit: item.unit, price: item.price }),
        })
      ));
      await load();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch { setSaveStatus("error"); } finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    const realItems = items.filter(i => i.id > 0);
    const maxSort = realItems.length > 0 ? Math.max(...realItems.map(i => i.sort_order)) + 1 : 0;
    const tempId = -Date.now();
    const row: WorkItem = { id: tempId, name: newName.trim(), quantity: 1, unit: "шт", price: 0, sort_order: maxSort };
    setItems(prev => [...prev, row]);
    setNewName("");
    try {
      const r = await fetch(`${API}?action=work_items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, estimate_id: estimateId || null, name: row.name, quantity: 1, unit: "шт", price: 0, sort_order: maxSort }),
      });
      const data = await r.json();
      if (data.ok && data.id) {
        setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id } : i));
        setSavedItems(prev => {
          const arr = JSON.parse(prev);
          arr.push({ id: data.id, name: row.name, quantity: 1, unit: "шт", price: 0 });
          return JSON.stringify(arr);
        });
      }
    } catch { /* ignore */ }
  };

  const removeItem = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSavedItems(prev => JSON.stringify(JSON.parse(prev).filter((i: { id: number }) => i.id !== id)));
    if (id < 0) return;
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
      dragItem.current = null; dragOver.current = null; return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    setItems(reordered);
    dragItem.current = null; dragOver.current = null;
    try {
      await fetch(`${API}?action=reorder`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.filter(i => i.id > 0).map(i => i.id) }),
      });
    } catch { /* ignore */ }
  };

  const applyTemplate = async (templateId: number) => {
    try {
      const r = await fetch(`${API}?action=templates&id=${templateId}&apply=true`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await r.json();
      if (data.ok && data.items) {
        setItems(prev => [...prev, ...data.items]);
        setSavedItems(prev => {
          const arr = JSON.parse(prev);
          data.items.forEach((i: WorkItem) => arr.push({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price }));
          return JSON.stringify(arr);
        });
      }
      setShowTemplates(false);
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
          items: items.filter(i => i.id > 0).map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.price })),
        }),
      });
      setTemplateName(""); setShowSaveAs(false);
      loadTemplates();
    } catch { /* ignore */ } finally { setSavingTemplate(false); }
  };

  const openEditTemplate = async (id: number) => {
    setLoadingTemplateId(id);
    try {
      const r = await fetch(`${API}?action=templates&id=${id}`);
      const data = await r.json();
      if (data.ok) {
        setEditingTemplate({
          id, name: data.template.name,
          items: data.items.map((i: TemplateItem) => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.price })),
        });
      }
    } catch { /* ignore */ } finally { setLoadingTemplateId(null); }
  };

  const saveEditTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await fetch(`${API}?action=templates&id=${editingTemplate.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingTemplate.name, items: editingTemplate.items }),
      });
      setEditingTemplate(null);
      loadTemplates();
    } catch { /* ignore */ }
  };

  const updateTplItem = (idx: number, field: string, value: string) => {
    setEditingTemplate(prev => {
      if (!prev) return prev;
      const updated = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const u = { ...item };
        if (field === "name") u.name = value;
        else if (field === "quantity") u.quantity = parseFloat(value) || 0;
        else if (field === "unit") u.unit = value;
        else if (field === "price") u.price = parseFloat(value) || 0;
        return u;
      });
      return { ...prev, items: updated };
    });
  };

  const addTplItem = () => {
    setEditingTemplate(prev => prev ? { ...prev, items: [...prev.items, { name: "", quantity: 1, unit: "шт", price: 0 }] } : prev);
  };

  const removeTplItem = (idx: number) => {
    setEditingTemplate(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== idx) } : prev);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = subtotal * (discountPercent || 0) / 100;
  const afterDiscount = subtotal - discount;

  const vatAmt = vatMode === "added"
    ? afterDiscount * (vatRate || 20) / 100
    : vatMode === "included"
      ? afterDiscount - afterDiscount / (1 + (vatRate || 20) / 100)
      : 0;
  const total = vatMode === "added" ? afterDiscount + vatAmt : afterDiscount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <Icon name="Calculator" size={16} className="text-ink-muted" />
        {onUpdateTitle ? (
          <input value={estTitle} onChange={e => setEstTitle(e.target.value)}
            onBlur={() => onUpdateTitle(estTitle)}
            className="text-sm font-semibold bg-transparent focus:outline-none focus:bg-snow rounded px-1 py-0.5 -ml-1" />
        ) : (
          <span className="text-sm font-semibold">{title}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowTemplates(!showTemplates); if (!showTemplates) loadTemplates(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${showTemplates ? "bg-ink text-white border-ink" : "bg-white border-snow-dark text-ink-muted hover:text-ink hover:border-ink-faint"}`}>
            <Icon name="FileStack" size={13} /> Шаблоны
          </button>
          {items.filter(i => i.id > 0).length > 0 && (
            <button onClick={() => setShowSaveAs(!showSaveAs)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-white border border-snow-dark text-ink-muted hover:text-ink hover:border-ink-faint transition-all">
              <Icon name="BookmarkPlus" size={13} /> Сохранить как шаблон
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Icon name="Check" size={13} /> Смета сохранена
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <Icon name="AlertCircle" size={13} /> Ошибка
            </span>
          )}
          {hasUnsaved && saveStatus === "idle" && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Icon name="AlertCircle" size={13} /> Есть несохранённые изменения
            </span>
          )}
          <button onClick={saveAll} disabled={saving || !hasUnsaved}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${hasUnsaved ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
            {saving
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Icon name="Save" size={13} />}
            {saving ? "Сохраняю..." : "Сохранить смету"}
          </button>
        </div>
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
            <p className="text-xs text-ink-faint py-2">Шаблонов пока нет. Создайте смету и нажмите «Сохранить как шаблон».</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-1 p-3 rounded-xl border border-snow-dark hover:border-ink-faint transition-all">
                  <button onClick={() => applyTemplate(t.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-snow flex items-center justify-center shrink-0">
                      <Icon name="FileStack" size={14} className="text-ink-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-ink-faint">{t.item_count} позиций</p>
                    </div>
                  </button>
                  <button onClick={() => openEditTemplate(t.id)}
                    className="text-ink-faint hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-snow shrink-0"
                    title="Редактировать">
                    {loadingTemplateId === t.id
                      ? <div className="w-3.5 h-3.5 border border-ink/20 border-t-ink rounded-full animate-spin" />
                      : <Icon name="Pencil" size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setEditingTemplate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark">
              <div className="flex items-center gap-2">
                <Icon name="FileStack" size={16} className="text-ink-muted" />
                <input value={editingTemplate.name}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  className="font-semibold bg-transparent focus:outline-none focus:bg-snow rounded px-2 py-1 -ml-1 text-sm" />
              </div>
              <button onClick={() => setEditingTemplate(null)} className="text-ink-faint hover:text-ink">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-snow-dark bg-snow/50">
                    <th className="text-left px-4 py-2.5 text-xs text-ink-faint font-medium">Наименование</th>
                    <th className="text-right px-3 py-2.5 text-xs text-ink-faint font-medium w-20">Кол-во</th>
                    <th className="text-center px-3 py-2.5 text-xs text-ink-faint font-medium w-14">Ед.</th>
                    <th className="text-right px-3 py-2.5 text-xs text-ink-faint font-medium w-28">Цена</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-snow-dark">
                  {editingTemplate.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-snow/30 group">
                      <td className="px-4 py-2">
                        <input value={item.name} onChange={e => updateTplItem(idx, "name", e.target.value)}
                          placeholder="Название работы..."
                          className="w-full bg-transparent text-sm focus:outline-none focus:bg-snow rounded px-1 py-0.5 hover:bg-snow/50 transition-colors" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity} onChange={e => updateTplItem(idx, "quantity", e.target.value)}
                          className="w-full bg-transparent text-sm text-right focus:outline-none focus:bg-snow rounded px-1 py-0.5 hover:bg-snow/50 transition-colors tabular-nums" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={item.unit} onChange={e => updateTplItem(idx, "unit", e.target.value)}
                          className="w-full bg-transparent text-sm text-center focus:outline-none focus:bg-snow rounded px-1 py-0.5 hover:bg-snow/50 transition-colors" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.price} onChange={e => updateTplItem(idx, "price", e.target.value)}
                          className="w-full bg-transparent text-sm text-right focus:outline-none focus:bg-snow rounded px-1 py-0.5 hover:bg-snow/50 transition-colors tabular-nums" />
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeTplItem(idx)}
                          className="text-ink-faint/0 group-hover:text-ink-faint hover:!text-red-500 transition-colors">
                          <Icon name="Trash2" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-snow/30">
                    <td colSpan={5} className="px-4 py-2.5">
                      <button onClick={addTplItem} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors">
                        <Icon name="Plus" size={13} /> Добавить позицию
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-snow-dark">
              <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors">
                Отмена
              </button>
              <button onClick={saveEditTemplate} className="px-5 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors flex items-center gap-2">
                <Icon name="Save" size={14} /> Сохранить
              </button>
            </div>
          </div>
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
    </div>
  );
}