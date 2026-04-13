import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { API } from "./ProjectCardTypes";

interface Stage {
  id: number;
  stage_key: string;
  label: string;
  status: "pending" | "in_progress" | "done" | "skipped";
  notes: string;
  started_at: string | null;
  completed_at: string | null;
  reports_count: number;
}

interface Report {
  id: number;
  stage_id: number;
  type: "photo" | "document";
  url: string;
  name: string;
  comment: string;
  created_at: string;
}

const STATUS_CONFIG = {
  pending:     { label: "Не начат",   color: "text-ink-faint",    bg: "bg-snow-mid",    icon: "Circle" },
  in_progress: { label: "В работе",   color: "text-blue-600",     bg: "bg-blue-50",     icon: "PlayCircle" },
  done:        { label: "Завершён",   color: "text-green-600",    bg: "bg-green-50",    icon: "CheckCircle2" },
  skipped:     { label: "Пропущен",   color: "text-ink-faint",    bg: "bg-snow-mid",    icon: "MinusCircle" },
};

const STAGE_ICONS: Record<string, string> = {
  survey:        "Ruler",
  concept:       "Lightbulb",
  working:       "PenTool",
  visualization: "Boxes",
  supervision:   "HardHat",
  handover:      "KeyRound",
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectStages({ projectId }: { projectId: number }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStageId, setOpenStageId] = useState<number | null>(null);
  const [reports, setReports] = useState<Record<number, Report[]>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeStageRef = useRef<number | null>(null);

  const loadStages = useCallback(async () => {
    setLoading(true);
    // Инициализируем этапы если ещё нет
    await fetch(`${API}?action=stages&project_id=${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init", project_id: projectId }),
    });
    const r = await fetch(`${API}?action=stages&project_id=${projectId}`);
    const data = await r.json();
    if (data.ok) setStages(data.stages || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadStages(); }, [loadStages]);

  const loadReports = async (stageId: number) => {
    if (reports[stageId]) return;
    const r = await fetch(`${API}?action=stages&sub=reports&stage_id=${stageId}`);
    const data = await r.json();
    if (data.ok) setReports(prev => ({ ...prev, [stageId]: data.reports || [] }));
  };

  const toggleStage = (stageId: number) => {
    const next = openStageId === stageId ? null : stageId;
    setOpenStageId(next);
    if (next !== null) loadReports(next);
  };

  const updateStatus = async (stage: Stage, status: Stage["status"]) => {
    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, status } : s));
    await fetch(`${API}?action=stages&id=${stage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const saveNotes = async (stage: Stage) => {
    const notes = editNotes[stage.id] ?? stage.notes;
    setSavingNotes(stage.id);
    await fetch(`${API}?action=stages&id=${stage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, notes } : s));
    setSavingNotes(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const stageId = activeStageRef.current;
    if (!file || !stageId) return;
    e.target.value = "";
    setUploading(stageId);

    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      const r = await fetch(`${API}?action=stages&sub=reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_id: stageId,
          project_id: projectId,
          file: b64,
          mime: file.type,
          name: file.name,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setReports(prev => ({ ...prev, [stageId]: [...(prev[stageId] || []), data.report] }));
        setStages(prev => prev.map(s => s.id === stageId ? { ...s, reports_count: s.reports_count + 1 } : s));
      }
      setUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const deleteReport = async (stageId: number, reportId: number) => {
    await fetch(`${API}?action=stages&sub=reports&report_id=${reportId}`, { method: "DELETE" });
    setReports(prev => ({ ...prev, [stageId]: (prev[stageId] || []).filter(r => r.id !== reportId) }));
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, reports_count: Math.max(0, s.reports_count - 1) } : s));
  };

  const doneCount = stages.filter(s => s.status === "done").length;
  const progress = stages.length ? Math.round((doneCount / stages.length) * 100) : 0;

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Прогресс */}
      <div className="card-surface rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Прогресс проекта</p>
          <span className="text-sm font-bold text-ink">{progress}%</span>
        </div>
        <div className="h-2 bg-snow-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-ink-faint">{doneCount} из {stages.length} этапов</span>
          {stages.find(s => s.status === "in_progress") && (
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <Icon name="PlayCircle" size={11} />
              {stages.find(s => s.status === "in_progress")?.label}
            </span>
          )}
        </div>
      </div>

      {/* Этапы */}
      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const cfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
          const isOpen = openStageId === stage.id;
          const stageReports = reports[stage.id] || [];
          const photos = stageReports.filter(r => r.type === "photo");
          const docs = stageReports.filter(r => r.type === "document");
          const currentNotes = editNotes[stage.id] ?? stage.notes;

          return (
            <div key={stage.id} className={`card-surface rounded-2xl overflow-hidden transition-all ${stage.status === "done" ? "opacity-80" : ""}`}>
              {/* Заголовок этапа */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-snow/50 transition-colors"
                onClick={() => toggleStage(stage.id)}
              >
                {/* Номер + иконка */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon name={STAGE_ICONS[stage.stage_key] || "Circle"} size={18} className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-faint font-medium">Этап {idx + 1}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink mt-0.5">{stage.label}</p>
                  {(stage.started_at || stage.completed_at) && (
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      {stage.started_at && `Начат: ${fmtDate(stage.started_at)}`}
                      {stage.started_at && stage.completed_at && " · "}
                      {stage.completed_at && `Завершён: ${fmtDate(stage.completed_at)}`}
                    </p>
                  )}
                </div>

                {/* Счётчик файлов */}
                {stage.reports_count > 0 && (
                  <span className="flex items-center gap-1 text-xs text-ink-faint shrink-0">
                    <Icon name="Paperclip" size={12} /> {stage.reports_count}
                  </span>
                )}

                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-ink-faint shrink-0" />
              </div>

              {/* Раскрытая панель */}
              {isOpen && (
                <div className="border-t border-snow-dark px-5 py-4 space-y-4 animate-fade-in">
                  {/* Статус управление */}
                  <div className="flex flex-wrap gap-2">
                    {(["pending", "in_progress", "done", "skipped"] as Stage["status"][]).map(s => {
                      const c = STATUS_CONFIG[s];
                      return (
                        <button key={s} onClick={() => updateStatus(stage, s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            stage.status === s
                              ? `${c.bg} ${c.color} border-current`
                              : "border-snow-dark text-ink-muted hover:border-ink-faint"
                          }`}>
                          <Icon name={c.icon} size={12} /> {c.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Заметки */}
                  <div>
                    <label className="text-xs font-medium text-ink-muted mb-1.5 block">Заметки по этапу</label>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        className="flex-1 bg-snow border border-snow-dark rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-faint/50"
                        placeholder="Комментарии, результаты, договорённости..."
                        value={currentNotes}
                        onChange={e => setEditNotes(p => ({ ...p, [stage.id]: e.target.value }))}
                      />
                      {currentNotes !== stage.notes && (
                        <button onClick={() => saveNotes(stage)} disabled={savingNotes === stage.id}
                          className="px-3 py-2 bg-ink text-white text-xs rounded-xl hover:bg-ink-light transition-colors self-start">
                          {savingNotes === stage.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Фото */}
                  {photos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-ink-muted mb-2">Фотоотчёт ({photos.length})</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {photos.map(ph => (
                          <div key={ph.id} className="relative group aspect-square rounded-xl overflow-hidden bg-snow">
                            <a href={ph.url} target="_blank" rel="noopener noreferrer">
                              <img src={ph.url} alt={ph.name} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                            </a>
                            <button
                              onClick={() => deleteReport(stage.id, ph.id)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Icon name="X" size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Документы */}
                  {docs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-ink-muted mb-2">Документы ({docs.length})</p>
                      <div className="space-y-1.5">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-snow rounded-xl group">
                            <Icon name="FileText" size={15} className="text-ink-muted shrink-0" />
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 text-sm text-ink hover:underline truncate">{doc.name}</a>
                            <button onClick={() => deleteReport(stage.id, doc.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-red-500">
                              <Icon name="Trash2" size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Загрузка */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { activeStageRef.current = stage.id; fileInputRef.current?.setAttribute("accept", "image/*"); fileInputRef.current?.click(); }}
                      disabled={uploading === stage.id}
                      className="flex items-center gap-1.5 px-3 py-2 border border-snow-dark rounded-xl text-xs text-ink-muted hover:text-ink hover:border-ink-faint transition-colors disabled:opacity-40">
                      {uploading === stage.id ? <div className="w-3.5 h-3.5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <Icon name="Camera" size={13} />}
                      Фото
                    </button>
                    <button
                      onClick={() => { activeStageRef.current = stage.id; fileInputRef.current?.setAttribute("accept", ".pdf,.doc,.docx"); fileInputRef.current?.click(); }}
                      disabled={uploading === stage.id}
                      className="flex items-center gap-1.5 px-3 py-2 border border-snow-dark rounded-xl text-xs text-ink-muted hover:text-ink hover:border-ink-faint transition-colors disabled:opacity-40">
                      <Icon name="Paperclip" size={13} /> Документ
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
    </div>
  );
}
