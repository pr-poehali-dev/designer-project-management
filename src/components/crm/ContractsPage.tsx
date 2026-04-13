import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

interface BriefTemplate {
  fields: BriefField[];
  intro: string;
}

interface BriefField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "number" | "textarea";
  enabled: boolean;
}

const DEFAULT_FIELDS: BriefField[] = [
  { key: "style",         label: "Стиль интерьера",    placeholder: "Современный, скандинавский...",    type: "text",     enabled: true },
  { key: "area",          label: "Площадь (м²)",       placeholder: "85",                               type: "number",   enabled: true },
  { key: "budget",        label: "Бюджет (₽)",         placeholder: "1 500 000",                        type: "number",   enabled: true },
  { key: "rooms",         label: "Комнаты",            placeholder: "Гостиная, спальня, 2 детских...", type: "text",     enabled: true },
  { key: "color_palette", label: "Цветовая палитра",   placeholder: "Светлые тона, акцент терракот...", type: "text",     enabled: true },
  { key: "furniture",     label: "Пожелания по мебели",placeholder: "ИКЕА, итальянские бренды...",      type: "text",     enabled: true },
  { key: "restrictions",  label: "Ограничения",        placeholder: "Нельзя трогать несущие стены...",  type: "text",     enabled: true },
  { key: "wishes",        label: "Пожелания",          placeholder: "Открытая планировка, свет...",     type: "textarea", enabled: true },
  { key: "extra",         label: "Дополнительно",      placeholder: "Любая другая информация...",       type: "textarea", enabled: true },
];

type Tab = "brief";

