import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const DOC_API = "https://functions.poehali.dev/b70e27b9-0603-4f64-a12d-ff1869cca1b0";

const VARIABLES = [
  { key: "{{date}}", desc: "Дата договора" },
  { key: "{{project_name}}", desc: "Название проекта" },
  { key: "{{project_total}}", desc: "Сумма договора" },
  { key: "{{project_duration}}", desc: "Срок выполнения" },
  { key: "{{client_name}}", desc: "Имя клиента" },
  { key: "{{client_phone}}", desc: "Телефон клиента" },
  { key: "{{client_email}}", desc: "Email клиента" },
  { key: "{{client_company}}", desc: "Компания клиента" },
  { key: "{{client_inn}}", desc: "ИНН клиента" },
  { key: "{{client_ogrn}}", desc: "ОГРН клиента" },
  { key: "{{client_kpp}}", desc: "КПП клиента" },
  { key: "{{client_legal_address}}", desc: "Юр. адрес клиента" },
  { key: "{{client_bank_name}}", desc: "Банк клиента" },
  { key: "{{client_bik}}", desc: "БИК клиента" },
  { key: "{{client_checking_account}}", desc: "Р/с клиента" },
  { key: "{{client_corr_account}}", desc: "К/с клиента" },
  { key: "{{designer_name}}", desc: "Ваше имя/компания" },
  { key: "{{designer_inn}}", desc: "Ваш ИНН" },
  { key: "{{designer_ogrn}}", desc: "Ваш ОГРН" },
  { key: "{{designer_kpp}}", desc: "Ваш КПП" },
  { key: "{{designer_legal_address}}", desc: "Ваш юр. адрес" },
  { key: "{{designer_bank_name}}", desc: "Ваш банк" },
  { key: "{{designer_bik}}", desc: "Ваш БИК" },
  { key: "{{designer_checking_account}}", desc: "Ваш р/с" },
  { key: "{{designer_corr_account}}", desc: "Ваш к/с" },
  { key: "{{designer_phone}}", desc: "Ваш телефон" },
  { key: "{{designer_email}}", desc: "Ваш email" },
];

interface DocTemplate {
  id: number;
  name: string;
  content: string;
}

export default function DocTemplatesEditor() {
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [showVars, setShowVars] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${DOC_API}?action=templates`);
      const d = await r.json();
      if (d.ok) setTemplates(d.templates || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selectTemplate = async (id: number) => {
    setSelectedId(id);
    setSaveStatus("idle");
    try {
      const r = await fetch(`${DOC_API}?action=template&id=${id}`);
      const d = await r.json();
      if (d.ok && d.template) {
        setName(d.template.name);
        setContent(d.template.content);
      }
    } catch { /* ignore */ }
  };

  const newTemplate = () => {
    setSelectedId(null);
    setName("Новый шаблон");
    setContent("");
    setSaveStatus("idle");
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true); setSaveStatus("idle");
    try {
      const r = await fetch(`${DOC_API}?action=save_template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, name, content }),
      });
      const d = await r.json();
      if (d.ok) {
        if (!selectedId) setSelectedId(d.id);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
        await loadTemplates();
      } else setSaveStatus("error");
    } catch { setSaveStatus("error"); } finally { setSaving(false); }
  };

  const deleteTemplate = async () => {
    if (!selectedId || !confirm("Удалить шаблон?")) return;
    setDeleting(true);
    try {
      await fetch(`${DOC_API}?action=delete_template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId }),
      });
      setSelectedId(null);
      setName(""); setContent("");
      await loadTemplates();
    } catch { /* ignore */ } finally { setDeleting(false); }
  };

  const insertVar = (key: string) => {
    const ta = document.getElementById("doc-content") as HTMLTextAreaElement;
    if (!ta) { setContent(c => c + key); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = content.slice(0, start) + key + content.slice(end);
    setContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + key.length, start + key.length); }, 0);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Шаблоны договоров</h2>
          <p className="text-sm text-ink-faint mt-0.5">Используйте переменные для автоподстановки данных</p>
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
          {(selectedId !== null || name) && (
            <button onClick={save} disabled={saving}
              className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
              Сохранить
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Список шаблонов */}
        <div className="w-56 shrink-0 space-y-1">
          <button onClick={newTemplate}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-muted hover:bg-snow transition-colors border border-dashed border-snow-dark">
            <Icon name="Plus" size={14} /> Новый шаблон
          </button>
          {templates.map(t => (
            <button key={t.id} onClick={() => selectTemplate(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors truncate ${selectedId === t.id ? "bg-ink text-white" : "hover:bg-snow text-ink"}`}>
              {t.name}
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-xs text-ink-faint px-3 py-2">Нет шаблонов</p>
          )}
        </div>

        {/* Редактор */}
        {(selectedId !== null || name === "Новый шаблон") ? (
          <div className="flex-1 space-y-3">
            <div className="card-surface rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-xs text-ink-faint font-medium block mb-1">Название шаблона</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-ink-faint font-medium">Текст договора</label>
                  <button onClick={() => setShowVars(v => !v)}
                    className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 transition-colors">
                    <Icon name="Code2" size={12} />
                    {showVars ? "Скрыть переменные" : "Переменные"}
                  </button>
                </div>

                {showVars && (
                  <div className="mb-2 p-3 bg-snow rounded-xl grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                    {VARIABLES.map(v => (
                      <button key={v.key} onClick={() => insertVar(v.key)}
                        className="text-left px-2 py-1 rounded-lg hover:bg-white transition-colors group">
                        <span className="text-xs font-mono text-blue-600 group-hover:text-blue-700">{v.key}</span>
                        <span className="text-xs text-ink-faint ml-1">{v.desc}</span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  id="doc-content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={24}
                  className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ink/10"
                  placeholder="Введите текст договора. Используйте {{переменные}} для автоподстановки данных."
                />
              </div>
            </div>

            {selectedId && (
              <div className="flex justify-end">
                <button onClick={deleteTemplate} disabled={deleting}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                  <Icon name="Trash2" size={13} /> Удалить шаблон
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-faint text-sm">
            Выберите шаблон или создайте новый
          </div>
        )}
      </div>
    </div>
  );
}
