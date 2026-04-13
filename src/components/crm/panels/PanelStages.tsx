import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { API, Stage, StageFile } from "../ProjectCardTypes";

const STATUS_CONFIG = {
  pending:     { label: "Не начат",   color: "text-ink-faint",  bg: "bg-snow-mid",  ring: "ring-snow-dark" },
  in_progress: { label: "В процессе", color: "text-blue-600",   bg: "bg-blue-50",   ring: "ring-blue-200"  },
  done:        { label: "Завершён",   color: "text-green-600",  bg: "bg-green-50",  ring: "ring-green-200" },
};

function StageCard({ stage, projectId, onUpdated }: { stage: Stage; projectId: number; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(stage.label);
  const [employee, setEmployee] = useState(stage.employee_name || "");
  const [comment, setComment] = useState(stage.comment || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = STATUS_CONFIG[stage.status];

  const saveField = async (fields: Record<string, string>) => {
    setSaving(true);
    await fetch(`${API}?action=stages&project_id=${projectId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_key: stage.stage_key, ...fields }),
    });
    setSaving(false);
    onUpdated();
  };

  const saveStatus = (status: Stage["status"]) => saveField({ status });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      await fetch(`${API}?action=stages&project_id=${projectId}&sub=file`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_key: stage.stage_key, file: b64, mime: file.type, name: file.name,
          file_type: file.type.startsWith("image/") ? "photo" : "document",
        }),
      });
      setUploading(false);
      onUpdated();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const photos = stage.files.filter(f => f.file_type === "photo" && f.url);
  const docs   = stage.files.filter(f => f.file_type === "document" && f.url);

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      stage.status === "done"
        ? "border-green-200 bg-green-50/30"
        : stage.status === "in_progress"
          ? "border-blue-200 bg-blue-50/20"
          : "border-snow-dark bg-white"
    }`}>
      {/* Заголовок карточки */}
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left" onClick={() => setOpen(o => !o)}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 shrink-0 ${cfg.ring} ${cfg.bg}`}>
          {stage.status === "done"
            ? <Icon name="Check" size={14} className="text-green-600" />
            : stage.status === "in_progress"
              ? <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              : <div className="w-2.5 h-2.5 rounded-full bg-ink-faint/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm leading-snug">{stage.label}</p>
          {stage.employee_name && (
            <p className="text-xs text-ink-faint mt-0.5">{stage.employee_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stage.files.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-ink-faint">
              <Icon name="Paperclip" size={11} /> {stage.files.length}
            </span>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} className="text-ink-faint" />
        </div>
      </button>

      {/* Развёрнутое содержимое */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-snow-dark/50 pt-4">
          {/* Редактирование названия и сотрудника */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1 block">Название этапа</label>
              <input
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onBlur={() => label !== stage.label && saveField({ label })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1 block">Сотрудник</label>
              <input
                className="w-full border border-snow-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-ink bg-white"
                placeholder="Имя сотрудника"
                value={employee}
                onChange={e => setEmployee(e.target.value)}
                onBlur={() => employee !== stage.employee_name && saveField({ employee_name: employee })}
              />
            </div>
          </div>

          {/* Статус */}
          <div className="flex gap-2 flex-wrap">
            {(["pending", "in_progress", "done"] as Stage["status"][]).map(s => (
              <button key={s} onClick={() => saveStatus(s)}
                className={`h-7 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stage.status === s
                    ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border-current`
                    : "border-snow-dark text-ink-muted hover:border-ink-faint"
                }`}>
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Комментарий */}
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1 block">Комментарий</label>
            <textarea
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50"
              rows={3} placeholder="Описание выполненных работ..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onBlur={() => comment !== stage.comment && saveField({ comment })}
            />
          </div>

          {/* Фото */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Фото ({photos.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {photos.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-snow border border-snow-dark hover:opacity-90 transition-opacity">
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Документы */}
          {docs.length > 0 && (
            <div className="space-y-1.5">
              {docs.map(f => (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-snow rounded-xl hover:bg-snow-dark transition-colors text-sm text-ink">
                  <Icon name="FileText" size={13} className="text-ink-faint shrink-0" />
                  <span className="truncate">{f.name}</span>
                </a>
              ))}
            </div>
          )}

          {/* Загрузка */}
          <div>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors border border-dashed border-snow-dark rounded-xl px-4 py-2.5 w-full justify-center">
              {uploading ? <div className="w-3 h-3 border border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={13} />}
              {uploading ? "Загружаю..." : "Загрузить фото или документ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanelStages({ projectId }: { projectId: number }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch(`${API}?action=stages&project_id=${projectId}`);
    const data = await r.json();
    if (data.ok) setStages(data.stages || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const done = stages.filter(s => s.status === "done").length;
  const progress = stages.length ? Math.round((done / stages.length) * 100) : 0;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Прогресс */}
      <div className="p-4 rounded-2xl bg-snow border border-snow-dark">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Прогресс</p>
          <span className="text-sm font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-snow-dark rounded-full h-2">
          <div className="bg-ink rounded-full h-2 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-ink-faint mt-2">{done} из {stages.length} этапов завершено</p>
      </div>

      {/* Этапы */}
      <div className="space-y-2">
        {stages.map(stage => (
          <StageCard key={stage.stage_key} stage={stage} projectId={projectId} onUpdated={load} />
        ))}
      </div>
    </div>
  );
}
