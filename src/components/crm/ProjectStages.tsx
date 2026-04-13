import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { API } from "./ProjectCardTypes";
import type { Stage } from "./ProjectCardTypes";

const STATUS_CONFIG = {
  pending:     { label: "Не начат",   color: "text-ink-faint",  bg: "bg-snow-mid",  ring: "ring-snow-dark" },
  in_progress: { label: "В процессе", color: "text-blue-600",   bg: "bg-blue-50",   ring: "ring-blue-200"  },
  done:        { label: "Завершён",   color: "text-green-600",  bg: "bg-green-50",  ring: "ring-green-200" },
};

function StageCard({ stage, projectId, onUpdated }: { stage: Stage; projectId: number; onUpdated: () => void }) {
  const [open, setOpen] = useState(stage.status === "in_progress");
  const [comment, setComment] = useState(stage.comment || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = STATUS_CONFIG[stage.status];

  const saveStatus = async (status: Stage["status"]) => {
    await fetch(`${API}?action=stages&project_id=${projectId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_key: stage.stage_key, status }),
    });
    onUpdated();
  };

  const saveComment = async () => {
    if (comment === stage.comment) return;
    setSaving(true);
    await fetch(`${API}?action=stages&project_id=${projectId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_key: stage.stage_key, comment }),
    });
    setSaving(false);
    onUpdated();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      stage.status === "done"        ? "border-green-200 bg-green-50/30"
      : stage.status === "in_progress" ? "border-blue-200 bg-blue-50/20"
      : "border-snow-dark bg-white"}`}>

      <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpen(o => !o)}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 shrink-0 ${cfg.ring} ${cfg.bg}`}>
          {stage.status === "done"
            ? <Icon name="Check" size={16} className="text-green-600" />
            : stage.status === "in_progress"
              ? <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              : <div className="w-3 h-3 rounded-full bg-ink-faint/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">{stage.label}</p>
          {stage.completed_at && (
            <p className="text-[11px] text-ink-faint mt-0.5">
              Завершён {new Date(stage.completed_at).toLocaleDateString("ru", { day: "numeric", month: "long" })}
            </p>
          )}
          {stage.comment && !open && <p className="text-xs text-ink-muted mt-0.5 truncate">{stage.comment}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stage.files.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-ink-faint">
              <Icon name="Paperclip" size={12} /> {stage.files.length}
            </span>
          )}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-ink-faint" />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-snow-dark/50 pt-4">
          <div className="flex gap-2 flex-wrap">
            {(["pending", "in_progress", "done"] as Stage["status"][]).map(s => (
              <button key={s} onClick={() => saveStatus(s)}
                className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stage.status === s
                    ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border-current`
                    : "border-snow-dark text-ink-muted hover:border-ink-faint"}`}>
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Комментарий / отчёт</label>
            <textarea
              className="w-full bg-snow border border-snow-dark rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50"
              rows={3} placeholder="Описание выполненных работ..."
              value={comment} onChange={e => setComment(e.target.value)} onBlur={saveComment} />
            {comment !== stage.comment && (
              <button onClick={saveComment} disabled={saving}
                className="mt-1.5 text-xs text-ink font-medium hover:underline flex items-center gap-1">
                {saving ? <div className="w-3 h-3 border border-ink/30 border-t-ink rounded-full animate-spin" /> : <Icon name="Save" size={11} />}
                Сохранить
              </button>
            )}
          </div>

          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Фото ({photos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-snow border border-snow-dark hover:opacity-90 transition-opacity">
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Документы ({docs.length})</p>
              <div className="space-y-1.5">
                {docs.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-snow rounded-xl hover:bg-snow-dark transition-colors text-sm text-ink">
                    <Icon name="FileText" size={14} className="text-ink-faint shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-40">
              {uploading ? <div className="w-4 h-4 border border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Upload" size={14} />}
              {uploading ? "Загружаю..." : "Загрузить фото или документ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectStages({ projectId }: { projectId: number }) {
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
      <div className="card-surface rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Прогресс проекта</p>
          <span className="text-sm font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-snow-dark rounded-full h-2">
          <div className="bg-ink rounded-full h-2 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-ink-faint">{done} из {stages.length} этапов завершено</p>
          {progress === 100 && (
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <Icon name="CheckCircle" size={13} /> Проект завершён!
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {stages.map(stage => (
          <StageCard key={stage.stage_key} stage={stage} projectId={projectId} onUpdated={load} />
        ))}
      </div>
    </div>
  );
}
