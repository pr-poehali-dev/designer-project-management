import { useRef } from "react";
import Icon from "@/components/ui/icon";
import EstimateTable from "./EstimateTable";
import ProjectStages from "./ProjectStages";
import { Tab, ProjectData, Estimate, Brief, ProjectDoc, Payment, Reference, API } from "./ProjectCardTypes";

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  projectId: number;
  project: ProjectData;

  estimates: Estimate[];
  addingEstimate: boolean;
  onAddEstimate: () => void;
  onDeleteEstimate: (id: number) => void;

  brief: Brief;
  briefSaved: Brief;
  briefLoaded: boolean;
  savingBrief: boolean;
  setBrief: (fn: (p: Brief) => Brief) => void;
  onSaveBrief: () => void;

  documents: ProjectDoc[];
  uploadingDoc: boolean;
  onDocUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  payments: Payment[];
  payTotal: number;
  payPaid: number;
  newPayment: { label: string; amount: string };
  setNewPayment: (fn: (p: { label: string; amount: string }) => { label: string; amount: string }) => void;
  addingPayment: boolean;
  onAddPayment: () => void;
  onTogglePayment: (id: number, currentPaid: boolean) => void;

  references: Reference[];
  uploadingRef: boolean;
  onRefUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  fmtDate: (iso: string) => string;
}

