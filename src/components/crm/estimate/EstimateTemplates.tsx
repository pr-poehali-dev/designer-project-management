import Icon from "@/components/ui/icon";
import { Template, TemplateItem } from "./EstimateTypes";

interface EstimateTemplatesProps {
  showTemplates: boolean;
  templates: Template[];
  loadingTemplateId: number | null;
  applyTemplate: (templateId: number) => void;
  openEditTemplate: (id: number) => void;
  showSaveAs: boolean;
  templateName: string;
  setTemplateName: (name: string) => void;
  savingTemplate: boolean;
  saveAsTemplate: () => void;
  setShowSaveAs: (show: boolean) => void;
  editingTemplate: { id: number; name: string; items: TemplateItem[] } | null;
  setEditingTemplate: (tpl: { id: number; name: string; items: TemplateItem[] } | null) => void;
  updateTplItem: (idx: number, field: string, value: string) => void;
  addTplItem: () => void;
  removeTplItem: (idx: number) => void;
  saveEditTemplate: () => void;
}

export default function EstimateTemplates({
  showTemplates,
  templates,
  loadingTemplateId,
  applyTemplate,
  openEditTemplate,
  showSaveAs,
  templateName,
  setTemplateName,
  savingTemplate,
  saveAsTemplate,
  setShowSaveAs,
  editingTemplate,
  setEditingTemplate,
  updateTplItem,
  addTplItem,
  removeTplItem,
  saveEditTemplate,
}: EstimateTemplatesProps) {
  return (
    <>
      {/* SAVE AS TEMPLATE */}
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

      {/* TEMPLATES LIST */}
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

      {/* TEMPLATE EDIT MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setEditingTemplate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-snow-dark">
              <div className="flex items-center gap-2">
                <Icon name="FileStack" size={16} className="text-ink-muted" />
                <input value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
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
    </>
  );
}
