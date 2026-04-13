import { useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  NAV_TABS, DOC_TYPES, fmtTime,
  WorkItem, Estimate, ChatMessage, Brief, BriefField,
  Reference, ProjectDoc, Payment, ProjectData,
} from "./ClientPortalTypes";

interface Props {
  tab: string;
  setTab: (t: string) => void;
  project: ProjectData;

  // Смета
  allItems: WorkItem[];
  estimates: Estimate[];
  disc: number;
  vatMode: string;
  vatRate: number;
  vatAmt: number;
  total: number;

  // Финансы
  payments: Payment[];
  payTotal: number;
  payPaid: number;

  // Чат
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  onSendMsg: () => void;
  chatBottomRef: React.RefObject<HTMLDivElement>;
  sessionName: string;

  // Документы
  documents: ProjectDoc[];
  uploadingDoc: boolean;
  onDocUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSignDoc: (id: number) => void;

  // Бриф
  brief: Brief | null;
  briefTemplate: BriefField[];
  briefIntro: string;
  clientComment: string;
  setClientComment: (v: string) => void;
  savingComment: boolean;
  onSaveComment: () => void;

  // Референсы
  references: Reference[];
  uploadingRef: boolean;
  onRefUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ClientDashboardTabs({
  tab, setTab, project,
  allItems, disc, vatMode, vatRate, vatAmt, total,
  payments, payTotal, payPaid,
  messages, input, setInput, sending, onSendMsg, chatBottomRef, sessionName,
  documents, uploadingDoc, onDocUpload, onSignDoc,
  brief, briefTemplate, briefIntro, clientComment, setClientComment, savingComment, onSaveComment,
  references, uploadingRef, onRefUpload,
}: Props) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Nav */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <div className="flex min-w-max px-2 py-2 gap-1">
          {NAV_TABS.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-medium text-xs transition-colors whitespace-nowrap ${tab === n.id ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon name={n.icon} size={13} />{n.label}
            </button>
          ))}
        </div>
      </div>

      {/* СМЕТА */}
      {tab === "estimate" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {allItems.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Смета ещё не сформирована</div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    {["#","Наименование","Кол.","Ед.","Цена","Сумма"].map(h => (
                      <th key={h} className={`py-3 px-4 text-xs text-gray-400 font-medium ${h === "Наименование" ? "text-left" : h === "Ед." ? "text-center" : "text-right"}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {allItems.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-xs text-gray-300">{i+1}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-500 tabular-nums">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-400">{item.unit}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-500 tabular-nums">{Number(item.price).toLocaleString("ru")} ₽</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-800 tabular-nums">{(item.quantity * item.price).toLocaleString("ru")} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-4 space-y-2 border-t border-gray-100">
                {disc > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Скидка {project.discount_percent}%:</span><span className="text-red-500 tabular-nums">−{Math.round(disc).toLocaleString("ru")} ₽</span></div>}
                {vatMode !== "none" && <div className="flex justify-between text-sm text-gray-500"><span>{vatMode === "included" ? `В т.ч. НДС ${vatRate}%` : `НДС ${vatRate}%`}:</span><span className="tabular-nums">{Math.round(vatAmt).toLocaleString("ru")} ₽</span></div>}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Итого к оплате:</span><span className="tabular-nums">{Math.round(total).toLocaleString("ru")} ₽</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ФИНАНСЫ */}
      {tab === "finance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Стоимость", val: Math.round(payTotal || total), color: "text-gray-900" },
              { label: "Оплачено",  val: Math.round(payPaid),           color: "text-green-600" },
              { label: "Остаток",   val: Math.round((payTotal || total) - payPaid), color: "text-amber-600" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className={`text-lg font-bold mt-1 tabular-nums ${s.color}`}>{s.val.toLocaleString("ru")} ₽</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {payments.length === 0
              ? <div className="text-center py-10 text-gray-400 text-sm">График платежей не установлен</div>
              : <div className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${p.is_paid ? "bg-green-100" : "bg-gray-100"}`}>
                        <Icon name={p.is_paid ? "CheckCircle" : "Clock"} size={16} className={p.is_paid ? "text-green-600" : "text-gray-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{p.label || "Платёж"}</p>
                        {p.paid_at && <p className="text-xs text-gray-400">{fmtTime(p.paid_at)}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${p.is_paid ? "text-green-600" : "text-gray-900"}`}>{Number(p.amount).toLocaleString("ru")} ₽</p>
                        <p className={`text-xs ${p.is_paid ? "text-green-500" : "text-amber-500"}`}>{p.is_paid ? "Оплачено" : "Ожидает"}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ЧАТ */}
      {tab === "chat" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <div className="flex flex-col items-center justify-center h-full text-center"><Icon name="MessageSquare" size={28} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">Напишите вашему дизайнеру</p></div>
              : messages.map(msg => {
                  const isMe = msg.author_role === "client";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">{msg.author_name?.charAt(0) || "Д"}</div>}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                        {!isMe && <p className="text-[10px] font-medium mb-1 opacity-60">{msg.author_name}</p>}
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/40" : "text-gray-400"}`}>{fmtTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })
            }
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSendMsg())}
              placeholder="Написать дизайнеру..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            <button onClick={onSendMsg} disabled={!input.trim() || sending}
              className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 shrink-0">
              {sending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Send" size={14} className="text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* ДОКУМЕНТЫ */}
      {tab === "documents" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Документы проекта</p>
            <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40">
              {uploadingDoc ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Icon name="Upload" size={13} />}
              Загрузить
            </button>
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onDocUpload} className="hidden" />
          </div>
          {documents.length === 0
            ? <div className="text-center py-10 text-gray-400 text-sm">Документов пока нет</div>
            : <div className="divide-y divide-gray-50">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${doc.uploaded_by === "client" ? "bg-blue-50" : "bg-gray-100"}`}>
                      <Icon name="FileText" size={16} className={doc.uploaded_by === "client" ? "text-blue-500" : "text-gray-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{DOC_TYPES[doc.doc_type] || "Документ"} · {fmtTime(doc.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.is_signed
                        ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg"><Icon name="CheckCircle" size={12} />Подписан</span>
                        : doc.uploaded_by === "designer"
                          ? <button onClick={() => onSignDoc(doc.id)} className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg">Подписать</button>
                          : null
                      }
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                        <Icon name="Download" size={13} className="text-gray-500" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* БРИФ */}
      {tab === "brief" && (
        <div className="space-y-4">
          {briefIntro && (
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-gray-900">
              <p className="text-sm text-gray-700 leading-relaxed">{briefIntro}</p>
            </div>
          )}
          {briefTemplate.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Параметры проекта</p>
                <p className="text-xs text-gray-400 mt-0.5">Заполнено дизайнером</p>
              </div>
              {!brief || briefTemplate.every(f => !brief[f.key])
                ? <div className="text-center py-10 text-gray-400 text-sm">Дизайнер ещё не заполнил данные</div>
                : <div className="divide-y divide-gray-50">
                    {briefTemplate.filter(f => brief && brief[f.key]).map(f => (
                      <div key={f.key} className="flex gap-3 px-4 py-3">
                        <p className="text-xs text-gray-400 font-medium w-36 shrink-0 mt-0.5">{f.label}</p>
                        <p className="text-sm text-gray-800">{String(brief![f.key] ?? "")}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
          ) : brief ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Параметры проекта</p>
              </div>
              <div className="divide-y divide-gray-50">
                {(["style","area","budget","rooms","color_palette","furniture","restrictions","wishes","extra"] as const)
                  .filter(k => brief[k])
                  .map(k => (
                    <div key={k} className="flex gap-3 px-4 py-3">
                      <p className="text-xs text-gray-400 font-medium w-36 shrink-0 mt-0.5">{k}</p>
                      <p className="text-sm text-gray-800">{String(brief[k])}</p>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm text-center py-12 text-gray-400 text-sm">
              Бриф ещё не заполнен
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Ваши комментарии</p>
            <p className="text-xs text-gray-400 mb-3">Уточнения и пожелания к параметрам проекта</p>
            <textarea value={clientComment} onChange={e => setClientComment(e.target.value)}
              rows={4} placeholder="Напишите дизайнеру ваши уточнения, правки или дополнительные пожелания..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
            <button onClick={onSaveComment} disabled={savingComment}
              className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
              {savingComment && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* РЕФЕРЕНСЫ */}
      {tab === "references" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Референсы</p>
              <p className="text-xs text-gray-400 mt-0.5">Фото для вдохновения дизайнера</p>
            </div>
            <button onClick={() => refInputRef.current?.click()} disabled={uploadingRef}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50">
              {uploadingRef ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={13} />}
              Добавить
            </button>
            <input ref={refInputRef} type="file" accept="image/*" onChange={onRefUpload} className="hidden" />
          </div>
          {references.length === 0
            ? <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center"><Icon name="Images" size={20} className="text-gray-400" /></div>
                <div><p className="text-sm font-medium text-gray-600">Добавьте референсы</p><p className="text-xs text-gray-400 mt-1">Фото интерьеров, мебели, цветов</p></div>
              </div>
            : <div className="p-3 grid grid-cols-3 gap-2">
                {references.map(ref => (
                  <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                    <img src={ref.url} alt="Референс" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
          }
        </div>
      )}
    </>
  );
}
