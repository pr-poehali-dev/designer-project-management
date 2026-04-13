import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { API, DOC_API, ProjectDoc } from "../ProjectCardTypes";

interface Props {
  projectId: number;
  documents: ProjectDoc[];
  setDocuments: React.Dispatch<React.SetStateAction<ProjectDoc[]>>;
  generatingDoc: boolean;
  onGenerateDoc: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  contract: { label: "Договор", color: "bg-blue-50 text-blue-600" },
  act: { label: "Акт", color: "bg-green-50 text-green-600" },
  other: { label: "Файл", color: "bg-snow-mid text-ink-faint" },
};

export default function PanelContract({ projectId, documents, setDocuments, generatingDoc, onGenerateDoc }: Props) {
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const contractDocs = documents.filter(d => d.doc_type === "contract");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = (ev.target?.result as string).split(",")[1];
      try {
        const r = await fetch(`${API}?action=documents`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId, file: base64, mime: file.type,
            name: file.name, uploaded_by: "designer", doc_type: "contract",
          }),
        });
        const data = await r.json();
        if (data.ok) setDocuments(p => [...p, data.document]);
      } catch { /* ignore */ } finally { setUploadingDoc(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const markSigned = async (id: number) => {
    await fetch(`${API}?action=documents`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign", id, project_id: projectId }),
    });
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_signed: true } : d));
  };

  return (
    <div className="space-y-6">
      {/* Статус */}
      <div className="p-4 rounded-2xl bg-snow border border-snow-dark">
        {contractDocs.length === 0 ? (
          <div className="text-center py-2">
            <Icon name="FileX" size={28} className="text-ink-faint mx-auto mb-2" />
            <p className="text-sm text-ink-muted">Договор ещё не сформирован</p>
          </div>
        ) : contractDocs.some(d => d.is_signed) ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="CheckCircle" size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600">Договор подписан</p>
              <p className="text-xs text-ink-faint">Все стороны подписали документ</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon name="Send" size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600">Отправлен клиенту</p>
              <p className="text-xs text-ink-faint">Ожидаем подписания</p>
            </div>
          </div>
        )}
      </div>

      {/* Действия */}
      <div className="flex flex-col gap-2">
        <button onClick={onGenerateDoc} disabled={generatingDoc}
          className="w-full h-10 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {generatingDoc
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Icon name="FileText" size={15} />}
          Скачать / Отправить договор
        </button>

        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
        <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}
          className="w-full h-10 border border-snow-dark text-sm text-ink-muted font-medium rounded-xl hover:bg-snow transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
          {uploadingDoc ? <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
          Загрузить подписанный договор
        </button>
      </div>

      {/* Список файлов договора */}
      {contractDocs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Файлы договора</p>
          <div className="space-y-2">
            {contractDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-snow rounded-xl border border-snow-dark">
                <Icon name="FileText" size={18} className="text-ink-faint shrink-0" />
                <a href={doc.url} target="_blank" rel="noreferrer"
                  className="text-sm text-ink hover:underline flex-1 truncate">{doc.name}</a>
                {doc.is_signed ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 shrink-0">
                    <Icon name="Check" size={12} /> Подписан
                  </span>
                ) : (
                  <button onClick={() => markSigned(doc.id)}
                    className="text-xs text-ink-muted hover:text-ink transition-colors shrink-0">
                    Отметить подписанным
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