export default function ProjectCardTabs({
  tab, setTab, projectId, project,
  estimates, addingEstimate, onAddEstimate, onDeleteEstimate,
  brief, briefSaved, briefLoaded, savingBrief, setBrief, onSaveBrief,
  documents, uploadingDoc, onDocUpload,
  payments, payTotal, payPaid, newPayment, setNewPayment, addingPayment, onAddPayment, onTogglePayment,
  references, uploadingRef, onRefUpload,
  fmtDate,
}: Props) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "project",   label: "Проект",     icon: "FolderOpen" },
    { id: "documents", label: "Документы",  icon: "FileStack" },
    { id: "progress",  label: "Ход работ",  icon: "ListChecks" },
  ];

  return (
    <>
      {/* Tabs nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 text-xs rounded-full transition-all font-medium flex items-center justify-center gap-1.5 ${tab === t.id ? "bg-ink text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── ПРОЕКТ: Бриф + Референсы ── */}
      {tab === "project" && (
        <div className="space-y-6">
          {/* Бриф */}
          <div className="card-surface rounded-2xl p-6">
            <p className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Icon name="ClipboardList" size={15} className="text-ink-muted" /> Бриф
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "style",         label: "Стиль интерьера",  placeholder: "Современный, скандинавский..." },
                { key: "area",          label: "Площадь (м²)",     placeholder: "85" },
                { key: "budget",        label: "Бюджет (₽)",       placeholder: "1 500 000" },
                { key: "rooms",         label: "Комнаты",          placeholder: "Гостиная, спальня..." },
                { key: "color_palette", label: "Цветовая палитра", placeholder: "Светлые тона, акцент терракот..." },
                { key: "furniture",     label: "Мебель",           placeholder: "ИКЕА, итальянские бренды..." },
                { key: "restrictions",  label: "Ограничения",      placeholder: "Нельзя трогать несущие стены..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-ink-muted font-medium mb-1.5 block">{f.label}</label>
                  <input value={brief[f.key as keyof Brief] || ""} onChange={e => setBrief(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-muted font-medium mb-1.5 block">Пожелания клиента</label>
              <textarea value={brief.wishes || ""} onChange={e => setBrief(p => ({ ...p, wishes: e.target.value }))}
                rows={3} placeholder="Открытая планировка, много света..."
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-muted font-medium mb-1.5 block">Дополнительно</label>
              <textarea value={brief.extra || ""} onChange={e => setBrief(p => ({ ...p, extra: e.target.value }))}
                rows={2} placeholder="Любая другая информация..."
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
            </div>
            {brief.client_comment && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium mb-1">Комментарий клиента</p>
                <p className="text-sm text-amber-800">{brief.client_comment}</p>
              </div>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-snow-dark">
              {briefLoaded && !brief.client_comment && (
                <p className="text-xs text-ink-faint">Клиент может оставить комментарий в своём кабинете</p>
              )}
              <button onClick={onSaveBrief} disabled={savingBrief || JSON.stringify(brief) === JSON.stringify(briefSaved)}
                className={`ml-auto px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${JSON.stringify(brief) !== JSON.stringify(briefSaved) ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
                {savingBrief ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                Сохранить
              </button>
            </div>
          </div>

          {/* Референсы */}
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2"><Icon name="Images" size={15} className="text-ink-muted" /> Референсы</p>
              <button onClick={() => refInputRef.current?.click()} disabled={uploadingRef}
                className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
                {uploadingRef ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
                Загрузить
              </button>
              <input ref={refInputRef} type="file" accept="image/*" onChange={onRefUpload} className="hidden" />
            </div>
            {references.length === 0
              ? <div className="text-center py-10"><Icon name="Images" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Референсов пока нет</p></div>
              : <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {references.map(ref => (
                    <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden bg-snow border border-snow-dark hover:opacity-90 transition-opacity group relative">
                      <img src={ref.url} alt={ref.caption} className="w-full h-full object-cover" />
                      {ref.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {ref.caption}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── ДОКУМЕНТЫ: Сметы + Договора/Файлы + Платежи ── */}
      {tab === "documents" && (
        <div className="space-y-6">
          {/* Сметы */}
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Icon name="Calculator" size={13} /> Сметы
            </p>
            <div className="space-y-4">
              <EstimateTable projectId={projectId} title="Основная смета" />
              {estimates.map(est => (
                <div key={est.id} className="relative group">
                  <EstimateTable projectId={projectId} estimateId={est.id} title={est.name}
                    onUpdateTitle={name => {
                      fetch(`${API}?action=estimates&id=${est.id}`, {
                        method: "PUT", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name }),
                      }).catch(() => {});
                    }} />
                  <button onClick={() => { if (confirm("Удалить смету?")) onDeleteEstimate(est.id); }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              ))}
              <button onClick={onAddEstimate} disabled={addingEstimate}
                className="w-full py-4 border-2 border-dashed border-snow-dark hover:border-ink-faint rounded-2xl text-sm text-ink-muted font-medium transition-all flex items-center justify-center gap-2 hover:bg-snow/50">
                <Icon name="Plus" size={16} /> Добавить смету
              </button>
            </div>
          </div>

          {/* Документы */}
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Icon name="Paperclip" size={13} /> Файлы и договора
            </p>
            <div className="card-surface rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
                <span className="text-sm font-medium">Документы</span>
                <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
                  className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
                  {uploadingDoc ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
                  Загрузить
                </button>
                <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onDocUpload} className="hidden" />
              </div>
              {documents.length === 0
                ? <div className="text-center py-10"><Icon name="Paperclip" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Документов пока нет</p></div>
                : <div className="divide-y divide-snow-dark">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${doc.uploaded_by === "client" ? "bg-blue-50" : "bg-snow"}`}>
                          <Icon name="FileText" size={16} className={doc.uploaded_by === "client" ? "text-blue-500" : "text-ink-muted"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-ink-faint">{doc.uploaded_by === "client" ? "От клиента" : "От дизайнера"} · {fmtDate(doc.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doc.is_signed && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><Icon name="CheckCircle" size={12} />Подписан</span>}
                          <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg bg-snow flex items-center justify-center hover:bg-snow-dark transition-colors">
                            <Icon name="Download" size={13} className="text-ink-muted" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* Платежи */}
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Icon name="CreditCard" size={13} /> Платежи
            </p>
            <div className="card-surface rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span className="text-ink-muted">Итого: <span className="font-semibold text-ink">{payTotal.toLocaleString("ru")} ₽</span></span>
                  <span className="text-green-600">Оплачено: <span className="font-semibold">{payPaid.toLocaleString("ru")} ₽</span></span>
                  {payTotal > 0 && <span className="text-ink-muted">
                    Остаток: <span className="font-semibold text-ink">{(payTotal - payPaid).toLocaleString("ru")} ₽</span>
                  </span>}
                </div>
              </div>
              <div className="divide-y divide-snow-dark">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                    <button onClick={() => onTogglePayment(p.id, p.is_paid)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${p.is_paid ? "bg-green-500 border-green-500" : "border-snow-dark hover:border-ink-faint"}`}>
                      {p.is_paid && <Icon name="Check" size={10} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${p.is_paid ? "line-through text-ink-faint" : "text-ink"}`}>{p.label}</p>
                      {p.paid_at && <p className="text-xs text-ink-faint">{fmtDate(p.paid_at)}</p>}
                    </div>
                    <span className={`text-sm font-semibold ${p.is_paid ? "text-green-600" : "text-ink"}`}>
                      {Number(p.amount).toLocaleString("ru")} ₽
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-snow-dark flex gap-2">
                <input value={newPayment.label} onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))}
                  placeholder="Название платежа" className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
                <input value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Сумма" type="number" className="w-28 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
                <button onClick={onAddPayment} disabled={addingPayment || !newPayment.label.trim() || !newPayment.amount}
                  className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
                  <Icon name="Plus" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ХОД РАБОТ ── */}
      {tab === "progress" && (
        <ProjectStages projectId={projectId} />
      )}
    </>
  );
}
