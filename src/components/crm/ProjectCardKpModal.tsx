import Icon from "@/components/ui/icon";

interface Props {
  projectId: number;
  onClose: () => void;
  kpStyle: string;
  setKpStyle: (s: string) => void;
  kpIntro: string;
  setKpIntro: (s: string) => void;
  generatingPdf: boolean;
  pdfUrl: string;
  setPdfUrl: (u: string) => void;
  onGenerate: () => void;
  onSendToChat: () => void;
  sending: boolean;
  sendStatus: "idle" | "ok" | "error";
}

export default function ProjectCardKpModal({
  onClose, kpStyle, setKpStyle, kpIntro, setKpIntro,
  generatingPdf, pdfUrl, setPdfUrl, onGenerate, onSendToChat, sending, sendStatus,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-sm">Коммерческое предложение</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><Icon name="X" size={18} /></button>
        </div>
        {!pdfUrl && !generatingPdf && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">Стиль</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "minimal", label: "Минимал", icon: "Minus", color: "bg-gray-900" },
                  { id: "corporate", label: "Корпоративный", icon: "Building2", color: "bg-blue-900" },
                  { id: "presentation", label: "Презентация", icon: "Sparkles", color: "bg-violet-600" },
                ].map(s => (
                  <button key={s.id} onClick={() => setKpStyle(s.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${kpStyle === s.id ? "border-ink bg-ink/[0.03]" : "border-snow-dark hover:border-ink-faint"}`}>
                    <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mb-2`}><Icon name={s.icon} size={14} className="text-white" /></div>
                    <p className="text-xs font-semibold">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-2">Вступительный текст <span className="font-normal text-ink-faint">(необязательно)</span></p>
              <textarea value={kpIntro} onChange={e => setKpIntro(e.target.value)} placeholder="Добрый день!..." rows={3}
                className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50" />
            </div>
            <button onClick={onGenerate} className="w-full py-3 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors flex items-center justify-center gap-2">
              <Icon name="Zap" size={16} /> Сгенерировать PDF
            </button>
          </div>
        )}
        {generatingPdf && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            <p className="text-sm text-ink-faint">Генерирую КП...</p>
          </div>
        )}
        {pdfUrl && !generatingPdf && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <Icon name="CheckCircle2" size={16} className="text-green-600 shrink-0" />
              <p className="text-xs text-green-700 font-medium">PDF готов!</p>
            </div>
            <div className="flex gap-2">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors">
                <Icon name="Download" size={16} /> Скачать
              </a>
              <button onClick={() => setPdfUrl("")}
                className="px-4 py-3 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors text-ink-muted">
                Другой стиль
              </button>
            </div>
            <button onClick={onSendToChat} disabled={sending}
              className="w-full py-2.5 border border-snow-dark text-sm font-medium rounded-xl hover:bg-snow transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {sending ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="MessageSquare" size={14} />}
              {sending ? "Отправляю..." : "Отправить в чат проекта"}
            </button>
            {sendStatus === "ok" && <p className="text-xs text-green-600 flex items-center gap-1"><Icon name="Check" size={12} /> Отправлено</p>}
            {sendStatus === "error" && <p className="text-xs text-red-500 flex items-center gap-1"><Icon name="AlertCircle" size={12} /> Ошибка</p>}
          </div>
        )}
      </div>
    </div>
  );
}
