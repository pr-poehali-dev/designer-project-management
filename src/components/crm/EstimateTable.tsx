import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { API, WorkItem, Template, TemplateItem } from "./estimate/EstimateTypes";
import EstimateTemplates from "./estimate/EstimateTemplates";
import EstimateItemsTable from "./estimate/EstimateItemsTable";

export default function EstimateTable({ projectId, estimateId, title = "Смета", onUpdateTitle }: {
  projectId: number; estimateId?: number; title?: string; onUpdateTitle?: (name: string) => void;
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
  const [isApproved, setIsApproved] = useState(false);
  const [approvingEstimate, setApprovingEstimate] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatMode, setVatMode] = useState("none");
  const [vatRate, setVatRate] = useState(20);

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      if (estimateId) {
        const r = await fetch(`${API}?action=estimates&project_id=${projectId}`);
        const data = await r.json();
        if (data.ok) {
          const est = (data.estimates || []).find((e: { id: number; is_approved: boolean; discount_percent: number; vat_mode: string; vat_rate: number }) => e.id === estimateId);
          const loaded = est?.items || [];
          setItems(loaded);
          setSavedItems(JSON.stringify(loaded.map((i: WorkItem) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price }))));
          setIsApproved(est?.is_approved || false);
          setDiscountPercent(Number(est?.discount_percent) || 0);
          setVatMode(est?.vat_mode || "none");
          setVatRate(Number(est?.vat_rate) || 20);
        }
      } else {
        const r = await fetch(`${API}?action=projects&id=${projectId}`);
        const data = await r.json();
        if (data.ok) {
          const loaded = (data.work_items || []).filter((i: WorkItem) => !i.estimate_id);
          setItems(loaded);
          setSavedItems(JSON.stringify(loaded.map((i: WorkItem) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, price: i.price }))));
          setIsApproved(data.project?.main_estimate_approved || false);
          setDiscountPercent(Number(data.project?.discount_percent) || 0);
          setVatMode(data.project?.vat_mode || "none");
          setVatRate(Number(data.project?.vat_rate) || 20);
        }
      }
    } catch { /* ignore */ }
  }, [projectId, estimateId]);

  const saveDiscountVat = async (disc: number, vm: string, vr: number) => {
    try {
      if (estimateId) {
        await fetch(`${API}?action=estimates&id=${estimateId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discount_percent: disc, vat_mode: vm, vat_rate: vr }),
        });
      } else {
        await fetch(`${API}?action=projects&id=${projectId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discount_percent: disc, vat_mode: vm, vat_rate: vr }),
        });
      }
    } catch { /* ignore */ }
  };

  const toggleApprove = async () => {
    setApprovingEstimate(true);
    const newVal = !isApproved;
    try {
      if (estimateId) {
        await fetch(`${API}?action=estimates&id=${estimateId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", is_approved: newVal }),
        });
      } else {
        await fetch(`${API}?action=projects&id=${projectId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ main_estimate_approved: newVal }),
        });
      }
      setIsApproved(newVal);
    } catch { /* ignore */ } finally { setApprovingEstimate(false); }
  };

  const loadTemplates = useCallback(async () => {
    try {
      const r = await fetch(`${API}?action=templates`);
      const data = await r.json();
      if (data.ok) setTemplates(data.templates || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Icon name="Calculator" size={16} className="text-ink-muted" />
          {onUpdateTitle ? (
            <input value={estTitle} onChange={e => setEstTitle(e.target.value)}
              onBlur={() => onUpdateTitle(estTitle)}
              className="text-sm font-semibold bg-transparent focus:outline-none focus:bg-snow rounded px-1 py-0.5 -ml-1" />
          ) : (
            <span className="text-sm font-semibold">{title}</span>
          )}
        </div>
        <button onClick={toggleApprove} disabled={approvingEstimate}
          className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
            isApproved
              ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
              : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
          }`}>
          {approvingEstimate
            ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            : <Icon name={isApproved ? "CheckCircle" : "Send"} size={13} />
          }
          {isApproved ? "Утверждена" : "Утвердить смету"}
        </button>
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

      <EstimateTemplates
        showTemplates={showTemplates}
        templates={templates}
        loadingTemplateId={loadingTemplateId}
        applyTemplate={applyTemplate}
        openEditTemplate={openEditTemplate}
        showSaveAs={showSaveAs}
        templateName={templateName}
        setTemplateName={setTemplateName}
        savingTemplate={savingTemplate}
        saveAsTemplate={saveAsTemplate}
        setShowSaveAs={setShowSaveAs}
        editingTemplate={editingTemplate}
        setEditingTemplate={setEditingTemplate}
        updateTplItem={updateTplItem}
        addTplItem={addTplItem}
        removeTplItem={removeTplItem}
        saveEditTemplate={saveEditTemplate}
      />

      <EstimateItemsTable
        items={items}
        newName={newName}
        setNewName={setNewName}
        updateItemLocal={updateItemLocal}
        removeItem={removeItem}
        addItem={addItem}
        handleDragStart={handleDragStart}
        handleDragEnter={handleDragEnter}
        handleDragEnd={handleDragEnd}
        subtotal={subtotal}
        discountPercent={discountPercent}
        discount={discount}
        vatMode={vatMode}
        vatRate={vatRate}
        vatAmt={vatAmt}
        total={total}
        onDiscountChange={setDiscountPercent}
        onVatModeChange={setVatMode}
        onVatRateChange={setVatRate}
        onDiscountVatBlur={saveDiscountVat}
      />
    </div>
  );
}