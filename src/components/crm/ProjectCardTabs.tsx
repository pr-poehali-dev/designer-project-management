import { useRef } from "react";
import Icon from "@/components/ui/icon";
import EstimateTable from "./EstimateTable";
import { Tab, ProjectData, Estimate, Brief, ProjectDoc, Payment, Reference, API } from "./ProjectCardTypes";

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  projectId: number;
  project: ProjectData;

  // Estimates
  estimates: Estimate[];
  addingEstimate: boolean;
  onAddEstimate: () => void;
  onDeleteEstimate: (id: number) => void;

  // Brief
  brief: Brief;
  briefSaved: Brief;
  briefLoaded: boolean;
  savingBrief: boolean;
  setBrief: (fn: (p: Brief) => Brief) => void;
  onSaveBrief: () => void;

  // Documents
  documents: ProjectDoc[];
  uploadingDoc: boolean;
  onDocUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Payments
  payments: Payment[];
  payTotal: number;
  payPaid: number;
  newPayment: { label: string; amount: string };
  setNewPayment: (fn: (p: { label: string; amount: string }) => { label: string; amount: string }) => void;
  addingPayment: boolean;
  onAddPayment: () => void;
  onTogglePayment: (id: number, currentPaid: boolean) => void;

  // References
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

  return (
    <>
      {/* Tabs nav */}
      <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-snow-dark flex-wrap">
        {([
          { id: "estimates"  as Tab, label: "Сметы",     icon: "Calculator" },
          { id: "brief"      as Tab, label: "Бриф",      icon: "ClipboardList" },
          { id: "documents"  as Tab, label: "Документы", icon: "Paperclip" },
          { id: "payments"   as Tab, label: "Платежи",   icon: "CreditCard" },
          { id: "references" as Tab, label: "Референсы", icon: "Images" },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs rounded-full transition-all font-medium flex items-center gap-1.5 ${tab === t.id ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── СМЕТЫ ── */}
      {tab === "estimates" && (
        <div className="space-y-6">
          <EstimateTable
            projectId={projectId}
            title="Основная смета"
          />
          {estimates.map(est => (
            <div key={est.id} className="relative group">
              <EstimateTable
                projectId={projectId}
                estimateId={est.id}
                title={est.name}
                onUpdateTitle={(name) => {
                  fetch(`${API}?action=estimates&id=${est.id}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  }).catch(() => {/* ignore */});
                }}
              />
              <button
                onClick={() => { if (confirm("Удалить смету и все её позиции?")) onDeleteEstimate(est.id); }}
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
      )}



      {/* ── БРИФ ── */}
      {tab === "brief" && (
        <div className="space-y-4">
          <div className="card-surface rounded-2xl p-6">
            <p className="text-sm font-semibold mb-4">Параметры проекта</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "style",         label: "Стиль интерьера",     placeholder: "Современный, скандинавский..." },
                { key: "area",          label: "Площадь (м²)",        placeholder: "85" },
                { key: "budget",        label: "Бюджет (₽)",          placeholder: "1 500 000" },
                { key: "rooms",         label: "Комнаты",             placeholder: "Гостиная, спальня, 2 детских..." },
                { key: "color_palette", label: "Цветовая палитра",    placeholder: "Светлые тона, акцент терракот..." },
                { key: "furniture",     label: "Мебель",              placeholder: "ИКЕА, итальянские бренды..." },
                { key: "restrictions",  label: "Ограничения",         placeholder: "Нельзя трогать несущие стены..." },
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
            <div className="flex items-center justify-end mt-4 pt-4 border-t border-snow-dark">
              <button onClick={onSaveBrief} disabled={savingBrief || JSON.stringify(brief) === JSON.stringify(briefSaved)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${JSON.stringify(brief) !== JSON.stringify(briefSaved) ? "bg-ink text-white hover:bg-ink-light" : "bg-snow text-ink-faint cursor-not-allowed"}`}>
                {savingBrief ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                Сохранить
              </button>
            </div>
          </div>
          {briefLoaded && !brief.client_comment && (
            <p className="text-xs text-ink-faint text-center">Клиент может оставить комментарий в своём кабинете</p>
          )}
        </div>
      )}

      {/* ── ДОКУМЕНТЫ ── */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
              <p className="text-sm font-semibold">Документы</p>
              <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
                className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
                {uploadingDoc ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
                Загрузить
              </button>
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onDocUpload} className="hidden" />
            </div>
            {documents.length === 0
              ? <div className="text-center py-12"><Icon name="Paperclip" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Документов пока нет</p></div>
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
      )}

      {/* ── ПЛАТЕЖИ ── */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Стоимость", val: Math.round(payTotal), color: "text-ink" },
              { label: "Оплачено",  val: Math.round(payPaid),  color: "text-green-600" },
              { label: "Остаток",   val: Math.round(payTotal - payPaid), color: "text-amber-600" },
            ].map(s => (
              <div key={s.label} className="card-surface rounded-2xl p-4 text-center">
                <p className="text-xs text-ink-faint font-medium">{s.label}</p>
                <p className={`text-xl font-bold mt-1 tabular-nums ${s.color}`}>{s.val.toLocaleString("ru")} ₽</p>
              </div>
            ))}
          </div>
          <div className="card-surface rounded-2xl p-4 flex gap-3">
            <input value={newPayment.label} onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))}
              placeholder="Название (аванс, 1-й платёж...)"
              className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <input type="number" value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
              placeholder="Сумма ₽" className="w-36 bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <button onClick={onAddPayment} disabled={!newPayment.label.trim() || !newPayment.amount || addingPayment}
              className="px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors disabled:opacity-40">
              {addingPayment ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Добавить"}
            </button>
          </div>
          <div className="card-surface rounded-2xl overflow-hidden">
            {payments.length === 0
              ? <div className="text-center py-12"><Icon name="CreditCard" size={28} className="text-ink-faint mx-auto mb-2" /><p className="text-sm text-ink-faint">Платежей нет</p></div>
              : <div className="divide-y divide-snow-dark">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      <button onClick={() => onTogglePayment(p.id, p.is_paid)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${p.is_paid ? "bg-green-500 hover:bg-green-600" : "bg-snow-dark hover:bg-ink-faint/20"}`}>
                        <Icon name={p.is_paid ? "Check" : "Circle"} size={15} className={p.is_paid ? "text-white" : "text-ink-faint"} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.label || "Платёж"}</p>
                        {p.paid_at && <p className="text-xs text-ink-faint">{fmtDate(p.paid_at)}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${p.is_paid ? "text-green-600" : "text-ink"}`}>{Number(p.amount).toLocaleString("ru")} ₽</p>
                        <p className={`text-xs ${p.is_paid ? "text-green-500" : "text-amber-500"}`}>{p.is_paid ? "Оплачено" : "Ожидает"}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── РЕФЕРЕНСЫ ── */}
      {tab === "references" && (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-snow-dark flex items-center justify-between">
            <p className="text-sm font-semibold">Референсы ({references.length})</p>
            <button onClick={() => refInputRef.current?.click()} disabled={uploadingRef}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
              {uploadingRef ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Plus" size={15} />}
              Добавить
            </button>
            <input ref={refInputRef} type="file" accept="image/*" onChange={onRefUpload} className="hidden" />
          </div>
          {references.length === 0
            ? <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-snow flex items-center justify-center"><Icon name="Images" size={20} className="text-ink-faint" /></div>
                <div><p className="text-sm font-medium">Референсов пока нет</p><p className="text-xs text-ink-faint mt-1">Клиент может добавить в своём кабинете</p></div>
              </div>
            : <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {references.map(ref => (
                  <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="relative group aspect-square rounded-xl overflow-hidden bg-snow hover:opacity-80 transition-opacity">
                    <img src={ref.url} alt="Референс" className="w-full h-full object-cover" />
                    {ref.uploaded_by === "client" && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">клиент</span>
                    )}
                  </a>
                ))}
              </div>
          }
        </div>
      )}
    </>
  );
}