export default function ContractsPage() {
  const [tab] = useState<Tab>("brief");

  // Brief template state
  const [fields, setFields] = useState<BriefField[]>(DEFAULT_FIELDS);
  const [intro, setIntro] = useState("Добрый день! Перед началом работы просим заполнить бриф — это поможет нам лучше понять ваши пожелания и создать идеальный интерьер.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState({ label: "", placeholder: "", type: "text" as BriefField["type"] });

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?action=brief_template`);
      const data = await r.json();
      if (data.ok && data.template) {
        if (data.template.fields?.length) setFields(data.template.fields);
        if (data.template.intro) setIntro(data.template.intro);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTemplate(); }, [loadTemplate]);

  const save = async () => {
    setSaving(true); setSaveStatus("idle");
    try {
      const r = await fetch(`${API}?action=brief_template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, intro }),
      });
      const data = await r.json();
      if (data.ok) { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 3000); }
      else setSaveStatus("error");
    } catch { setSaveStatus("error"); } finally { setSaving(false); }
  };

  const toggleField = (key: string) => {
    setFields(p => p.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const updateField = (key: string, changes: Partial<BriefField>) => {
    setFields(p => p.map(f => f.key === key ? { ...f, ...changes } : f));
  };

  const moveField = (key: string, dir: -1 | 1) => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.key === key);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const removeField = (key: string) => {
    setFields(p => p.filter(f => f.key !== key));
  };

  const addCustomField = () => {
    if (!newField.label.trim()) return;
    const key = `custom_${Date.now()}`;
    setFields(p => [...p, { key, label: newField.label, placeholder: newField.placeholder, type: newField.type, enabled: true }]);
    setNewField({ label: "", placeholder: "", type: "text" });
    setAddingField(false);
  };

  const resetToDefault = () => {
    setFields(DEFAULT_FIELDS);
    setIntro("Добрый день! Перед началом работы просим заполнить бриф — это поможет нам лучше понять ваши пожелания и создать идеальный интерьер.");
  };

  const enabledCount = fields.filter(f => f.enabled).length;

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Шаблон брифа</h2>
          <p className="text-sm text-ink-faint mt-0.5">Настройте поля, которые клиент заполняет в личном кабинете</p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Icon name="Check" size={14} /> Сохранено
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <Icon name="AlertCircle" size={14} /> Ошибка
            </span>
          )}
          <button onClick={save} disabled={saving}
            className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
            Сохранить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Вступительный текст */}
          <div className="card-surface rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="MessageSquare" size={16} className="text-ink-muted" />
              <p className="text-sm font-semibold">Вступительный текст</p>
              <p className="text-xs text-ink-faint ml-auto">Показывается клиенту в начале брифа</p>
            </div>
            <textarea
              value={intro}
              onChange={e => setIntro(e.target.value)}
              rows={3}
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50"
            />
          </div>

          {/* Поля брифа */}
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-snow-dark flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="ClipboardList" size={16} className="text-ink-muted" />
                <p className="text-sm font-semibold">Поля брифа</p>
                <span className="text-xs bg-snow px-2 py-0.5 rounded-full text-ink-faint">
                  {enabledCount} активных из {fields.length}
                </span>
              </div>
              <button onClick={resetToDefault}
                className="text-xs text-ink-faint hover:text-ink transition-colors flex items-center gap-1">
                <Icon name="RotateCcw" size={12} /> Сбросить
              </button>
            </div>

            <div className="divide-y divide-snow-dark">
              {fields.map((field, idx) => (
                <div key={field.key}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors ${field.enabled ? "" : "opacity-50"}`}>

                  {/* Drag handles / move */}
                  <div className="flex flex-col gap-0.5 mt-1 shrink-0">
                    <button onClick={() => moveField(field.key, -1)} disabled={idx === 0}
                      className="text-ink-faint hover:text-ink disabled:opacity-20 transition-colors">
                      <Icon name="ChevronUp" size={14} />
                    </button>
                    <button onClick={() => moveField(field.key, 1)} disabled={idx === fields.length - 1}
                      className="text-ink-faint hover:text-ink disabled:opacity-20 transition-colors">
                      <Icon name="ChevronDown" size={14} />
                    </button>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggleField(field.key)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${field.enabled ? "bg-ink" : "bg-snow-dark"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${field.enabled ? "left-4" : "left-0.5"}`} />
                  </button>

                  {/* Content */}
                  {editingKey === field.key ? (
                    <div className="flex-1 space-y-2">
                      <input
                        value={field.label}
                        onChange={e => updateField(field.key, { label: e.target.value })}
                        placeholder="Название поля"
                        className="w-full bg-snow border border-snow-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <input
                        value={field.placeholder}
                        onChange={e => updateField(field.key, { placeholder: e.target.value })}
                        placeholder="Подсказка для клиента"
                        className="w-full bg-snow border border-snow-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <div className="flex gap-2 items-center">
                        <select value={field.type} onChange={e => updateField(field.key, { type: e.target.value as BriefField["type"] })}
                          className="bg-snow border border-snow-dark rounded-lg px-3 py-2 text-sm focus:outline-none">
                          <option value="text">Строка</option>
                          <option value="number">Число</option>
                          <option value="textarea">Многострочный текст</option>
                        </select>
                        <button onClick={() => setEditingKey(null)}
                          className="px-3 py-2 bg-ink text-white text-xs rounded-lg hover:bg-ink-light transition-colors">
                          Готово
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{field.label}</p>
                      {field.placeholder && (
                        <p className="text-xs text-ink-faint mt-0.5 truncate">Подсказка: {field.placeholder}</p>
                      )}
                      <span className="text-[10px] text-ink-faint/70">
                        {field.type === "text" ? "Строка" : field.type === "number" ? "Число" : "Многострочный"}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button onClick={() => setEditingKey(editingKey === field.key ? null : field.key)}
                      className="w-7 h-7 rounded-lg hover:bg-snow flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
                      <Icon name="Pencil" size={13} />
                    </button>
                    {field.key.startsWith("custom_") && (
                      <button onClick={() => removeField(field.key)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-ink-faint hover:text-red-500 transition-colors">
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add custom field */}
            {addingField ? (
              <div className="px-5 py-4 border-t border-snow-dark bg-snow/30 space-y-3">
                <p className="text-xs font-semibold text-ink-muted">Новое поле</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
                    placeholder="Название поля *"
                    className="bg-white border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
                  <input value={newField.placeholder} onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))}
                    placeholder="Подсказка для клиента"
                    className="bg-white border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
                </div>
                <div className="flex items-center gap-3">
                  <select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value as BriefField["type"] }))}
                    className="bg-white border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="text">Строка</option>
                    <option value="number">Число</option>
                    <option value="textarea">Многострочный текст</option>
                  </select>
                  <button onClick={addCustomField} disabled={!newField.label.trim()}
                    className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
                    Добавить
                  </button>
                  <button onClick={() => setAddingField(false)}
                    className="px-4 py-2.5 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors text-ink-muted">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingField(true)}
                className="w-full flex items-center justify-center gap-2 py-4 border-t border-snow-dark text-sm text-ink-muted hover:text-ink hover:bg-snow/50 transition-colors">
                <Icon name="Plus" size={15} /> Добавить своё поле
              </button>
            )}
          </div>

          {/* Preview hint */}
          <div className="card-surface rounded-2xl p-5 bg-blue-50/50 border border-blue-100">
            <div className="flex items-start gap-3">
              <Icon name="Eye" size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Как это видит клиент</p>
                <p className="text-xs text-blue-600 mt-1">
                  Клиент открывает вкладку «Бриф» в личном кабинете, видит включённые поля и может оставить комментарии.
                  Вы видите ответы клиента в карточке проекта → вкладка «Бриф».
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
